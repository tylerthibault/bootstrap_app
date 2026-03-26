import hashlib
import json
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from ...extensions import db
from ...rbac import current_identity, requires_permission

logs_bp = Blueprint("logs", __name__)


@logs_bp.get("/")
def logs_index():
  return jsonify({"module": "logs", "status": "configured"}), 200


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def _json_body() -> dict:
  body = request.get_json(silent=True)
  return body if isinstance(body, dict) else {}


def _hash_token(raw_token: str) -> str:
  return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


@logs_bp.post("/activity/heartbeat")
@requires_permission("session:self:read")
def heartbeat_activity():
  identity = current_identity()
  body = _json_body()

  action = str(body.get("action", "heartbeat")).strip() or "heartbeat"
  route = str(body.get("route", request.path)).strip() or request.path
  refresh_token = str(body.get("refresh_token", "")).strip()
  metadata = body.get("metadata", {})
  if not isinstance(metadata, dict):
    metadata = {"raw": metadata}

  now_iso = _iso_now()
  session_id = None

  if refresh_token:
    refresh_hash = _hash_token(refresh_token)
    session_row = db.session.execute(
      text(
        """
        SELECT id
        FROM sessions
        WHERE user_id = :user_id
        AND refresh_token_hash = :refresh_token_hash
        AND revoked_at IS NULL
        LIMIT 1
        """
      ),
      {
        "user_id": identity["user_id"],
        "refresh_token_hash": refresh_hash,
      },
    ).mappings().first()
    if session_row:
      session_id = session_row["id"]
      db.session.execute(
        text("UPDATE sessions SET last_activity_at = :last_activity_at WHERE id = :id"),
        {
          "last_activity_at": now_iso,
          "id": session_id,
        },
      )
  else:
    db.session.execute(
      text(
        """
        UPDATE sessions
        SET last_activity_at = :last_activity_at
        WHERE user_id = :user_id
        AND revoked_at IS NULL
        """
      ),
      {
        "last_activity_at": now_iso,
        "user_id": identity["user_id"],
      },
    )

  db.session.execute(
    text(
      """
      INSERT INTO activity_logs (user_id, session_id, action, route, metadata_json, created_at)
      VALUES (:user_id, :session_id, :action, :route, :metadata_json, :created_at)
      """
    ),
    {
      "user_id": identity["user_id"],
      "session_id": session_id,
      "action": action,
      "route": route,
      "metadata_json": json.dumps(metadata),
      "created_at": now_iso,
    },
  )

  db.session.commit()
  return jsonify({"ok": True, "data": {"heartbeat_logged": True, "session_id": session_id}}), 200


@logs_bp.get("/activity/recent")
@requires_permission("session:self:read")
def recent_activity():
  identity = current_identity()

  raw_limit = request.args.get("limit", "10")
  try:
    limit = max(1, min(int(raw_limit), 50))
  except ValueError:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "limit must be an integer"}}), 400

  rows = db.session.execute(
    text(
      """
      SELECT id, action, route, metadata_json, created_at
      FROM activity_logs
      WHERE user_id = :user_id
      ORDER BY created_at DESC
      LIMIT :limit
      """
    ),
    {
      "user_id": identity["user_id"],
      "limit": limit,
    },
  ).mappings().all()

  items = []
  for row in rows:
    metadata = None
    if row["metadata_json"]:
      try:
        metadata = json.loads(row["metadata_json"])
      except json.JSONDecodeError:
        metadata = {"raw": row["metadata_json"]}
    items.append(
      {
        "id": row["id"],
        "action": row["action"],
        "route": row["route"],
        "metadata": metadata,
        "created_at": row["created_at"],
      }
    )

  return jsonify({"ok": True, "data": {"activity": items}}), 200
