"""
StayBot AI – Availability Service
Checks available seats for a specific hotel / date / time slot.
"""
from db import get_supabase


def check_availability(hotel_id: str, date: str, time: str, guests: int) -> dict:
    """
    Returns:
      {
        "available": bool,
        "seats_available": int,
        "capacity": int,
        "booked": int,
        "other_slots": [{"time": ..., "available": ...}, ...]
      }
    """
    db = get_supabase()

    # Get all slots for this hotel + date
    slots_res = (
        db.table("slots")
        .select("id, time, capacity")
        .eq("hotel_id", hotel_id)
        .eq("date", date)
        .execute()
    )

    if not slots_res.data:
        return {
            "available": False,
            "seats_available": 0,
            "capacity": 0,
            "booked": 0,
            "other_slots": [],
        }

    # Get confirmed bookings for this hotel + date
    bookings_res = (
        db.table("bookings")
        .select("time, guests")
        .eq("hotel_id", hotel_id)
        .eq("date", date)
        .eq("status", "confirmed")
        .execute()
    )

    # Aggregate booked guests per time
    booked_per_time: dict[str, int] = {}
    for b in bookings_res.data:
        booked_per_time[b["time"]] = booked_per_time.get(b["time"], 0) + b["guests"]

    # Calculate availability per slot
    slot_availability = []
    requested_slot = None

    for slot in slots_res.data:
        booked = booked_per_time.get(slot["time"], 0)
        avail = max(0, slot["capacity"] - booked)
        entry = {
            "time": slot["time"],
            "capacity": slot["capacity"],
            "booked": booked,
            "available": avail,
        }
        slot_availability.append(entry)
        if slot["time"] == time:
            requested_slot = entry

    # Other slots that can accommodate the party
    other_slots = [
        s for s in slot_availability
        if s["time"] != time and s["available"] >= guests
    ]

    if requested_slot is None:
        return {
            "available": False,
            "seats_available": 0,
            "capacity": 0,
            "booked": 0,
            "other_slots": other_slots,
        }

    is_available = requested_slot["available"] >= guests

    return {
        "available": is_available,
        "seats_available": requested_slot["available"],
        "capacity": requested_slot["capacity"],
        "booked": requested_slot["booked"],
        "other_slots": other_slots,
    }
