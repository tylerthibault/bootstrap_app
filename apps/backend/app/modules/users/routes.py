from flask import Blueprint, jsonify
from sqlalchemy import text

from ...extensions import db
from ...rbac import current_identity, requires_permission

users_bp = Blueprint("users", __name__)


@users_bp.get("/")
def users_index():
  return jsonify({"module": "users", "status": "configured"}), 200


@users_bp.get("/me")
@requires_permission("profile:self:read")
def current_user_profile():
  identity = current_identity()

  user = db.session.execute(
    text(
      """
      SELECT id, email, display_name, status, email_verified, created_at, updated_at
      FROM users
      WHERE id = :id
      LIMIT 1
      """
    ),
    {"id": identity["user_id"]},
  ).mappings().first()

  if not user:
    return jsonify({"ok": False, "error": {"code": "NOT_FOUND", "message": "User not found"}}), 404

  return jsonify(
    {
      "ok": True,
      "data": {
        "profile": {
          "id": user["id"],
          "email": user["email"],
          "display_name": user["display_name"],
          "status": user["status"],
          "email_verified": bool(user["email_verified"]),
          "roles": identity["roles"],
          "created_at": user["created_at"],
          "updated_at": user["updated_at"],
        }
      },
    }
  ), 200
