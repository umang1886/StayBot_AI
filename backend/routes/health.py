"""
StayBot AI – Health Check Route
GET /api/health → { "status": "ok" }
"""
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health")
def health():
    """Simple liveness probe used by uptime monitors and deploy checks."""
    return jsonify({"status": "ok"}), 200
