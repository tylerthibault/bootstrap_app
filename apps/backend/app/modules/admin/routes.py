import json
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from ...extensions import db

from ...rbac import current_identity, requires_permission

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/")
@requires_permission("admin:access")
def admin_index():
  identity = current_identity()
  return jsonify(
    {
      "ok": True,
      "data": {
        "module": "admin",
        "status": "configured",
        "viewer": {
          "user_id": identity["user_id"],
          "roles": identity["roles"],
        },
      },
    }
  ), 200


def _iso_now() -> str:
  return datetime.now(timezone.utc).isoformat()


def _json_body() -> dict:
  body = request.get_json(silent=True)
  return body if isinstance(body, dict) else {}


def _write_audit(actor_user_id: int, target_user_id: int | None, action: str, before: dict | None, after: dict | None) -> None:
  db.session.execute(
    text(
      """
      INSERT INTO audit_logs (actor_user_id, target_user_id, action, before_json, after_json)
      VALUES (:actor_user_id, :target_user_id, :action, :before_json, :after_json)
      """
    ),
    {
      "actor_user_id": actor_user_id,
      "target_user_id": target_user_id,
      "action": action,
      "before_json": json.dumps(before) if before is not None else None,
      "after_json": json.dumps(after) if after is not None else None,
    },
  )


def _parse_pagination() -> tuple[int, int, int]:
  try:
    page = max(1, int(request.args.get("page", "1")))
    page_size = max(1, min(50, int(request.args.get("page_size", "10"))))
  except ValueError:
    page = 1
    page_size = 10
  offset = (page - 1) * page_size
  return page, page_size, offset


@admin_bp.get("/users")
@requires_permission("admin:user:read")
def list_users():
  query = request.args.get("q", "").strip().lower()
  status = request.args.get("status", "").strip().lower()
  role = request.args.get("role", "").strip().lower()
  page, page_size, offset = _parse_pagination()

  where_clauses = ["1 = 1"]
  params: dict[str, object] = {
    "limit": page_size,
    "offset": offset,
  }

  if query:
    where_clauses.append("(lower(u.email) LIKE :query OR lower(coalesce(u.display_name, '')) LIKE :query)")
    params["query"] = f"%{query}%"
  if status:
    where_clauses.append("lower(u.status) = :status")
    params["status"] = status
  if role:
    where_clauses.append(
      "EXISTS (SELECT 1 FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id WHERE ur2.user_id = u.id AND lower(r2.name) = :role)"
    )
    params["role"] = role

  where_sql = " AND ".join(where_clauses)

  count_row = db.session.execute(
    text(f"SELECT COUNT(*) AS total FROM users u WHERE {where_sql}"),
    params,
  ).mappings().first()

  rows = db.session.execute(
    text(
      f"""
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.status,
        u.email_verified,
        u.created_at,
        u.updated_at,
        COALESCE(group_concat(r.name, ','), '') AS roles_csv
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE {where_sql}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT :limit OFFSET :offset
      """
    ),
    params,
  ).mappings().all()

  users = []
  for row in rows:
    roles = [role_name for role_name in str(row["roles_csv"]).split(",") if role_name]
    users.append(
      {
        "id": row["id"],
        "email": row["email"],
        "display_name": row["display_name"],
        "status": row["status"],
        "email_verified": bool(row["email_verified"]),
        "roles": roles,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
      }
    )

  total = int(count_row["total"]) if count_row else 0
  return jsonify(
    {
      "ok": True,
      "data": {
        "users": users,
        "pagination": {
          "page": page,
          "page_size": page_size,
          "total": total,
          "total_pages": (total + page_size - 1) // page_size,
        },
      },
    }
  ), 200


@admin_bp.put("/users/<int:user_id>/roles")
@requires_permission("admin:role:assign")
def assign_user_roles(user_id: int):
  actor = current_identity()
  body = _json_body()
  roles = body.get("roles", [])
  if not isinstance(roles, list) or not roles:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "roles must be a non-empty list"}}), 400

  normalized_roles = sorted({str(role_name).strip().lower() for role_name in roles if str(role_name).strip()})
  if not normalized_roles:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "roles must contain valid role names"}}), 400

  existing_user = db.session.execute(
    text("SELECT id FROM users WHERE id = :id LIMIT 1"),
    {"id": user_id},
  ).mappings().first()
  if not existing_user:
    return jsonify({"ok": False, "error": {"code": "NOT_FOUND", "message": "User not found"}}), 404

  valid_role_rows = db.session.execute(
    text("SELECT id, name FROM roles"),
  ).mappings().all()
  valid_roles = {str(row["name"]).lower(): row["id"] for row in valid_role_rows}

  missing = [role_name for role_name in normalized_roles if role_name not in valid_roles]
  if missing:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "Unknown role(s)", "details": {"roles": missing}}}), 400

  before_rows = db.session.execute(
    text(
      """
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = :user_id
      ORDER BY r.name ASC
      """
    ),
    {"user_id": user_id},
  ).mappings().all()
  before_roles = [row["name"] for row in before_rows]

  db.session.execute(
    text("DELETE FROM user_roles WHERE user_id = :user_id"),
    {"user_id": user_id},
  )

  for role_name in normalized_roles:
    db.session.execute(
      text("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (:user_id, :role_id, :created_at)"),
      {
        "user_id": user_id,
        "role_id": valid_roles[role_name],
        "created_at": _iso_now(),
      },
    )

  _write_audit(
    actor_user_id=actor["user_id"],
    target_user_id=user_id,
    action="admin.user.roles.updated",
    before={"roles": before_roles},
    after={"roles": normalized_roles},
  )
  db.session.commit()

  return jsonify({"ok": True, "data": {"user_id": user_id, "roles": normalized_roles}}), 200


