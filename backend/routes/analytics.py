"""
StayBot AI – Analytics Routes
GET /api/analytics/bookings-per-day?hotel_id=&from=&to=
GET /api/analytics/peak-slots?hotel_id=
GET /api/analytics/repeat-customers?hotel_id=
GET /api/analytics/status-breakdown?hotel_id=
GET /api/analytics/summary?hotel_id=   (dashboard home cards)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase
from datetime import date, timedelta

analytics_bp = Blueprint("analytics", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _check_access(db, hotel_id: str, owner_id: str) -> bool:
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


def _require_hotel(db, owner_id):
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return None, jsonify({"error": "'hotel_id' is required.", "code": 400}), 400
    if not _check_access(db, hotel_id, owner_id):
        return None, jsonify({"error": "Unauthorized", "code": 403}), 403
    return hotel_id, None, None


# ── Routes ────────────────────────────────────────────────────────────────────

@analytics_bp.route("/bookings-per-day", methods=["GET"])
@jwt_required()
def bookings_per_day():
    owner_id = get_jwt_identity()
    db = _db()
    hotel_id, err_resp, err_code = _require_hotel(db, owner_id)
    if err_resp:
        return err_resp, err_code

    from_date = request.args.get("from", (date.today() - timedelta(days=30)).isoformat())
    to_date = request.args.get("to", date.today().isoformat())

    result = (
        db.table("bookings")
        .select("date, id")
        .eq("hotel_id", hotel_id)
        .gte("date", from_date)
        .lte("date", to_date)
        .execute()
    )

    # Aggregate in Python (Supabase REST doesn't support GROUP BY)
    counts: dict[str, int] = {}
    for row in result.data:
        counts[row["date"]] = counts.get(row["date"], 0) + 1

    data = [{"date": d, "bookings": c} for d, c in sorted(counts.items())]
    return jsonify(data), 200


@analytics_bp.route("/peak-slots", methods=["GET"])
@jwt_required()
def peak_slots():
    owner_id = get_jwt_identity()
    db = _db()
    hotel_id, err_resp, err_code = _require_hotel(db, owner_id)
    if err_resp:
        return err_resp, err_code

    result = (
        db.table("bookings")
        .select("time, id")
        .eq("hotel_id", hotel_id)
        .eq("status", "confirmed")
        .execute()
    )
    counts: dict[str, int] = {}
    for row in result.data:
        counts[row["time"]] = counts.get(row["time"], 0) + 1

    data = sorted([{"time": t, "bookings": c} for t, c in counts.items()],
                  key=lambda x: -x["bookings"])
    return jsonify(data), 200


@analytics_bp.route("/repeat-customers", methods=["GET"])
@jwt_required()
def repeat_customers():
    owner_id = get_jwt_identity()
    db = _db()
    hotel_id, err_resp, err_code = _require_hotel(db, owner_id)
    if err_resp:
        return err_resp, err_code

    result = (
        db.table("bookings")
        .select("phone, name")
        .eq("hotel_id", hotel_id)
        .in_("status", ["confirmed", "completed"])
        .execute()
    )

    counts: dict[str, dict] = {}
    for row in result.data:
        phone = row["phone"]
        if phone not in counts:
            counts[phone] = {"phone": phone, "name": row["name"], "visit_count": 0}
        counts[phone]["visit_count"] += 1

    data = sorted(
        [v for v in counts.values() if v["visit_count"] > 1],
        key=lambda x: -x["visit_count"],
    )
    return jsonify(data), 200


@analytics_bp.route("/status-breakdown", methods=["GET"])
@jwt_required()
def status_breakdown():
    owner_id = get_jwt_identity()
    db = _db()
    hotel_id, err_resp, err_code = _require_hotel(db, owner_id)
    if err_resp:
        return err_resp, err_code

    result = db.table("bookings").select("status").eq("hotel_id", hotel_id).execute()
    counts: dict[str, int] = {}
    for row in result.data:
        counts[row["status"]] = counts.get(row["status"], 0) + 1

    data = [{"status": s, "count": c} for s, c in counts.items()]
    return jsonify(data), 200


@analytics_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    """Dashboard home summary cards: today's bookings, available slots, active menu items."""
    owner_id = get_jwt_identity()
    db = _db()
    hotel_id, err_resp, err_code = _require_hotel(db, owner_id)
    if err_resp:
        return err_resp, err_code

    today_str = date.today().isoformat()

    # Today's bookings count
    today_bookings = (
        db.table("bookings")
        .select("id")
        .eq("hotel_id", hotel_id)
        .eq("date", today_str)
        .eq("status", "confirmed")
        .execute()
    )

    # Active menu items
    active_menu = (
        db.table("menu_items")
        .select("id")
        .eq("hotel_id", hotel_id)
        .eq("is_available", True)
        .execute()
    )

    # Today's slots
    today_slots = (
        db.table("slots")
        .select("capacity")
        .eq("hotel_id", hotel_id)
        .eq("date", today_str)
        .execute()
    )

    total_capacity = sum(s["capacity"] for s in today_slots.data)
    booked_today = sum(len(today_bookings.data) for _ in range(1))  # already counted above
    booked_guests = sum(
        1 for _ in today_bookings.data
    )

    return jsonify({
        "today_bookings": len(today_bookings.data),
        "active_menu_items": len(active_menu.data),
        "total_slot_capacity_today": total_capacity,
        "available_slots_today": max(0, total_capacity - booked_guests),
    }), 200
