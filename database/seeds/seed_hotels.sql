-- Seed: Sample hotels for development
-- StayBot AI – Run ONLY in development environment

-- First, create a sample owner
INSERT INTO owners (id, email, password_hash, full_name, phone, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@staybot.ai',
  -- password: 'demo1234' (bcrypt hash – replace in real dev)
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJIMnkDCCHCVLZhbvTSxD.WO',
  'Demo Owner',
  '9999999999',
  'premium'
) ON CONFLICT (email) DO NOTHING;

-- Create a sample hotel
INSERT INTO hotels (id, owner_id, hotel_name, city, address, bot_username, bot_token, contact_phone)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Royal Hotel',
  'Ahmedabad',
  '123 Main Street, Ahmedabad, Gujarat',
  'RoyalHotelBot',
  'DEMO_TOKEN_REPLACE_ME',
  '+91 98765 43210'
) ON CONFLICT (bot_username) DO NOTHING;
