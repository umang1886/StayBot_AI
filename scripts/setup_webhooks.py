"""
StayBot AI – Telegram Webhook Registration Script
Run this script after deploying n8n to register Telegram webhooks for all hotel bots.

Usage:
    python scripts/setup_webhooks.py
"""
import os
import requests
from supabase import create_client
from dotenv import load_dotenv

# Load explicitly from backend/.env
env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
load_dotenv(env_path)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "https://n8n.staybot.ai")


# Webhooks settings
CENTRAL_WEBHOOK = "https://uv1096.app.n8n.cloud/webhook/central-bot-webhook"
HOTEL_WEBHOOK = "https://uv1096.app.n8n.cloud/webhook/hotel-bot-webhook"

def setup_webhooks():
    # 1. Setup Central Bot
    central_token = os.environ.get("CENTRAL_BOT_TOKEN")
    if central_token:
        r = requests.post(
            f"https://api.telegram.org/bot{central_token}/setWebhook",
            json={"url": CENTRAL_WEBHOOK},
        )
        status = "OK" if r.json().get("ok") else "FAIL"
        print(f"{status} Central Bot: {CENTRAL_WEBHOOK} - {r.json()}")

    # 2. Setup Hotel Bots
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    hotels = supabase.table("hotels").select("id, bot_token, bot_username").eq("is_active", True).execute()

    for hotel in hotels.data:
        token = hotel["bot_token"]
        # Use the hotel ID as the secret_token for n8n to identify the bot
        secret_token = hotel["id"] 
        print(f"Registering @{hotel['bot_username']} with secret_token: {secret_token}")
        r = requests.post(
            f"https://api.telegram.org/bot{token}/setWebhook",
            json={"url": HOTEL_WEBHOOK, "secret_token": secret_token},
        )
        status = "OK" if r.json().get("ok") else "FAIL"
        print(f"{status} @{hotel['bot_username']}: {HOTEL_WEBHOOK} - {r.json()}")

if __name__ == "__main__":
    setup_webhooks()
