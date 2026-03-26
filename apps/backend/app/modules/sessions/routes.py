import hashlib
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from ...extensions import db
from ...rbac import current_identity, requires_permission

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.get("/")
def sessions_index():
  return jsonify({"module": "sessions", "status": "configured"}), 200


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def _hash_token(raw_token: str) -> str:
  return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _json_body() -> dict:
  body = request.get_json(silent=True)
  return body if isinstance(body, dict) else {}


@sessions_bp.get("/me")
@requires_permission("session:self:read")
def list_my_sessions():
  identity = current_identity()
  rows = db.session.execute(
    text(
      """
      SELECT id, device_id, ip_address, user_agent, expires_at, last_activity_at, revoked_at, created_at
      FROM sessions
      WHERE user_id = :user_id
      ORDER BY created_at DESC
      LIMIT 25
      """
    ),
    {"user_id": identity["user_id"]},
  ).mappings().all()

  sessions = [
    {
      "id": row["id"],
      "device_id": row["device_id"],
      "ip_address": row["ip_address"],
      "user_agent": row["user_agent"],
      "expires_at": row["expires_at"],
      "last_activity_at": row["last_activity_at"],
      "revoked_at": row["revoked_at"],
      "created_at": row["created_at"],
      "is_active": row["revoked_at"] is None,
    }
    for row in rows
  ]

  return jsonify({"ok": True, "data": {"sessions": sessions}}), 200


@sessions_bp.post("/current/logout")
@requires_permission("session:self:revoke")
def logout_current_session():
  identity = current_identity()
  body = _json_body()
  refresh_token = str(body.get("refresh_token", "")).strip()
  if not refresh_token:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "refresh_token is required"}}), 400

  result = db.session.execute(
    text(
      """
      UPDATE sessions
      SET revoked_at = :revoked_at
      WHERE user_id = :user_id
      AND refresh_token_hash = :refresh_token_hash
      AND revoked_at IS NULL
      """
    ),
    {
      "revoked_at": _iso_now(),
      "user_id": identity["user_id"],
      "refresh_token_hash": _hash_token(refresh_token),
    },
  )

  db.session.commit()
  return jsonify({"ok": True, "data": {"logged_out_current": result.rowcount > 0}}), 200


@sessions_bp.post("/all/logout")
@requires_permission("session:self:revoke")
def logout_all_sessions():
  identity = current_identity()
  result = db.session.execute(
    text(
      """
      UPDATE sessions
      SET revoked_at = :revoked_at
      WHERE user_id = :user_id
      AND revoked_at IS NULL
      """
    ),
    {
      "revoked_at": _iso_now(),
      "user_id": identity["user_id"],
    },
  )

  db.session.commit()
  return jsonify({"ok": True, "data": {"logged_out_all": True, "revoked_count": result.rowcount}}), 200
