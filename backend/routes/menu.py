"""
StayBot AI – Menu Routes
GET    /api/menu?hotel_id=      → list menu items
POST   /api/menu                → add menu item
PUT    /api/menu/:id            → update menu item
DELETE /api/menu/:id            → delete menu item
PATCH  /api/menu/:id/toggle     → toggle availability
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_supabase

menu_bp = Blueprint("menu", __name__)
_supabase = None


def _db():
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase


def _owner_owns_hotel(db, hotel_id: str, owner_id: str) -> bool:
    res = db.table("hotels").select("id").eq("id", hotel_id).eq("owner_id", owner_id).execute()
    return bool(res.data)


def _owner_owns_item(db, item_id: str, owner_id: str) -> dict | None:
    item_res = db.table("menu_items").select("*").eq("id", item_id).execute()
    if not item_res.data:
        return None
    item = item_res.data[0]
    if not _owner_owns_hotel(db, item["hotel_id"], owner_id):
        return None
    return item


# ── Routes ────────────────────────────────────────────────────────────────────

@menu_bp.route("", methods=["GET"])
@jwt_required()
def list_menu():
    owner_id = get_jwt_identity()
    hotel_id = request.args.get("hotel_id")
    if not hotel_id:
        return jsonify({"error": "'hotel_id' is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, hotel_id, owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = db.table("menu_items").select("*").eq("hotel_id", hotel_id).order("category").execute()
    return jsonify(result.data), 200


@menu_bp.route("", methods=["POST"])
@jwt_required()
def create_item():
    owner_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    for field in ["hotel_id", "name", "price"]:
        if not body.get(field) and body.get(field) != 0:
            return jsonify({"error": f"'{field}' is required.", "code": 400}), 400

    db = _db()
    if not _owner_owns_hotel(db, body["hotel_id"], owner_id):
        return jsonify({"error": "Unauthorized", "code": 403}), 403

    result = db.table("menu_items").insert({
        "hotel_id": body["hotel_id"],
        "name": body["name"],
        "price": float(body["price"]),
        "category": body.get("category", "General"),
        "is_available": body.get("is_available", True),
    }).execute()

    # Sync to Google Sheets asynchronously (best effort)
    try:
        from services.sheets import sync_menu_to_sheet
        sync_menu_to_sheet(body["hotel_id"])
    except Exception:
        pass  # non-blocking; sheet sync failures don't fail the API

    return jsonify(result.data[0]), 201


@menu_bp.route("/<item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    item = _owner_owns_item(db, item_id, owner_id)
    if not item:
        return jsonify({"error": "Item not found or unauthorized.", "code": 404}), 404

    body = request.get_json(silent=True) or {}
    allowed = ["name", "price", "category", "is_available"]
    patch = {k: body[k] for k in allowed if k in body}
    if not patch:
        return jsonify({"error": "No updatable fields provided.", "code": 400}), 400

    result = db.table("menu_items").update(patch).eq("id", item_id).execute()

    try:
        from services.sheets import sync_menu_to_sheet
        sync_menu_to_sheet(item["hotel_id"])
    except Exception:
        pass

    return jsonify(result.data[0]), 200


@menu_bp.route("/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    item = _owner_owns_item(db, item_id, owner_id)
    if not item:
        return jsonify({"error": "Item not found or unauthorized.", "code": 404}), 404

    db.table("menu_items").delete().eq("id", item_id).execute()

    try:
        from services.sheets import sync_menu_to_sheet
        sync_menu_to_sheet(item["hotel_id"])
    except Exception:
        pass

    return jsonify({"message": "Item deleted."}), 200


@menu_bp.route("/<item_id>/toggle", methods=["PATCH"])
@jwt_required()
def toggle_item(item_id: str):
    owner_id = get_jwt_identity()
    db = _db()
    item = _owner_owns_item(db, item_id, owner_id)
    if not item:
        return jsonify({"error": "Item not found or unauthorized.", "code": 404}), 404

    new_status = not item["is_available"]
    result = db.table("menu_items").update({"is_available": new_status}).eq("id", item_id).execute()

    try:
        from services.sheets import sync_menu_to_sheet
        sync_menu_to_sheet(item["hotel_id"])
    except Exception:
        pass

    return jsonify(result.data[0]), 200
