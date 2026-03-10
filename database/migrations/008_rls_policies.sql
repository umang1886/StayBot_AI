-- Migration 008: Row-Level Security Policies
-- StayBot AI – Enforce hotel-level tenant isolation

-- Enable RLS on all tables
ALTER TABLE hotels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;

-- NOTE: The Flask backend uses the service_role key which bypasses RLS.
-- Ownership is enforced in application code (routes check owner_id).
-- These policies protect against accidental direct-client access.

CREATE POLICY owner_hotel_policy ON hotels
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY owner_booking_policy ON bookings
  FOR ALL USING (hotel_id IN (
    SELECT id FROM hotels WHERE owner_id = auth.uid()
  ));

CREATE POLICY owner_slot_policy ON slots
  FOR ALL USING (hotel_id IN (
    SELECT id FROM hotels WHERE owner_id = auth.uid()
  ));

CREATE POLICY owner_menu_policy ON menu_items
  FOR ALL USING (hotel_id IN (
    SELECT id FROM hotels WHERE owner_id = auth.uid()
  ));

-- bot_sessions: readable by anonymous n8n service key (no user context)
-- RLS disabled for service role; enabled for anon role protection
