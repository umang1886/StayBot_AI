"""
StayBot AI – Google Sheets Service
Syncs Supabase data to the hotel's Google Sheet (Menu, Slots, Bookings tabs).
Uses a Google Service Account for authentication.
"""
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from db import get_supabase


SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def _sheets_client():
    """Return an authenticated Google Sheets API client."""
    creds_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "./credentials/google-service-account.json")
    credentials = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=credentials, cache_discovery=False)


def _clear_and_write(service, sheet_id: str, tab: str, headers: list[str], rows: list[list]):
    """Clear a tab and rewrite with headers + rows."""
    range_notation = f"{tab}!A:Z"
    # Clear
    service.spreadsheets().values().clear(
        spreadsheetId=sheet_id, range=range_notation
    ).execute()
    # Write
    body = {"values": [headers] + rows, "majorDimension": "ROWS"}
    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=f"{tab}!A1",
        valueInputOption="USER_ENTERED",
        body=body,
    ).execute()


def sync_menu_to_sheet(hotel_id: str) -> None:
    """Read all menu items for hotel from Supabase and rewrite the Menu tab."""
    db = get_supabase()

    hotel_res = db.table("hotels").select("sheet_id").eq("id", hotel_id).single().execute()
    if not hotel_res.data or not hotel_res.data.get("sheet_id"):
        return  # No sheet linked; skip silently

    sheet_id = hotel_res.data["sheet_id"]
    items_res = db.table("menu_items").select("name, price, is_available").eq("hotel_id", hotel_id).execute()

    rows = [
        [item["name"], item["price"], "yes" if item["is_available"] else "no"]
        for item in items_res.data
    ]

    service = _sheets_client()
    _clear_and_write(service, sheet_id, "Menu", ["item", "price", "available"], rows)


def sync_slots_to_sheet(hotel_id: str) -> None:
    """Rewrite the Slots tab from Supabase."""
    db = get_supabase()
    hotel_res = db.table("hotels").select("sheet_id").eq("id", hotel_id).single().execute()
    if not hotel_res.data or not hotel_res.data.get("sheet_id"):
        return

    sheet_id = hotel_res.data["sheet_id"]
    slots_res = db.table("slots").select("date, time, capacity").eq("hotel_id", hotel_id).order("date").execute()

    rows = [[s["date"], s["time"], s["capacity"]] for s in slots_res.data]

    service = _sheets_client()
    _clear_and_write(service, sheet_id, "Slots", ["date", "time", "capacity"], rows)


def append_booking_to_sheet(hotel_id: str, booking: dict) -> None:
    """Append a single confirmed booking row to the Bookings tab."""
    db = get_supabase()
    hotel_res = db.table("hotels").select("sheet_id").eq("id", hotel_id).single().execute()
    if not hotel_res.data or not hotel_res.data.get("sheet_id"):
        return

    sheet_id = hotel_res.data["sheet_id"]
    service = _sheets_client()

    row = [
        booking.get("id", ""),
        booking.get("name", ""),
        booking.get("phone", ""),
        booking.get("date", ""),
        booking.get("time", ""),
        booking.get("guests", ""),
        booking.get("status", "confirmed"),
        booking.get("created_at", ""),
    ]

    body = {"values": [row], "majorDimension": "ROWS"}
    service.spreadsheets().values().append(
        spreadsheetId=sheet_id,
        range="Bookings!A:H",
        valueInputOption="USER_ENTERED",
        insertDataOption="INSERT_ROWS",
        body=body,
    ).execute()
