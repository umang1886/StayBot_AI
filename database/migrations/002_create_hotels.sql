-- Migration 002: Create hotels table
-- StayBot AI – Each row is one registered hotel/restaurant

CREATE TABLE IF NOT EXISTS hotels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES owners(id) ON DELETE CASCADE,
  hotel_name    TEXT NOT NULL,
  city          TEXT NOT NULL,
  address       TEXT,
  bot_username  TEXT UNIQUE NOT NULL,  -- e.g. RoyalHotelBot (without @)
  bot_token     TEXT UNIQUE NOT NULL,  -- encrypted Telegram token
  sheet_id      TEXT,                  -- Google Sheet ID
  contact_phone TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
