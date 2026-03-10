-- Migration 003: Create slots table
-- StayBot AI – Capacity per time slot per hotel per date

CREATE TABLE IF NOT EXISTS slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time        TEXT NOT NULL,      -- e.g. '7 PM', '19:00'
  capacity    INTEGER NOT NULL DEFAULT 20,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, date, time)
);
