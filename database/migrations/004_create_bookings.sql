-- Migration 004: Create bookings table
-- StayBot AI – All customer table reservations

CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  date             DATE NOT NULL,
  time             TEXT NOT NULL,
  guests           INTEGER NOT NULL,
  status           TEXT DEFAULT 'confirmed',  -- 'confirmed' | 'cancelled' | 'completed'
  telegram_chat_id TEXT,                       -- for follow-up messages
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
