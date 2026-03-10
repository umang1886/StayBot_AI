"""
StayBot AI – Bookings Routes
GET    /api/bookings?hotel_id=&date=&status=  → list bookings (filtered)
GET    /api/bookings/:id                      → single booking
PUT    /api/bookings/:id                      → update booking
DELETE /api/bookings/:id                      → cancel booking
PATCH  /api/bookings/:id/complete             → mark completed
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase

bookings_bp = Blueprint("bookings", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _owner_owns_hotel(db, hotel_id: str, owner_id: str) -> bool:
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


def _owner_owns_booking(db, booking_id: str, owner_id: str) -> dict | None:
    """Returns the booking row if owned, else None."""
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return None
    booking = booking_res.data[0]
    if not _owner_owns_hotel(db, booking["hotel_id"], owner_id):
        return None
    return booking


# ── Routes ────────────────────────────────────────────────────────────────────

@bookings_bp.route("", methods=["GET"])
@jwt_required()
def list_bookings():
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    date = request.args.get("date")
    status = request.args.get("status")

    if not hotel_id:
        return jsonify({"error": "'hotel_id' query param is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    query = db.table("bookings").select("*").eq("hotel_id", hotel_id)
    if date:
        query = query.eq("date", date)
    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).limit(500).execute()
    return jsonify(result.data), 200


@bookings_bp.route("/<booking_id>", methods=["GET"])
@jwt_required()
def get_booking(booking_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    booking = _owner_owns_booking(db, booking_id, owner_id)
    if not booking:
        return jsonify({"error": "Booking not found or unauthorized.", "code": 404}), 404
    return jsonify(booking), 200


@bookings_bp.route("/<booking_id>", methods=["PUT"])
@jwt_required()
def update_booking(booking_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_booking(db, booking_id, owner_id):
        return jsonify({"error": "Booking not found or unauthorized.", "code": 404}), 404

    body = request.get_json(silent=True) or {}
    allowed = ["date", "time", "guests", "status", "notes"]
    patch = {k: body[k] for k in allowed if k in body}
    if not patch:
        return jsonify({"error": "No updatable fields provided.", "code": 400}), 400

    result = db.table("bookings").update(patch).eq("id", booking_id).execute()
    return jsonify(result.data[0]), 200


@bookings_bp.route("/<booking_id>", methods=["DELETE"])
@jwt_required()
def cancel_booking(booking_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_booking(db, booking_id, owner_id):
        return jsonify({"error": "Booking not found or unauthorized.", "code": 404}), 404

    result = db.table("bookings").update({"status": "cancelled"}).eq("id", booking_id).execute()
    return jsonify(result.data[0]), 200


@bookings_bp.route("/<booking_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_booking(booking_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    if not _owner_owns_booking(db, booking_id, owner_id):
        return jsonify({"error": "Booking not found or unauthorized.", "code": 404}), 404

    result = db.table("bookings").update({"status": "completed"}).eq("id", booking_id).execute()
    return jsonify(result.data[0]), 200
