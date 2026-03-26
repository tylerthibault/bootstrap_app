from flask import Blueprint, jsonify

logs_bp = Blueprint("logs", __name__)


@logs_bp.get("/")
def logs_index():
  return jsonify({"module": "logs", "status": "configured"}), 200
