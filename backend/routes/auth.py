"""
StayBot AI – Auth Routes
POST /api/auth/register  → create owner account, return JWT
POST /api/auth/login     → verify credentials, return JWT
POST /api/auth/change-password
"""
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import limiter
from db import get_supabase

auth_bp = Blueprint("auth", __name__)
supabase = None  # lazy-loaded below


def _db():
    global supabase
    if supabase is None:
        supabase = get_supabase()
    return supabase


# ── Helpers ──────────────────────────────────────────────────────────────────

def _validate_register(body: dict) -> str | None:
    """Returns an error message string or None if valid."""
    required = ["full_name", "email", "password", "phone"]
    for field in required:
        if not body.get(field):
            return f"'{field}' is required."
    if len(body["password"]) < 8:
        return "Password must be at least 8 characters."
    return None


def _validate_login(body: dict) -> str | None:
    for field in ["email", "password"]:
        if not body.get(field):
            return f"'{field}' is required."
    return None


# ── Routes ───────────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5/minute")
def register():
    """Create a new owner account."""
    body = request.get_json(silent=True) or {}
    err = _validate_register(body)
    if err:
        return jsonify({"error": err, "code": 400}), 400

    db = _db()

    # Check duplicate email
    existing = db.table("owners").select("id").eq("email", body["email"]).execute()
    if existing.data:
        return jsonify({"error": "Email already registered.", "code": 409}), 409

    # Hash password
    pw_hash = bcrypt.hashpw(body["password"].encode(), bcrypt.gensalt()).decode()

    # Insert owner
    result = db.table("owners").insert({
        "email": body["email"],
        "password_hash": pw_hash,
        "full_name": body["full_name"],
        "phone": body["phone"],
        "plan": "basic",
    }).execute()

    owner = result.data[0]
    token = create_access_token(identity=owner["id"])
    return jsonify({"access_token": token, "owner_id": owner["id"]}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5/minute")
def login():
    """Authenticate and return JWT."""
    body = request.get_json(silent=True) or {}
    err = _validate_login(body)
    if err:
        return jsonify({"error": err, "code": 400}), 400

    db = _db()
    result = db.table("owners").select("*").eq("email", body["email"]).execute()
    if not result.data:
        return jsonify({"error": "Invalid credentials.", "code": 401}), 401

    owner = result.data[0]
    if not bcrypt.checkpw(body["password"].encode(), owner["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials.", "code": 401}), 401

    token = create_access_token(identity=owner["id"])
    return jsonify({
        "access_token": token,
        "owner": {
            "id": owner["id"],
            "email": owner["email"],
            "full_name": owner["full_name"],
            "plan": owner["plan"],
        },
    }), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Change the authenticated owner's password."""
    owner_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    for field in ["current_password", "new_password"]:
        if not body.get(field):
            return jsonify({"error": f"'{field}' is required.", "code": 400}), 400
    if len(body["new_password"]) < 8:
        return jsonify({"error": "New password must be at least 8 characters.", "code": 400}), 400

    db = _db()
    result = db.table("owners").select("password_hash").eq("id", owner_id).single().execute()
    if not result.data:
        return jsonify({"error": "Owner not found.", "code": 404}), 404

    if not bcrypt.checkpw(body["current_password"].encode(), result.data["password_hash"].encode()):
        return jsonify({"error": "Current password is incorrect.", "code": 401}), 401

    new_hash = bcrypt.hashpw(body["new_password"].encode(), bcrypt.gensalt()).decode()
    db.table("owners").update({"password_hash": new_hash}).eq("id", owner_id).execute()
    return jsonify({"message": "Password updated successfully."}), 200
