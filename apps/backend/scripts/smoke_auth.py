import os
import sqlite3
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = ROOT_DIR / "apps" / "backend"
DB_PATH = BACKEND_DIR / "auth_smoke.db"

if str(BACKEND_DIR) not in sys.path:
  sys.path.insert(0, str(BACKEND_DIR))


def apply_schema() -> None:
  schema = (BACKEND_DIR / "migrations" / "versions" / "0001_initial_schema.sql").read_text()
  seed = (BACKEND_DIR / "migrations" / "versions" / "0002_seed_roles.sql").read_text()
  conn = sqlite3.connect(DB_PATH)
  try:
    conn.executescript(schema)
    conn.executescript(seed)
    conn.commit()
  finally:
    conn.close()


def expect_status(name: str, status: int, expected: int, body: str) -> None:
  if status != expected:
    raise AssertionError(f"{name}: expected {expected}, got {status}, body={body}")


def run_smoke() -> None:
  if DB_PATH.exists():
    DB_PATH.unlink()

  os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
  os.environ.setdefault("SECRET_KEY", "smoke-test-secret")

  apply_schema()

  from app import create_app

  client = create_app().test_client()

  email = "smoke_user@example.com"
  password = "Passw0rd!"
  new_password = "NewPassw0rd!"

  register = client.post(
    "/api/auth/register",
    json={"email": email, "password": password, "display_name": "Smoke"},
  )
  expect_status("register", register.status_code, 201, register.get_data(as_text=True))
  register_data = register.get_json()["data"]

  verify = client.post("/api/auth/verify-email", json={"token": register_data["email_verification"]["token"]})
  expect_status("verify-email", verify.status_code, 200, verify.get_data(as_text=True))

  login = client.post("/api/auth/login", json={"email": email, "password": password})
  expect_status("login", login.status_code, 200, login.get_data(as_text=True))

  refresh = client.post("/api/auth/refresh", json={"refresh_token": login.get_json()["data"]["tokens"]["refresh_token"]})
  expect_status("refresh", refresh.status_code, 200, refresh.get_data(as_text=True))

  logout_all = client.post("/api/auth/logout-all", json={"refresh_token": refresh.get_json()["data"]["tokens"]["refresh_token"]})
  expect_status("logout-all", logout_all.status_code, 200, logout_all.get_data(as_text=True))

  refresh_after_logout_all = client.post(
    "/api/auth/refresh",
    json={"refresh_token": refresh.get_json()["data"]["tokens"]["refresh_token"]},
  )
  expect_status(
    "refresh-after-logout-all",
    refresh_after_logout_all.status_code,
    401,
    refresh_after_logout_all.get_data(as_text=True),
  )

  reset_request = client.post("/api/auth/password-reset/request", json={"email": email})
  expect_status("password-reset-request", reset_request.status_code, 200, reset_request.get_data(as_text=True))
  reset_token = reset_request.get_json()["data"].get("reset_token")
  if not reset_token:
    raise AssertionError("password-reset-request: expected reset token for existing user")

  reset_confirm = client.post(
    "/api/auth/password-reset/confirm",
    json={"token": reset_token, "new_password": new_password},
  )
  expect_status("password-reset-confirm", reset_confirm.status_code, 200, reset_confirm.get_data(as_text=True))

  old_login = client.post("/api/auth/login", json={"email": email, "password": password})
  expect_status("old-password-login", old_login.status_code, 401, old_login.get_data(as_text=True))

  new_login = client.post("/api/auth/login", json={"email": email, "password": new_password})
  expect_status("new-password-login", new_login.status_code, 200, new_login.get_data(as_text=True))

  print("SMOKE_CHECK_OK")


def main() -> int:
  keep_db = "--keep-db" in sys.argv
  try:
    run_smoke()
    return 0
  except Exception as exc:
    print(f"SMOKE_CHECK_FAILED: {exc}", file=sys.stderr)
    return 1
  finally:
    if not keep_db and DB_PATH.exists():
      DB_PATH.unlink()


if __name__ == "__main__":
  raise SystemExit(main())
