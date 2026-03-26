import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import text
from werkzeug.security import check_password_hash, generate_password_hash

from ...extensions import db

auth_bp = Blueprint("auth", __name__)


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def _success(data: dict, status_code: int = 200):
  return jsonify({"ok": True, "data": data}), status_code


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


def _json_body() -> dict:
  body = request.get_json(silent=True)
  return body if isinstance(body, dict) else {}


def _token_serializer(salt: str) -> URLSafeTimedSerializer:
  return URLSafeTimedSerializer(secret_key=current_app.config["SECRET_KEY"], salt=salt)


def _issue_access_token(user_id: int, email: str) -> str:
  serializer = _token_serializer("access-token")
  return serializer.dumps({"sub": user_id, "email": email, "type": "access"})


def _issue_email_verification_token(user_id: int, email: str) -> str:
  serializer = _token_serializer("email-verification")
  return serializer.dumps({"sub": user_id, "email": email, "type": "email_verification"})


def _issue_password_reset_token(user_id: int, email: str) -> str:
  serializer = _token_serializer("password-reset")
  return serializer.dumps({"sub": user_id, "email": email, "type": "password_reset"})


def _hash_token(raw_token: str) -> str:
  return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _parse_iso_datetime(value: str) -> datetime:
  parsed = datetime.fromisoformat(value)
  if parsed.tzinfo is None:
    return parsed.replace(tzinfo=timezone.utc)
  return parsed.astimezone(timezone.utc)


def _refresh_ttl_days() -> int:
  return int(current_app.config.get("REFRESH_TOKEN_TTL_DAYS", 30))


def _password_reset_ttl_seconds() -> int:
  return int(current_app.config.get("PASSWORD_RESET_TTL_SECONDS", 3600))


def _create_refresh_session(user_id: int) -> tuple[str, int, str]:
  refresh_token = secrets.token_urlsafe(48)
  refresh_hash = _hash_token(refresh_token)
  now_iso = _iso_now()
  expires_at = (datetime.now(timezone.utc) + timedelta(days=_refresh_ttl_days())).isoformat()

  result = db.session.execute(
    text(
      """
      INSERT INTO sessions (user_id, refresh_token_hash, device_id, ip_address, user_agent, expires_at, last_activity_at, created_at)
      VALUES (:user_id, :refresh_token_hash, :device_id, :ip_address, :user_agent, :expires_at, :last_activity_at, :created_at)
      """
    ),
    {
      "user_id": user_id,
      "refresh_token_hash": refresh_hash,
      "device_id": request.headers.get("X-Device-Id"),
      "ip_address": request.remote_addr,
      "user_agent": request.user_agent.string if request.user_agent else None,
      "expires_at": expires_at,
      "last_activity_at": now_iso,
      "created_at": now_iso,
    },
  )

  session_id = result.lastrowid
  return refresh_token, session_id, expires_at


def _fetch_user_by_email(email: str):
  return db.session.execute(
    text("SELECT id, email, password_hash, status, email_verified, display_name FROM users WHERE lower(email) = lower(:email) LIMIT 1"),
    {"email": email},
  ).mappings().first()


@auth_bp.post("/register")
def register():
  body = _json_body()
  email = str(body.get("email", "")).strip().lower()
  password = str(body.get("password", ""))
  display_name = body.get("display_name")

  if not email or not password:
    return _error("VALIDATION_ERROR", "email and password are required", 400)
  if len(password) < 8:
    return _error("VALIDATION_ERROR", "password must be at least 8 characters", 400)

  existing = _fetch_user_by_email(email)
  if existing:
    return _error("EMAIL_ALREADY_EXISTS", "An account with this email already exists", 409)

  now_iso = _iso_now()
  result = db.session.execute(
    text(
      """
      INSERT INTO users (email, password_hash, display_name, status, email_verified, created_at, updated_at)
      VALUES (:email, :password_hash, :display_name, 'active', 0, :created_at, :updated_at)
      """
    ),
    {
      "email": email,
      "password_hash": generate_password_hash(password),
      "display_name": display_name,
      "created_at": now_iso,
      "updated_at": now_iso,
    },
  )
  user_id = result.lastrowid

  db.session.execute(
    text(
      """
      INSERT INTO user_roles (user_id, role_id)
      SELECT :user_id, r.id FROM roles r
      WHERE r.name = 'user'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = :user_id AND ur.role_id = r.id
      )
      """
    ),
    {"user_id": user_id},
  )

  refresh_token, session_id, refresh_expires_at = _create_refresh_session(user_id)
  access_token = _issue_access_token(user_id, email)
  email_verification_token = _issue_email_verification_token(user_id, email)

  db.session.commit()

  return _success(
    {
      "user": {
        "id": user_id,
        "email": email,
        "display_name": display_name,
        "email_verified": False,
      },
      "tokens": {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "refresh_session_id": session_id,
        "refresh_expires_at": refresh_expires_at,
      },
      "email_verification": {
        "token": email_verification_token,
      },
    },
    status_code=201,
  )


