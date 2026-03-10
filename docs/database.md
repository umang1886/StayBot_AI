# StayBot AI – Database Schema (Supabase / PostgreSQL)

## 1. Overview

The Supabase database is the central data store for all hotels, bookings, owners, and slots.
Google Sheets serve as a per-hotel operational mirror for n8n read/write operations.

---

## 2. Tables

### 2.1 `owners`

Stores hotel owner accounts for dashboard login.

```sql
CREATE TABLE owners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  plan          TEXT DEFAULT 'basic',  -- 'basic' | 'premium'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.2 `hotels`

Stores each registered hotel/restaurant.

```sql
CREATE TABLE hotels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES owners(id) ON DELETE CASCADE,
  hotel_name    TEXT NOT NULL,
  city          TEXT NOT NULL,
  address       TEXT,
  bot_username  TEXT UNIQUE NOT NULL,   -- e.g. RoyalHotelBot
  bot_token     TEXT UNIQUE NOT NULL,   -- encrypted Telegram token
  sheet_id      TEXT,                   -- Google Sheet ID
  contact_phone TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX idx_hotels_bot_token ON hotels(bot_token);
```

---

### 2.3 `slots`

Defines capacity for each time slot per hotel per date.

```sql
CREATE TABLE slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time        TEXT NOT NULL,   -- e.g. '7 PM', '19:00'
  capacity    INTEGER NOT NULL DEFAULT 20,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, date, time)
);
```

**Indexes:**
```sql
CREATE INDEX idx_slots_hotel_date ON slots(hotel_id, date);
```

---

### 2.4 `bookings`

Stores all customer bookings.

```sql
CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TEXT NOT NULL,
  guests      INTEGER NOT NULL,
  status      TEXT DEFAULT 'confirmed',  -- 'confirmed' | 'cancelled' | 'completed'
  telegram_chat_id TEXT,                 -- for follow-up messages
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_date ON bookings(hotel_id, date);
CREATE INDEX idx_bookings_phone ON bookings(phone);
CREATE INDEX idx_bookings_status ON bookings(hotel_id, status);
```

---

### 2.5 `menu_items`

Stores menu items per hotel (mirrored in Google Sheets).

```sql
CREATE TABLE menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  category    TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.6 `bot_sessions`

Tracks multi-step conversation state for each user in hotel bots.

```sql
CREATE TABLE bot_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  step            TEXT NOT NULL,   -- 'awaiting_date' | 'awaiting_time' | etc.
  session_data    JSONB DEFAULT '{}',  -- stores partial booking data
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, telegram_chat_id)
);
```

---

## 3. Row-Level Security (RLS) Policies

Enable RLS on all tables to enforce tenant isolation.

```sql
-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Owners can only access their own hotels
CREATE POLICY owner_hotel_policy ON hotels
  USING (owner_id = auth.uid());

-- Owners can only access bookings for their hotels
CREATE POLICY owner_booking_policy ON bookings
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE owner_id = auth.uid()
  ));
```

---

## 4. Entity Relationship Diagram

```
owners
  └── hotels (owner_id → owners.id)
        ├── slots (hotel_id → hotels.id)
        ├── bookings (hotel_id → hotels.id)
        ├── menu_items (hotel_id → hotels.id)
        └── bot_sessions (hotel_id → hotels.id)
```

---

## 5. Availability Check Query

```sql
-- Get available seats for a specific slot
SELECT
  s.capacity,
  COALESCE(SUM(b.guests), 0) AS booked,
  s.capacity - COALESCE(SUM(b.guests), 0) AS available
FROM slots s
LEFT JOIN bookings b
  ON b.hotel_id = s.hotel_id
  AND b.date = s.date
  AND b.time = s.time
  AND b.status = 'confirmed'
WHERE s.hotel_id = :hotel_id
  AND s.date = :date
  AND s.time = :time
GROUP BY s.capacity;
```

---

## 6. Analytics Queries

### Bookings Per Day
```sql
SELECT date, COUNT(*) AS total_bookings
FROM bookings
WHERE hotel_id = :hotel_id
GROUP BY date
ORDER BY date DESC;
```

### Peak Time Slots
```sql
SELECT time, COUNT(*) AS bookings
FROM bookings
WHERE hotel_id = :hotel_id AND status = 'confirmed'
GROUP BY time
ORDER BY bookings DESC;
```

### Repeat Customers
```sql
SELECT phone, name, COUNT(*) AS visit_count
FROM bookings
WHERE hotel_id = :hotel_id AND status IN ('confirmed','completed')
GROUP BY phone, name
HAVING COUNT(*) > 1
ORDER BY visit_count DESC;
```

---

## 7. Google Sheets Schema (Per Hotel)

Each hotel's Google Sheet has the following tabs:

### Tab 1: Menu
| Column | Type | Example |
|---|---|---|
| item | string | Pizza |
| price | number | 250 |
| available | string | yes/no |

### Tab 2: Slots
| Column | Type | Example |
|---|---|---|
| date | string | 20 Jun |
| time | string | 7 PM |
| capacity | number | 20 |

### Tab 3: Bookings
| Column | Type | Example |
|---|---|---|
| booking_id | string | UUID |
| name | string | Rahul |
| phone | string | 9999999999 |
| date | string | 20 Jun |
| time | string | 8 PM |
| guests | number | 4 |
| status | string | confirmed |
| created_at | string | ISO timestamp |
