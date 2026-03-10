-- Migration 006: Create bot_sessions table
-- StayBot AI – Tracks multi-step Telegram conversation state per user per hotel

CREATE TABLE IF NOT EXISTS bot_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID REFERENCES hotels(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  step             TEXT NOT NULL DEFAULT 'idle',
  -- Steps: idle | awaiting_date | awaiting_time | awaiting_guests |
  --        checking_availability | awaiting_name | awaiting_phone | awaiting_confirmation
  session_data     JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, telegram_chat_id)
);
