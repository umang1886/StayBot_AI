"""
StayBot AI – AI Intent Detection Service
Detects user intent using Gemini (primary) with keyword-based fallback.
Returns one of: show_menu, book_table, cancel_booking, check_availability, contact, unknown
"""
import os
import requests

VALID_INTENTS = {
    "show_menu",
    "book_table",
    "cancel_booking",
    "check_availability",
    "contact",
    "unknown",
}

INTENT_PROMPT = (
    "You are a hotel booking assistant. "
    "Detect the user's intent from the following message and return ONLY one of: "
    "show_menu, book_table, cancel_booking, check_availability, contact, unknown.\n\n"
    "Message: \"{message}\"\n\nReturn only the intent label."
)


def _keyword_fallback(text: str) -> str:
    """Simple keyword-based intent classifier used when AI is unavailable."""
    t = text.lower()
    if any(w in t for w in ["menu", "food", "eat", "dish", "items"]):
        return "show_menu"
    if any(w in t for w in ["book", "reserve", "reservation", "table"]):
        return "book_table"
    if any(w in t for w in ["cancel", "won't come", "wont come"]):
        return "cancel_booking"
    if any(w in t for w in ["available", "availability", "slot", "seat", "free"]):
        return "check_availability"
    if any(w in t for w in ["contact", "phone", "number", "reach", "address", "location"]):
        return "contact"
    return "unknown"


def detect_intent_gemini(user_message: str) -> str:
    """Call Gemini API to detect intent."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return _keyword_fallback(user_message)

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-pro:generateContent?key={api_key}"
    )
    prompt = INTENT_PROMPT.format(message=user_message)
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        raw = (
            response.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
            .lower()
        )
        return raw if raw in VALID_INTENTS else "unknown"
    except Exception:
        return _keyword_fallback(user_message)


def detect_intent(user_message: str) -> str:
    """Public entry point: tries Gemini, falls back to keywords."""
    intent = detect_intent_gemini(user_message)
    if intent == "unknown":
        intent = _keyword_fallback(user_message)
    return intent