@auth_bp.post("/login")
def login():
  body = _json_body()
  email = str(body.get("email", "")).strip().lower()
  password = str(body.get("password", ""))

  if not email or not password:
    return _error("VALIDATION_ERROR", "email and password are required", 400)

  user = _fetch_user_by_email(email)
  if not user or not user.get("password_hash"):
    return _error("INVALID_CREDENTIALS", "Invalid email or password", 401)

  if user["status"] != "active":
    return _error("ACCOUNT_INACTIVE", "User account is not active", 403)

  if not check_password_hash(user["password_hash"], password):
    return _error("INVALID_CREDENTIALS", "Invalid email or password", 401)

  refresh_token, session_id, refresh_expires_at = _create_refresh_session(user["id"])
  access_token = _issue_access_token(user["id"], user["email"])

  db.session.commit()

  return _success(
    {
      "user": {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "email_verified": bool(user["email_verified"]),
      },
      "tokens": {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "refresh_session_id": session_id,
        "refresh_expires_at": refresh_expires_at,
      },
    }
  )


@auth_bp.post("/refresh")
def refresh_token():
  body = _json_body()
  provided_refresh_token = str(body.get("refresh_token", "")).strip()

  if not provided_refresh_token:
    return _error("VALIDATION_ERROR", "refresh_token is required", 400)

  token_hash = _hash_token(provided_refresh_token)
  session_row = db.session.execute(
    text(
      """
      SELECT id, user_id, expires_at, revoked_at
      FROM sessions
      WHERE refresh_token_hash = :refresh_token_hash
      LIMIT 1
      """
    ),
    {"refresh_token_hash": token_hash},
  ).mappings().first()

  if not session_row:
    return _error("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401)

  if session_row["revoked_at"] is not None:
    return _error("INVALID_REFRESH_TOKEN", "Refresh token has been revoked", 401)

  if _parse_iso_datetime(session_row["expires_at"]) <= datetime.now(timezone.utc):
    return _error("INVALID_REFRESH_TOKEN", "Refresh token has expired", 401)

  user = db.session.execute(
    text("SELECT id, email, display_name, email_verified, status FROM users WHERE id = :id LIMIT 1"),
    {"id": session_row["user_id"]},
  ).mappings().first()

  if not user or user["status"] != "active":
    return _error("ACCOUNT_INACTIVE", "User account is not active", 403)

  now_iso = _iso_now()
  db.session.execute(
    text("UPDATE sessions SET revoked_at = :revoked_at WHERE id = :id"),
    {
      "revoked_at": now_iso,
      "id": session_row["id"],
    },
  )

  new_refresh_token, new_session_id, refresh_expires_at = _create_refresh_session(user["id"])
  access_token = _issue_access_token(user["id"], user["email"])

  db.session.commit()

  return _success(
    {
      "user": {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "email_verified": bool(user["email_verified"]),
      },
      "tokens": {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "refresh_session_id": new_session_id,
        "refresh_expires_at": refresh_expires_at,
      },
      "rotated_from_session_id": session_row["id"],
    }
  )


@auth_bp.post("/logout")
def logout():
  body = _json_body()
  provided_refresh_token = str(body.get("refresh_token", "")).strip()

  if not provided_refresh_token:
    return _error("VALIDATION_ERROR", "refresh_token is required", 400)

  now_iso = _iso_now()
  db.session.execute(
    text(
      """
      UPDATE sessions
      SET revoked_at = :revoked_at
      WHERE refresh_token_hash = :refresh_token_hash
      AND revoked_at IS NULL
      """
    ),
    {
      "revoked_at": now_iso,
      "refresh_token_hash": _hash_token(provided_refresh_token),
    },
  )

  db.session.commit()
  return _success({"logged_out": True})


@auth_bp.post("/logout-all")
def logout_all():
  body = _json_body()
  provided_refresh_token = str(body.get("refresh_token", "")).strip()

  if not provided_refresh_token:
    return _error("VALIDATION_ERROR", "refresh_token is required", 400)

  session_row = db.session.execute(
    text(
      """
      SELECT id, user_id, expires_at, revoked_at
      FROM sessions
      WHERE refresh_token_hash = :refresh_token_hash
      LIMIT 1
      """
    ),
    {"refresh_token_hash": _hash_token(provided_refresh_token)},
  ).mappings().first()

  if not session_row:
    return _error("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401)

  if session_row["revoked_at"] is not None:
    return _error("INVALID_REFRESH_TOKEN", "Refresh token has been revoked", 401)

  if _parse_iso_datetime(session_row["expires_at"]) <= datetime.now(timezone.utc):
    return _error("INVALID_REFRESH_TOKEN", "Refresh token has expired", 401)

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
      "user_id": session_row["user_id"],
    },
  )

  db.session.commit()
  return _success({"logged_out_all": True})


