-- Migration 001: Create owners table
-- StayBot AI – Hotel owner accounts for dashboard login

CREATE TABLE IF NOT EXISTS owners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  plan          TEXT DEFAULT 'basic',  -- 'basic' | 'premium'
  telegram_chat_id TEXT,               -- for owner Telegram notifications
  notify_telegram  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
