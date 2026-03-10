# StayBot AI – Project Folder Structure

## Root Monorepo

```
staybot-ai/
│
├── backend/                    # Flask Python API
├── dashboard/                  # React Web Dashboard
├── database/                   # SQL migrations & seeds
├── n8n/                        # n8n workflow exports (JSON)
├── docs/                       # All spec files (prd.md, architecture.md, etc.)
├── scripts/                    # Utility scripts (deploy, seed, etc.)
├── .env.example                # Sample environment variables
├── .gitignore
├── docker-compose.yml          # Local dev orchestration
└── README.md
```

---

## Backend (Flask)

```
backend/
│
├── app.py                      # Flask app factory (create_app())
├── config.py                   # Config classes (Dev, Prod, Test)
├── db.py                       # Supabase client initialization
├── requirements.txt
├── .env                        # Local secrets (gitignored)
│
├── routes/                     # Blueprint route handlers
│   ├── __init__.py
│   ├── auth.py                 # /api/auth/*
│   ├── hotels.py               # /api/hotels/*
│   ├── bookings.py             # /api/bookings/*
│   ├── menu.py                 # /api/menu/*
│   ├── slots.py                # /api/slots/*
│   ├── analytics.py            # /api/analytics/*
│   ├── customers.py            # /api/customers/*
│   └── health.py               # /api/health
│
├── services/                   # Business logic layer
│   ├── __init__.py
│   ├── booking_service.py      # Booking creation, cancellation logic
│   ├── availability_service.py # Slot availability calculation
│   ├── sheets.py               # Google Sheets read/write helpers
│   ├── ai_service.py           # Gemini / OpenAI intent detection
│   └── notification_service.py # Telegram notification sender
│
├── models/                     # Supabase query wrappers
│   ├── __init__.py
│   ├── hotel.py
│   ├── booking.py
│   ├── menu_item.py
│   ├── slot.py
│   ├── owner.py
│   └── bot_session.py
│
├── middleware/                 # Flask middleware
│   ├── __init__.py
│   ├── auth.py                 # JWT helpers
│   └── validators.py           # Input validation helpers
│
├── utils/                      # Shared utilities
│   ├── __init__.py
│   ├── date_utils.py
│   ├── format_utils.py
│   └── logger.py
│
└── tests/                      # Unit and integration tests
    ├── __init__.py
    ├── test_auth.py
    ├── test_bookings.py
    ├── test_menu.py
    └── test_slots.py
```

---

## Dashboard (React)

```
dashboard/
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── .env                        # VITE_API_BASE_URL etc. (gitignored)
│
└── src/
    ├── App.jsx                 # Root component + React Router setup
    ├── main.jsx                # Vite entry point
    │
    ├── api/                    # Axios API layer
    │   ├── client.js           # Axios instance + JWT interceptor
    │   ├── auth.js             # auth API calls
    │   ├── bookings.js         # booking API calls
    │   ├── menu.js             # menu API calls
    │   ├── slots.js            # slots API calls
    │   ├── analytics.js        # analytics API calls
    │   ├── customers.js        # customer API calls
    │   └── hotels.js           # hotel API calls
    │
    ├── context/
    │   └── AuthContext.jsx     # JWT token state + login/logout
    │
    ├── hooks/                  # Custom React hooks
    │   ├── useAuth.js
    │   ├── useBookings.js
    │   ├── useMenu.js
    │   ├── useSlots.js
    │   └── useAnalytics.js
    │
    ├── pages/                  # Top-level route pages
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── HotelSetup.jsx
    │   ├── Dashboard.jsx       # Home / overview
    │   ├── Bookings.jsx
    │   ├── Menu.jsx
    │   ├── Slots.jsx
    │   ├── Analytics.jsx
    │   ├── Customers.jsx
    │   └── Settings.jsx
    │
    ├── components/             # Reusable UI components
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   ├── Topbar.jsx
    │   │   └── PageWrapper.jsx
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Table.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Spinner.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── ErrorMessage.jsx
    │   ├── bookings/
    │   │   ├── BookingTable.jsx
    │   │   ├── BookingModal.jsx
    │   │   └── BookingFilters.jsx
    │   ├── menu/
    │   │   ├── MenuTable.jsx
    │   │   └── MenuItemForm.jsx
    │   ├── slots/
    │   │   ├── SlotTable.jsx
    │   │   ├── SlotForm.jsx
    │   │   └── BulkSlotForm.jsx
    │   ├── analytics/
    │   │   ├── BookingsChart.jsx
    │   │   ├── PeakSlotsChart.jsx
    │   │   └── StatusDonut.jsx
    │   └── dashboard/
    │       ├── SummaryCard.jsx
    │       └── RecentBookings.jsx
    │
    └── utils/
        ├── dateUtils.js        # Date formatting helpers
        ├── validators.js       # Client-side validation
        └── constants.js        # App-wide constants
```

---

## Database Migrations

```
database/
│
├── migrations/
│   ├── 001_create_owners.sql
│   ├── 002_create_hotels.sql
│   ├── 003_create_slots.sql
│   ├── 004_create_bookings.sql
│   ├── 005_create_menu_items.sql
│   ├── 006_create_bot_sessions.sql
│   ├── 007_create_indexes.sql
│   └── 008_rls_policies.sql
│
└── seeds/
    ├── seed_hotels.sql         # Sample hotels for dev
    ├── seed_menu.sql           # Sample menu items
    └── seed_slots.sql          # Sample slots
```

---

## n8n Workflows

```
n8n/
│
├── workflows/
│   ├── 01_central_bot_handler.json
│   ├── 02_hotel_bot_handler.json
│   ├── 03_ai_intent_detector.json
│   ├── 04_booking_flow.json
│   ├── 05_availability_checker.json
│   ├── 06_menu_fetcher.json
│   ├── 07_booking_writer.json
│   ├── 08_owner_notifier.json
│   └── 09_session_cleanup.json
│
└── README.md                   # How to import these into n8n
```

---

## Documentation

```
docs/
│
├── prd.md
├── architecture.md
├── database.md
├── bot-flow.md
├── n8n-workflows.md
├── dashboard.md
├── rules.md
├── tasks.md
├── folder-structure.md
└── deployment.md
```

---

## Scripts

```
scripts/
│
├── setup_webhooks.py           # Register Telegram webhooks for all hotel bots
├── sync_sheets.py              # Force sync all hotels' Supabase data → Google Sheets
├── create_hotel.py             # CLI script to register a new hotel
└── cleanup_sessions.py         # Manual session cleanup utility
```

---

## Docker Compose (Local Dev)

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env

  dashboard:
    build: ./dashboard
    ports: ["3000:3000"]

  n8n:
    image: n8nio/n8n
    ports: ["5678:5678"]
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```
