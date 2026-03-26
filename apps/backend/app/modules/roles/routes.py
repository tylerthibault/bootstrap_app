from flask import Blueprint, jsonify

roles_bp = Blueprint("roles", __name__)


@roles_bp.get("/")
def roles_index():
  return jsonify({"module": "roles", "status": "configured"}), 200
