"""
StayBot AI – Slots Routes
GET    /api/slots?hotel_id=&date=   → list slots
POST   /api/slots                   → add single slot
PUT    /api/slots/:id               → update capacity
DELETE /api/slots/:id               → remove slot
POST   /api/slots/bulk              → bulk create recurring slots
"""
from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase

slots_bp = Blueprint("slots", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _owner_owns_hotel(db, hotel_id: str, owner_id: str) -> bool:
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


# ── Routes ────────────────────────────────────────────────────────────────────

@slots_bp.route("", methods=["GET"])
@jwt_required()
def list_slots():
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    slot_date = request.args.get("date")

    if not hotel_id:
        return jsonify({"error": "'hotel_id' is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    query = db.table("slots").select("*, bookings(guests, status)").eq("hotel_id", hotel_id)
    if slot_date:
        query = query.eq("date", slot_date)

    result = query.order("date").order("time").limit(200).execute()
    return jsonify(result.data), 200


@slots_bp.route("", methods=["POST"])
@jwt_required()
def create_slot():
    owner_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    for field in ["hotel_id", "date", "time", "capacity"]:
        if not body.get(field) and body.get(field) != 0:
            return jsonify({"error": f"'{field}' is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, body["hotel_id"], owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = db.table("slots").insert({
        "hotel_id": body["hotel_id"],
        "date": body["date"],
        "time": body["time"],
        "capacity": int(body["capacity"]),
    }).execute()
    return jsonify(result.data[0]), 201


@slots_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_create_slots():
    """Create recurring slots for N weeks on selected days of week."""
    owner_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    for field in ["hotel_id", "days_of_week", "time", "capacity", "weeks"]:
        if body.get(field) is None:
            return jsonify({"error": f"'{field}' is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, body["hotel_id"], owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    days = [int(d) for d in body["days_of_week"]]  # 0=Mon…6=Sun
    weeks = int(body["weeks"])
    today = date.today()
    rows = []

    for week in range(weeks):
        for day in days:
            target = today + timedelta(days=(day - today.weekday()) % 7 + week * 7)
            rows.append({
                "hotel_id": body["hotel_id"],
                "date": target.isoformat(),
                "time": body["time"],
                "capacity": int(body["capacity"]),
            })

    if not rows:
        return jsonify({"error": "No slots generated.", "code": 400}), 400

    # Upsert to ignore duplicates (hotel_id, date, time) unique constraint
    result = db.table("slots").upsert(rows, on_conflict="hotel_id,date,time").execute()
    return jsonify({"created": len(result.data), "slots": result.data}), 201


@slots_bp.route("/<slot_id>", methods=["PUT"])
@jwt_required()
def update_slot(slot_id: str):
    owner_id = get_jwt_identity()
    db = _db()

    slot_res = db.table("slots").select("*").eq("id", slot_id).execute()
    if not slot_res.data:
        return jsonify({"error": "Slot not found.", "code": 404}), 404
    slot = slot_res.data[0]

    if not _owner_owns_hotel(db, slot["hotel_id"], owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    body = request.get_json(silent=True) or {}
    capacity = body.get("capacity")
    if capacity is None:
        return jsonify({"error": "'capacity' is required.", "code": 400}), 400

    result = db.table("slots").update({"capacity": int(capacity)}).eq("id", slot_id).execute()
    return jsonify(result.data[0]), 200


@slots_bp.route("/<slot_id>", methods=["DELETE"])
@jwt_required()
def delete_slot(slot_id: str):
    owner_id = get_jwt_identity()
    db = _db()

    slot_res = db.table("slots").select("*").eq("id", slot_id).execute()
    if not slot_res.data:
        return jsonify({"error": "Slot not found.", "code": 404}), 404

    if not _owner_owns_hotel(db, slot_res.data[0]["hotel_id"], owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    db.table("slots").delete().eq("id", slot_id).execute()
    return jsonify({"message": "Slot deleted."}), 200
