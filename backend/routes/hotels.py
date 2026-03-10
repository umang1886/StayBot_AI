"""
StayBot AI – Hotels Routes
POST   /api/hotels          → register a new hotel
GET    /api/hotels          → list owner's hotels
GET    /api/hotels/:id      → get single hotel
PUT    /api/hotels/:id      → update hotel profile
PUT    /api/hotels/:id/sheet → re-link Google Sheet
DELETE /api/hotels/:id      → deactivate hotel
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase

hotels_bp = Blueprint("hotels", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _owner_owns_hotel(db, hotel_id: str, owner_id: str) -> bool:
    """Authorization check – returns True only if the owner owns this hotel."""
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


# ── Routes ────────────────────────────────────────────────────────────────────

@hotels_bp.route("", methods=["POST"])
@jwt_required()
def create_hotel():
    owner_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    required = ["hotel_name", "city", "bot_username", "bot_token"]
    for field in required:
        if not body.get(field):
            return jsonify({"error": f"'{field}' is required.", "code": 400}), 400

    db = _db()

    # Duplicate username check
    dup = db.table("hotels").select("id").eq("bot_username", body["bot_username"]).execute()
    if dup.data:
        return jsonify({"error": "bot_username already registered.", "code": 409}), 409

    result = db.table("hotels").insert({
        "owner_id": owner_id,
        "hotel_name": body["hotel_name"],
        "city": body["city"],
        "address": body.get("address"),
        "bot_username": body["bot_username"],
        "bot_token": body["bot_token"],
        "sheet_id": body.get("sheet_id"),
        "contact_phone": body.get("contact_phone"),
        "is_active": True,
    }).execute()

    return jsonify(result.data[0]), 201


@hotels_bp.route("", methods=["GET"])
@jwt_required()
def list_hotels():
    owner_id = get_jwt_identity()
    db = _db()
    result = db.table("hotels").select("*").eq("owner_id", owner_id).order("created_at", desc=True).execute()
    return jsonify(result.data), 200


@hotels_bp.route("/<hotel_id>", methods=["GET"])
@jwt_required()
def get_hotel(hotel_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403
    result = db.table("hotels").select("*").eq("id", hotel_id).single().execute()
    return jsonify(result.data), 200


@hotels_bp.route("/<hotel_id>", methods=["PUT"])
@jwt_required()
def update_hotel(hotel_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    body = request.get_json(silent=True) or {}
    allowed = ["hotel_name", "city", "address", "contact_phone"]
    patch = {k: body[k] for k in allowed if k in body}
    if not patch:
        return jsonify({"error": "No updatable fields provided.", "code": 400}), 400

    result = db.table("hotels").update(patch).eq("id", hotel_id).execute()
    return jsonify(result.data[0]), 200


@hotels_bp.route("/<hotel_id>/sheet", methods=["PUT"])
@jwt_required()
def update_sheet(hotel_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    body = request.get_json(silent=True) or {}
    sheet_id = body.get("sheet_id")
    if not sheet_id:
        return jsonify({"error": "'sheet_id' is required.", "code": 400}), 400

    db.table("hotels").update({"sheet_id": sheet_id}).eq("id", hotel_id).execute()
    return jsonify({"message": "Google Sheet linked successfully."}), 200


@hotels_bp.route("/<hotel_id>", methods=["DELETE"])
@jwt_required()
def deactivate_hotel(hotel_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    db.table("hotels").update({"is_active": False}).eq("id", hotel_id).execute()
    return jsonify({"message": "Hotel deactivated."}), 200
