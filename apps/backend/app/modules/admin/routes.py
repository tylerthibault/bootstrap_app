from flask import Blueprint, jsonify

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/")
def admin_index():
  return jsonify({"module": "admin", "status": "configured"}), 200
