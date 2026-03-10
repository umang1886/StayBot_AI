"""
StayBot AI – Customers Routes
GET /api/customers?hotel_id=&search=   → list unique customers
GET /api/customers/:phone              → customer detail + booking history
GET /api/customers/export?hotel_id=   → CSV export
"""
import csv
import io
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase

customers_bp = Blueprint("customers", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _check_access(db, hotel_id: str, owner_id: str) -> bool:
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


# ── Routes ────────────────────────────────────────────────────────────────────

@customers_bp.route("", methods=["GET"])
@jwt_required()
def list_customers():
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    search = request.args.get("search", "").strip()

    if not hotel_id:
        return jsonify({"error": "'hotel_id' is required.", "code": 400}), 400

    db = _db()
    if not _check_access(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = (
        db.table("bookings")
        .select("name, phone, date, created_at")
        .eq("hotel_id", hotel_id)
        .order("created_at", desc=True)
        .limit(1000)
        .execute()
    )

    # Aggregate unique customers by phone
    customers: dict[str, dict] = {}
    for row in result.data:
        phone = row["phone"]
        if phone not in customers:
            customers[phone] = {
                "name": row["name"],
                "phone": phone,
                "total_bookings": 0,
                "last_visit": row["date"],
            }
        customers[phone]["total_bookings"] += 1
        if row["date"] > customers[phone]["last_visit"]:
            customers[phone]["last_visit"] = row["date"]

    data = list(customers.values())

    # Search filter
    if search:
        sl = search.lower()
        data = [c for c in data if sl in c["name"].lower() or sl in c["phone"]]

    data.sort(key=lambda x: x["last_visit"], reverse=True)
    return jsonify(data), 200


@customers_bp.route("/export", methods=["GET"])
@jwt_required()
def export_csv():
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return jsonify({"error": "'hotel_id' is required.", "code": 400}), 400

    db = _db()
    if not _check_access(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = (
        db.table("bookings")
        .select("name, phone, date, time, guests, status, created_at")
        .eq("hotel_id", hotel_id)
        .order("created_at", desc=True)
        .execute()
    )

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["name", "phone", "date", "time", "guests", "status", "created_at"],
    )
    writer.writeheader()
    for row in result.data:
        writer.writerow(row)

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers.csv"},
    )


@customers_bp.route("/<phone>", methods=["GET"])
@jwt_required()
def customer_detail(phone: str):
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return jsonify({"error": "'hotel_id' query param is required.", "code": 400}), 400

    db = _db()
    if not _check_access(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = (
        db.table("bookings")
        .select("*")
        .eq("hotel_id", hotel_id)
        .eq("phone", phone)
        .order("date", desc=True)
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Customer not found.", "code": 404}), 404

    customer = {
        "name": result.data[0]["name"],
        "phone": phone,
        "total_bookings": len(result.data),
        "bookings": result.data,
    }
    return jsonify(customer), 200
