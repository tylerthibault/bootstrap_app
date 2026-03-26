from flask import Blueprint, jsonify

users_bp = Blueprint("users", __name__)


@users_bp.get("/")
def users_index():
  return jsonify({"module": "users", "status": "configured"}), 200
