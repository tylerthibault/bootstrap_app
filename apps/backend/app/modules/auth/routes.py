from flask import Blueprint, jsonify

auth_bp = Blueprint("auth", __name__)


@auth_bp.get("/")
def auth_index():
  return jsonify({"module": "auth", "status": "configured"}), 200