@admin_bp.patch("/users/<int:user_id>/status")
@requires_permission("admin:user:update")
def update_user_status(user_id: int):
  actor = current_identity()
  body = _json_body()
  new_status = str(body.get("status", "")).strip().lower()
  if new_status not in {"active", "disabled"}:
    return jsonify({"ok": False, "error": {"code": "VALIDATION_ERROR", "message": "status must be one of: active, disabled"}}), 400

  existing = db.session.execute(
    text("SELECT id, status FROM users WHERE id = :id LIMIT 1"),
    {"id": user_id},
  ).mappings().first()
  if not existing:
    return jsonify({"ok": False, "error": {"code": "NOT_FOUND", "message": "User not found"}}), 404

  db.session.execute(
    text("UPDATE users SET status = :status, updated_at = :updated_at WHERE id = :id"),
    {
      "status": new_status,
      "updated_at": _iso_now(),
      "id": user_id,
    },
  )

  _write_audit(
    actor_user_id=actor["user_id"],
    target_user_id=user_id,
    action="admin.user.status.updated",
    before={"status": existing["status"]},
    after={"status": new_status},
  )
  db.session.commit()

  return jsonify({"ok": True, "data": {"user_id": user_id, "status": new_status}}), 200


@admin_bp.post("/users/<int:user_id>/sessions/revoke")
@requires_permission("admin:session:revoke")
def revoke_user_sessions(user_id: int):
  actor = current_identity()
  body = _json_body()
  session_id = body.get("session_id")

  existing_user = db.session.execute(
    text("SELECT id FROM users WHERE id = :id LIMIT 1"),
    {"id": user_id},
  ).mappings().first()
  if not existing_user:
    return jsonify({"ok": False, "error": {"code": "NOT_FOUND", "message": "User not found"}}), 404

  if session_id is None:
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
        "user_id": user_id,
      },
    )
    action = "admin.user.sessions.revoked_all"
    before = {"scope": "all"}
    after = {"scope": "all", "revoked_count": result.rowcount}
  else:
    result = db.session.execute(
      text(
        """
        UPDATE sessions
        SET revoked_at = :revoked_at
        WHERE id = :session_id
        AND user_id = :user_id
        AND revoked_at IS NULL
        """
      ),
      {
        "revoked_at": _iso_now(),
        "session_id": int(session_id),
        "user_id": user_id,
      },
    )
    action = "admin.user.session.revoked"
    before = {"scope": "single", "session_id": int(session_id)}
    after = {"scope": "single", "session_id": int(session_id), "revoked_count": result.rowcount}

  _write_audit(
    actor_user_id=actor["user_id"],
    target_user_id=user_id,
    action=action,
    before=before,
    after=after,
  )
  db.session.commit()

  return jsonify({"ok": True, "data": after}), 200


@admin_bp.get("/audit-logs")
@requires_permission("admin:audit:read")
def list_audit_logs():
  page, page_size, offset = _parse_pagination()
  action_filter = request.args.get("action", "").strip().lower()

  where_clauses = ["1 = 1"]
  params: dict[str, object] = {
    "limit": page_size,
    "offset": offset,
  }

  if action_filter:
    where_clauses.append("lower(al.action) LIKE :action")
    params["action"] = f"%{action_filter}%"

  where_sql = " AND ".join(where_clauses)

  count_row = db.session.execute(
    text(f"SELECT COUNT(*) AS total FROM audit_logs al WHERE {where_sql}"),
    params,
  ).mappings().first()

  rows = db.session.execute(
    text(
      f"""
      SELECT
        al.id,
        al.actor_user_id,
        al.target_user_id,
        al.action,
        al.before_json,
        al.after_json,
        al.created_at
      FROM audit_logs al
      WHERE {where_sql}
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT :limit OFFSET :offset
      """
    ),
    params,
  ).mappings().all()

  logs = []
  for row in rows:
    logs.append(
      {
        "id": row["id"],
        "actor_user_id": row["actor_user_id"],
        "target_user_id": row["target_user_id"],
        "action": row["action"],
        "before": json.loads(row["before_json"]) if row["before_json"] else None,
        "after": json.loads(row["after_json"]) if row["after_json"] else None,
        "created_at": row["created_at"],
      }
    )

  total = int(count_row["total"]) if count_row else 0
  return jsonify(
    {
      "ok": True,
      "data": {
        "logs": logs,
        "pagination": {
          "page": page,
          "page_size": page_size,
          "total": total,
          "total_pages": (total + page_size - 1) // page_size,
        },
      },
    }
  ), 200
