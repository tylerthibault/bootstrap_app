from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
  return jsonify({"status": "ok", "service": "backend"}), 200


@health_bp.get("/ready")
def readiness_check():
  return jsonify({"status": "ready"}), 200