@auth_bp.post("/password-reset/request")
def password_reset_request():
  body = _json_body()
  email = str(body.get("email", "")).strip().lower()

  if not email:
    return _error("VALIDATION_ERROR", "email is required", 400)

  user = _fetch_user_by_email(email)
  response_data = {
    "requested": True,
    "message": "If the account exists, a reset token has been issued",
  }

  if user:
    response_data["reset_token"] = _issue_password_reset_token(user["id"], user["email"])

  return _success(response_data)


@auth_bp.post("/password-reset/confirm")
def password_reset_confirm():
  body = _json_body()
  token = str(body.get("token", "")).strip()
  new_password = str(body.get("new_password", ""))

  if not token or not new_password:
    return _error("VALIDATION_ERROR", "token and new_password are required", 400)
  if len(new_password) < 8:
    return _error("VALIDATION_ERROR", "new_password must be at least 8 characters", 400)

  serializer = _token_serializer("password-reset")
  try:
    claims = serializer.loads(token, max_age=_password_reset_ttl_seconds())
  except SignatureExpired:
    return _error("TOKEN_EXPIRED", "Password reset token has expired", 401)
  except BadSignature:
    return _error("INVALID_TOKEN", "Password reset token is invalid", 401)

  if claims.get("type") != "password_reset":
    return _error("INVALID_TOKEN", "Password reset token is invalid", 401)

  now_iso = _iso_now()
  db.session.execute(
    text(
      """
      UPDATE users
      SET password_hash = :password_hash, updated_at = :updated_at
      WHERE id = :id
      """
    ),
    {
      "password_hash": generate_password_hash(new_password),
      "updated_at": now_iso,
      "id": claims.get("sub"),
    },
  )

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
      "user_id": claims.get("sub"),
    },
  )

  db.session.commit()
  return _success({"password_reset": True})


@auth_bp.post("/verify-email")
def verify_email():
  body = _json_body()
  token = str(body.get("token", "")).strip()

  if not token:
    return _error("VALIDATION_ERROR", "token is required", 400)

  serializer = _token_serializer("email-verification")
  try:
    claims = serializer.loads(token, max_age=int(current_app.config.get("EMAIL_VERIFICATION_TTL_SECONDS", 60 * 60 * 24 * 2)))
  except SignatureExpired:
    return _error("TOKEN_EXPIRED", "Email verification token has expired", 401)
  except BadSignature:
    return _error("INVALID_TOKEN", "Email verification token is invalid", 401)

  if claims.get("type") != "email_verification":
    return _error("INVALID_TOKEN", "Email verification token is invalid", 401)

  now_iso = _iso_now()
  db.session.execute(
    text(
      """
      UPDATE users
      SET email_verified = 1, updated_at = :updated_at
      WHERE id = :id
      """
    ),
    {
      "updated_at": now_iso,
      "id": claims.get("sub"),
    },
  )

  db.session.commit()
  return _success({"email_verified": True})
