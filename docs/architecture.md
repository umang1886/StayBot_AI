# StayBot AI – System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER LAYER                           │
│                     Telegram App (Mobile/Web)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌─────────────────┐           ┌──────────────────────┐
│  Central Bot    │           │  Hotel-Specific Bots  │
│  @StayBotAI     │           │  @RoyalHotelBot etc.  │
└────────┬────────┘           └──────────┬────────────┘
         │                               │
         └──────────────┬────────────────┘
                        ▼
            ┌───────────────────────┐
            │   n8n Automation      │
            │   Engine (Webhooks)   │
            └──────┬──────┬─────────┘
                   │      │
        ┌──────────┘      └────────────┐
        ▼                              ▼
┌──────────────┐             ┌──────────────────┐
│  Supabase    │             │  Google Sheets   │
│  (PostgreSQL)│             │  (Per-Hotel Data)│
└──────────────┘             └──────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│   Flask API Backend              │
│   (Dashboard API + Bot Proxy)    │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│   React Owner Dashboard          │
│   (Web Portal)                   │
└──────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Central Discovery Bot (`@StayBotAI`)
- **Type:** Telegram Bot (Webhook-based)
- **Purpose:** Hotel discovery by name or city
- **Triggers:** Any message to the central bot
- **Connects to:** Supabase `hotels` table via n8n

### 2.2 Hotel-Specific Bots (e.g., `@RoyalHotelBot`)
- **Type:** Telegram Bot (Webhook-based via n8n)
- **Purpose:** Menu, availability, booking per hotel
- **Unique per hotel:** Each hotel has its own `bot_token` stored in Supabase
- **Connects to:** n8n → Supabase + Google Sheets

### 2.3 n8n Automation Engine
- **Deployment:** Self-hosted or n8n Cloud
- **Role:** Central orchestrator between Telegram, AI, Supabase, and Google Sheets
- **Workflow types:**
  - Central bot discovery workflow
  - Hotel bot message handler workflow
  - Booking creation workflow
  - Notification workflow

### 2.4 AI Intent Detection Layer
- **Models:** Gemini Pro / OpenAI GPT-3.5-turbo
- **Invoked by:** n8n HTTP Request node
- **Output:** Intent label string (e.g., `book_table`)
- **Fallback:** Keyword matching if AI call fails

### 2.5 Supabase (PostgreSQL)
- **Role:** Primary relational database
- **Tables:** `hotels`, `bookings`, `owners`, `slots`
- **Access:** Via Supabase REST API (from n8n and Flask)
- **Auth:** Row-Level Security (RLS) enabled

### 2.6 Google Sheets
- **Role:** Per-hotel operational data (menu, slots, bookings log)
- **Access:** Google Sheets API v4 (via n8n Google Sheets node)
- **Structure:** 3 sheets per hotel — Menu, Slots, Bookings

### 2.7 Flask Backend API
- **Role:** REST API for the Owner Dashboard
- **Auth:** JWT (Flask-JWT-Extended)
- **Endpoints:** Bookings CRUD, Menu CRUD, Slots CRUD, Analytics
- **Connects to:** Supabase via `supabase-py` client

### 2.8 React Owner Dashboard
- **Role:** Web portal for hotel owners
- **Auth:** Login with JWT stored in memory (no localStorage)
- **Connects to:** Flask API
- **Routes:** Bookings, Menu, Slots, Analytics, Settings

---

## 3. Data Flow – Customer Booking

```
1. Customer sends message to @RoyalHotelBot
2. Telegram delivers message to n8n webhook
3. n8n extracts: chat_id, text, bot_token
4. n8n queries Supabase: find hotel by bot_token
5. n8n sends text to AI Intent Detection API
6. AI returns intent: "book_table"
7. n8n enters booking sub-flow
8. Bot asks: date, time, guests, name, phone (multi-step state)
9. n8n checks Google Sheets Slots tab for availability
10. If available: write booking to Google Sheets + Supabase
11. Send confirmation to customer via Telegram
12. Send notification to owner via Telegram
```

---

## 4. Data Flow – Owner Dashboard

```
1. Owner opens React dashboard
2. Logs in → Flask returns JWT
3. React fetches data from Flask API (with JWT header)
4. Flask queries Supabase via supabase-py
5. Returns JSON to React
6. Owner makes changes (edit slot, add menu item)
7. React sends PUT/POST to Flask
8. Flask updates Supabase + Google Sheets
```

---

## 5. Multi-Tenancy Design

- Each hotel is a **tenant** identified by `hotel_id` (UUID)
- Each hotel has its own:
  - Telegram bot token (`bot_token` in Supabase)
  - Google Sheet (`sheet_id` in Supabase)
  - n8n webhook (registered dynamically using `bot_token`)
- Supabase RLS policies enforce data isolation by `hotel_id`

---

## 6. Environment Separation

| Environment | Purpose |
|---|---|
| `development` | Local development with `.env` |
| `staging` | Testing on real Telegram bots |
| `production` | Live with SSL, monitoring, rate limiting |

---

## 7. External Integrations

| Service | Protocol | Auth Method |
|---|---|---|
| Telegram Bot API | HTTPS Webhook | Bot Token |
| Supabase | REST / Realtime | Service Role Key |
| Google Sheets | REST API v4 | OAuth2 / Service Account |
| Gemini AI | REST | API Key |
| OpenAI | REST | API Key |
| n8n | Webhook (internal) | Basic Auth / Token |
