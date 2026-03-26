import json
from datetime import datetime, timezone
from functools import wraps

from flask import current_app, g, jsonify, make_response, request
from itsdangerous import BadSignature, URLSafeTimedSerializer
from sqlalchemy import text

from .extensions import db

ROLE_PERMISSIONS = {
  "user": {
    "session:self:read",
    "session:self:revoke",
    "profile:self:read",
    "profile:self:update",
  },
  "admin": {
    "session:self:read",
    "session:self:revoke",
    "profile:self:read",
    "profile:self:update",
    "admin:access",
    "admin:user:read",
    "admin:user:update",
    "admin:role:assign",
    "admin:session:revoke",
    "admin:audit:read",
  },
}


def _error(code: str, message: str, status_code: int, details: dict | None = None):
  payload = {
    "ok": False,
    "error": {
      "code": code,
      "message": message,
    },
  }
  if details:
    payload["error"]["details"] = details
  return jsonify(payload), status_code


def _serializer() -> URLSafeTimedSerializer:
  return URLSafeTimedSerializer(secret_key=current_app.config["SECRET_KEY"], salt="access-token")


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def _parse_iso_datetime(value: str | None) -> datetime | None:
  if not value:
    return None
  parsed = datetime.fromisoformat(value)
  if parsed.tzinfo is None:
    return parsed.replace(tzinfo=timezone.utc)
  return parsed.astimezone(timezone.utc)


def _extract_bearer_token() -> str | None:
  auth_header = request.headers.get("Authorization", "")
  parts = auth_header.split(" ", 1)
  if len(parts) != 2:
    return None
  scheme, token = parts
  if scheme.lower() != "bearer" or not token:
    return None
  return token.strip()


def _resolve_identity_from_token() -> dict | None:
  token = _extract_bearer_token()
  if not token:
    return None

  try:
    claims = _serializer().loads(token)
  except BadSignature:
    return None

  if claims.get("type") != "access" or not claims.get("sub"):
    return None

  user = db.session.execute(
    text("SELECT id, email, status FROM users WHERE id = :id LIMIT 1"),
    {"id": claims["sub"]},
  ).mappings().first()
  if not user or user["status"] != "active":
    return None

  role_rows = db.session.execute(
    text(
      """
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = :user_id
      ORDER BY r.name ASC
      """
    ),
    {"user_id": user["id"]},
  ).mappings().all()

  roles = [row["name"] for row in role_rows]
  permissions: set[str] = set()
  for role in roles:
    permissions.update(ROLE_PERMISSIONS.get(role, set()))

  return {
    "user_id": user["id"],
    "email": user["email"],
    "roles": roles,
    "permissions": permissions,
  }


def _evaluate_idle_timeout(user_id: int) -> dict:
  now = datetime.now(timezone.utc)
  warning_timeout_seconds = int(current_app.config.get("IDLE_WARNING_TIMEOUT_SECONDS", 900))
  hard_timeout_seconds = int(current_app.config.get("IDLE_HARD_TIMEOUT_SECONDS", 1800))

  session_rows = db.session.execute(
    text(
      """
      SELECT id, last_activity_at
      FROM sessions
      WHERE user_id = :user_id
      AND revoked_at IS NULL
      """
    ),
    {"user_id": user_id},
  ).mappings().all()

  if not session_rows:
    return {
      "expired": True,
      "warning": False,
      "inactive_seconds": hard_timeout_seconds,
      "warning_timeout_seconds": warning_timeout_seconds,
      "hard_timeout_seconds": hard_timeout_seconds,
    }

  latest_activity = None
  for row in session_rows:
    parsed = _parse_iso_datetime(row["last_activity_at"])
    if parsed and (latest_activity is None or parsed > latest_activity):
      latest_activity = parsed

  if latest_activity is None:
    latest_activity = now

  inactive_seconds = max(0, int((now - latest_activity).total_seconds()))
  warning = inactive_seconds >= warning_timeout_seconds
  expired = inactive_seconds >= hard_timeout_seconds

  return {
    "expired": expired,
    "warning": warning,
    "inactive_seconds": inactive_seconds,
    "warning_timeout_seconds": warning_timeout_seconds,
    "hard_timeout_seconds": hard_timeout_seconds,
  }


def _enforce_idle_timeout(identity: dict) -> tuple[bool, dict]:
  idle_state = _evaluate_idle_timeout(identity["user_id"])
  g.idle_state = idle_state

  if not idle_state["expired"]:
    return True, idle_state

  now_iso = _iso_now()
  db.session.execute(
    text(
      """
      UPDATE sessions
      SET revoked_at = :revoked_at
      WHERE user_id = :user_id
      AND revoked_at IS NULL
      """
    ),
    {
      "revoked_at": now_iso,
      "user_id": identity["user_id"],
    },
  )
  db.session.execute(
    text(
      """
      INSERT INTO activity_logs (user_id, action, route, metadata_json)
      VALUES (:user_id, :action, :route, :metadata_json)
      """
    ),
    {
      "user_id": identity["user_id"],
      "action": "idle_timeout_enforced",
      "route": request.path,
      "metadata_json": json.dumps(idle_state),
    },
  )
  db.session.commit()
  return False, idle_state


def _log_denied_access(identity: dict | None, required_permission: str) -> None:
  user_id = identity["user_id"] if identity else None
  metadata = json.dumps(
    {
      "required_permission": required_permission,
      "method": request.method,
      "path": request.path,
      "roles": identity["roles"] if identity else [],
    }
  )

  db.session.execute(
    text(
      """
      INSERT INTO activity_logs (user_id, action, route, metadata_json)
      VALUES (:user_id, :action, :route, :metadata_json)
      """
    ),
    {
      "user_id": user_id,
      "action": "access_denied",
      "route": request.path,
      "metadata_json": metadata,
    },
  )

  db.session.execute(
    text(
      """
      INSERT INTO audit_logs (actor_user_id, action, before_json, after_json)
      VALUES (:actor_user_id, :action, :before_json, :after_json)
      """
    ),
    {
      "actor_user_id": user_id,
      "action": "access_denied",
      "before_json": None,
      "after_json": metadata,
    },
  )

  db.session.commit()


def requires_permission(permission: str):
  def decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
      identity = _resolve_identity_from_token()
      g.current_identity = identity

      if not identity:
        _log_denied_access(identity, permission)
        return _error(
          "UNAUTHORIZED",
          "Authentication is required",
          401,
          {"required_permission": permission},
        )

      if permission not in identity["permissions"]:
        _log_denied_access(identity, permission)
        return _error(
          "FORBIDDEN",
          "Insufficient permissions",
          403,
          {
            "required_permission": permission,
            "roles": identity["roles"],
          },
        )

      allowed, idle_state = _enforce_idle_timeout(identity)
      if not allowed:
        return _error(
          "SESSION_IDLE_TIMEOUT",
          "Session expired due to inactivity",
          401,
          {
            "inactive_seconds": idle_state["inactive_seconds"],
            "hard_timeout_seconds": idle_state["hard_timeout_seconds"],
          },
        )

      result = make_response(func(*args, **kwargs))
      if idle_state.get("warning"):
        result.headers["X-Idle-Warning"] = "true"
        result.headers["X-Idle-Inactive-Seconds"] = str(idle_state["inactive_seconds"])
        result.headers["X-Idle-Warning-Timeout-Seconds"] = str(idle_state["warning_timeout_seconds"])
      return result

    return wrapper

  return decorator


def current_identity() -> dict | None:
  identity = getattr(g, "current_identity", None)
  if identity is None:
    identity = _resolve_identity_from_token()
    g.current_identity = identity
  return identity