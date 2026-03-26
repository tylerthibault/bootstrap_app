from flask import Blueprint, jsonify

sessions_bp = Blueprint("sessions", __name__)


@sessions_bp.get("/")
def sessions_index():
  return jsonify({"module": "sessions", "status": "configured"}), 200
