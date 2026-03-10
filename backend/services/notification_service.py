"""
StayBot AI – Telegram Notification Service
Sends booking confirmation alerts to the hotel owner's Telegram chat.
"""
import os
import requests


TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def send_owner_notification(booking: dict, hotel: dict, owner_chat_id: str) -> bool:
    """
    Sends a Telegram message to the owner when a new booking is confirmed.
    Returns True on success, False on failure.
    """
    bot_token = hotel.get("bot_token") or os.environ.get("CENTRAL_BOT_TOKEN", "")
    if not bot_token or not owner_chat_id:
        return False

    message = (
        f"🔔 *New Booking — {hotel.get('hotel_name', 'Hotel')}*\n\n"
        f"👤 Name: {booking.get('name')}\n"
        f"📞 Phone: {booking.get('phone', '')[0:2]}*****{booking.get('phone', '')[-2:]}\n"
        f"👥 Guests: {booking.get('guests')}\n"
        f"📅 Date: {booking.get('date')}\n"
        f"⏰ Time: {booking.get('time')}\n"
        f"🆔 Booking ID: #{booking.get('id', '')[:8].upper()}\n\n"
        f"[Manage bookings](https://dashboard.staybot.ai)"
    )

    try:
        response = requests.post(
            TELEGRAM_API.format(token=bot_token),
            json={
                "chat_id": owner_chat_id,
                "text": message,
                "parse_mode": "Markdown",
            },
            timeout=10,
        )
        return response.status_code == 200
    except Exception:
        return False
