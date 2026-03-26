import os
import sqlite3
import sys
import tempfile
import time
import unittest
import importlib
from pathlib import Path

from sqlalchemy import text

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
  sys.path.insert(0, str(BACKEND_DIR))


class AuthSessionRbacIntegrationTests(unittest.TestCase):
  def setUp(self):
    self._tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    self._tmp.close()
    self.db_path = self._tmp.name

    os.environ["DATABASE_URL"] = f"sqlite:///{self.db_path}"
    os.environ["SECRET_KEY"] = "step12-tests-secret"
    os.environ["IDLE_WARNING_TIMEOUT_SECONDS"] = "900"
    os.environ["IDLE_HARD_TIMEOUT_SECONDS"] = "1800"

    repo_root = Path(__file__).resolve().parents[3]
    backend_dir = repo_root / "apps" / "backend"
    schema_sql = (backend_dir / "migrations" / "versions" / "0001_initial_schema.sql").read_text()
    seed_sql = (backend_dir / "migrations" / "versions" / "0002_seed_roles.sql").read_text()

    conn = sqlite3.connect(self.db_path)
    conn.executescript(schema_sql)
    conn.executescript(seed_sql)
    conn.commit()
    conn.close()

    config_module = importlib.import_module("app.config")
    importlib.reload(config_module)
    app_module = importlib.import_module("app")
    importlib.reload(app_module)
    extensions_module = importlib.import_module("app.extensions")

    self.db = extensions_module.db
    self.app = app_module.create_app()
    self.client = self.app.test_client()

  def tearDown(self):
    try:
      os.unlink(self.db_path)
    except OSError:
      pass

  def _register(self, email: str, password: str = "Passw0rd!"):
    response = self.client.post(
      "/api/auth/register",
      json={"email": email, "password": password, "display_name": "Test User"},
    )
    self.assertEqual(response.status_code, 201)
    return response.get_json()["data"]

  def _login(self, email: str, password: str = "Passw0rd!"):
    response = self.client.post(
      "/api/auth/login",
      json={"email": email, "password": password},
    )
    self.assertEqual(response.status_code, 200)
    return response.get_json()["data"]

  def test_refresh_rotation_integration(self):
    registration = self._register("refresh_rotation@example.com")
    first_refresh = registration["tokens"]["refresh_token"]

    first_rotation = self.client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
    self.assertEqual(first_rotation.status_code, 200)
    second_refresh = first_rotation.get_json()["data"]["tokens"]["refresh_token"]

    old_token_attempt = self.client.post("/api/auth/refresh", json={"refresh_token": first_refresh})
    self.assertEqual(old_token_attempt.status_code, 401)

    second_rotation = self.client.post("/api/auth/refresh", json={"refresh_token": second_refresh})
    self.assertEqual(second_rotation.status_code, 200)

  def test_rbac_admin_protection_integration(self):
    regular = self._register("regular_user@example.com")
    regular_access = regular["tokens"]["access_token"]

    unauthenticated = self.client.get("/api/admin/")
    self.assertEqual(unauthenticated.status_code, 401)

    regular_attempt = self.client.get("/api/admin/", headers={"Authorization": f"Bearer {regular_access}"})
    self.assertEqual(regular_attempt.status_code, 403)

    admin_user = self._register("admin_user@example.com")
    admin_user_id = admin_user["user"]["id"]
    with self.app.app_context():
      self.db.session.execute(
        text(
          """
          INSERT INTO user_roles (user_id, role_id)
          SELECT :uid, r.id FROM roles r WHERE r.name='admin'
          AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=:uid AND ur.role_id=r.id)
          """
        ),
        {"uid": admin_user_id},
      )
      self.db.session.commit()

    admin_login = self._login("admin_user@example.com")
    admin_access = admin_login["tokens"]["access_token"]
    admin_attempt = self.client.get("/api/admin/", headers={"Authorization": f"Bearer {admin_access}"})
    self.assertEqual(admin_attempt.status_code, 200)

  def test_idle_timeout_integration(self):
    self.app.config["IDLE_WARNING_TIMEOUT_SECONDS"] = 1
    self.app.config["IDLE_HARD_TIMEOUT_SECONDS"] = 2

    registration = self._register("idle_timeout@example.com")
    access_token = registration["tokens"]["access_token"]
    refresh_token = registration["tokens"]["refresh_token"]
    user_id = registration["user"]["id"]

    headers = {"Authorization": f"Bearer {access_token}"}

    time.sleep(1.2)
    warning_response = self.client.get("/api/users/me", headers=headers)
    self.assertEqual(warning_response.status_code, 200)
    self.assertEqual(warning_response.headers.get("X-Idle-Warning"), "true")

    heartbeat = self.client.post(
      "/api/logs/activity/heartbeat",
      headers=headers,
      json={
        "action": "heartbeat",
        "route": "step12-test",
        "refresh_token": refresh_token,
        "metadata": {"source": "test"},
      },
    )
    self.assertEqual(heartbeat.status_code, 200)

    active_response = self.client.get("/api/users/me", headers=headers)
    self.assertEqual(active_response.status_code, 200)

    time.sleep(2.3)
    expired_response = self.client.get("/api/users/me", headers=headers)
    self.assertEqual(expired_response.status_code, 401)
    self.assertEqual(expired_response.get_json()["error"]["code"], "SESSION_IDLE_TIMEOUT")

    with self.app.app_context():
      active_sessions = self.db.session.execute(
        text("SELECT COUNT(*) AS c FROM sessions WHERE user_id = :uid AND revoked_at IS NULL"),
        {"uid": user_id},
      ).mappings().first()["c"]
      idle_events = self.db.session.execute(
        text("SELECT COUNT(*) AS c FROM activity_logs WHERE user_id = :uid AND action = 'idle_timeout_enforced'"),
        {"uid": user_id},
      ).mappings().first()["c"]

    self.assertEqual(active_sessions, 0)
    self.assertGreaterEqual(idle_events, 1)


if __name__ == "__main__":
  unittest.main()
