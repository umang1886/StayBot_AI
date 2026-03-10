-- Migration 005: Create menu_items table
-- StayBot AI – Per-hotel menu items mirrored to Google Sheets

CREATE TABLE IF NOT EXISTS menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  price        NUMERIC(10, 2) NOT NULL,
  category     TEXT DEFAULT 'General',
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
