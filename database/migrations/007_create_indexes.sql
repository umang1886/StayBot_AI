-- Migration 007: Create performance indexes
-- StayBot AI

CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotels_bot_token ON hotels(bot_token);

CREATE INDEX IF NOT EXISTS idx_slots_hotel_date ON slots(hotel_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(hotel_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(hotel_id, status);

CREATE INDEX IF NOT EXISTS idx_menu_hotel ON menu_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hotel_chat ON bot_sessions(hotel_id, telegram_chat_id);
