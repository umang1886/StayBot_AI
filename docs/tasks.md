# StayBot AI – Development Tasks for AI Coding Agent

## How to Use This File

Each task has:
- A unique ID
- Clear description
- Inputs/Outputs
- Files to create or modify
- Acceptance criteria

Work through tasks in order. Each phase must be complete before the next begins.

---

## Phase 1: Project Setup

### TASK-001: Initialize Project Structure
**Description:** Create the full folder structure for the monorepo.
**Files to create:** All folders and empty `__init__.py` / `index.js` files as per `folder-structure.md`
**Acceptance:** Running `ls` shows all expected directories.

---

### TASK-002: Flask Backend Setup
**Description:** Initialize Flask app with blueprints, CORS, JWT, and rate limiting.
**Files:** `backend/app.py`, `backend/config.py`, `backend/__init__.py`
**Steps:**
1. Install: `flask flask-jwt-extended flask-cors flask-limiter python-dotenv supabase bcrypt`
2. Create Flask app factory in `app.py`
3. Register all blueprints (empty for now)
4. Configure JWT, CORS, rate limiting from `.env`
5. Add health check endpoint: `GET /api/health → { status: "ok" }`

**Acceptance:** `flask run` starts without errors. `GET /api/health` returns 200.

---

### TASK-003: Supabase Setup
**Description:** Initialize Supabase project and run all table migrations.
**Files:** `backend/db.py`, `database/migrations/*.sql`
**Steps:**
1. Create Supabase project
2. Run SQL from `database.md` to create all tables
3. Enable RLS on all tables
4. Add RLS policies
5. Initialize `supabase-py` client in `backend/db.py`

**Acceptance:** All tables exist in Supabase dashboard. Client connects without errors.

---

### TASK-004: React Dashboard Setup
**Description:** Scaffold React app with routing, Tailwind CSS, and Axios.
**Files:** `dashboard/src/App.jsx`, `dashboard/src/api/client.js`
**Steps:**
1. `npm create vite@latest dashboard -- --template react`
2. Install: `tailwindcss axios react-router-dom recharts lucide-react`
3. Configure Tailwind
4. Set up React Router with placeholder pages for all routes
5. Create Axios client in `api/client.js` with base URL from `.env`

**Acceptance:** `npm run dev` shows app with navigation between placeholder pages.

---

## Phase 2: Authentication

### TASK-005: Owner Registration API
**Description:** Create `/api/auth/register` endpoint.
**File:** `backend/routes/auth.py`
**Input:** `{ full_name, email, password, phone }`
**Logic:**
1. Validate all fields
2. Check email not already registered
3. Hash password with bcrypt
4. Insert into `owners` table
5. Return JWT access token

**Acceptance:** POST with valid data returns 201 + JWT. Duplicate email returns 409.

---

### TASK-006: Owner Login API
**Description:** Create `/api/auth/login` endpoint.
**File:** `backend/routes/auth.py`
**Input:** `{ email, password }`
**Logic:**
1. Fetch owner by email
2. Compare bcrypt hash
3. Return JWT token (expires 24h)

**Acceptance:** Valid credentials return JWT. Wrong password returns 401.

---

### TASK-007: Dashboard Login UI
**Description:** Build the Login page in React.
**File:** `dashboard/src/pages/Login.jsx`
**Steps:**
1. Email + password form
2. POST to `/api/auth/login`
3. Store JWT in AuthContext
4. Redirect to `/dashboard` on success
5. Show error message on failure

**Acceptance:** Login with valid credentials navigates to dashboard.

---

### TASK-008: Auth Context & Protected Routes
**Description:** Implement JWT auth context and route guards.
**Files:** `dashboard/src/context/AuthContext.jsx`, `dashboard/src/components/ProtectedRoute.jsx`
**Logic:**
- AuthContext stores JWT token in state
- ProtectedRoute wraps all `/dashboard/*` routes
- If no token, redirect to `/login`
- Axios interceptor adds `Authorization: Bearer {token}` header

**Acceptance:** Unauthenticated access to `/dashboard` redirects to `/login`.

---

## Phase 3: Hotel Management

### TASK-009: Hotel Registration API
**Description:** Create endpoint for owner to register a hotel.
**File:** `backend/routes/hotels.py`
**Endpoint:** `POST /api/hotels`
**Input:** `{ hotel_name, city, address, bot_username, bot_token, sheet_id, contact_phone }`
**Logic:**
1. Verify JWT → get owner_id
2. Validate inputs
3. Insert into `hotels` table
4. Return created hotel object

**Acceptance:** POST returns 201 with hotel data. Duplicate bot_username returns 409.

---

### TASK-010: Hotel Setup Wizard (Dashboard)
**Description:** Multi-step form for new hotel registration.
**File:** `dashboard/src/pages/HotelSetup.jsx`
**Steps:** Step 1 (hotel info) → Step 2 (bot token entry) → Step 3 (Google Sheet link) → Done
**Acceptance:** Completing wizard creates hotel in Supabase.

---

## Phase 4: Menu Management

### TASK-011: Menu CRUD API
**Description:** Implement all menu endpoints.
**File:** `backend/routes/menu.py`
**Endpoints:**
```
GET    /api/menu?hotel_id=
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id
PATCH  /api/menu/:id/toggle
```
Each endpoint must verify owner has access to the hotel_id.

**Acceptance:** Full CRUD works. Unauthorized access returns 403.

---

### TASK-012: Menu Sync to Google Sheets
**Description:** After any menu change, sync to Google Sheets Menu tab.
**File:** `backend/services/sheets.py`
**Logic:**
- After POST/PUT/DELETE/PATCH on menu item, call `sync_menu_to_sheet(hotel_id)`
- Read all menu items from Supabase
- Clear and rewrite the Menu tab in the hotel's Google Sheet

**Acceptance:** Menu changes in dashboard are reflected in Google Sheet within 5 seconds.

---

### TASK-013: Menu Management UI
**Description:** Build Menu page in dashboard.
**File:** `dashboard/src/pages/Menu.jsx`
- Table with all menu items
- Add Item form (modal)
- Edit inline
- Toggle availability switch
- Delete with confirmation dialog

**Acceptance:** All CRUD operations work through the UI.

---

## Phase 5: Slot Management

### TASK-014: Slots CRUD API
**Description:** Implement slot management endpoints.
**File:** `backend/routes/slots.py`
**Endpoints:**
```
GET    /api/slots?hotel_id=&date=
POST   /api/slots
PUT    /api/slots/:id
DELETE /api/slots/:id
POST   /api/slots/bulk
```

**Acceptance:** CRUD works. Bulk creation generates correct recurring slots.

---

### TASK-015: Slots UI
**Description:** Build Slots management page.
**File:** `dashboard/src/pages/Slots.jsx`
- Weekly table view of slots
- Add Slot form
- Bulk slot generator (select days + time + capacity + weeks)
- Edit capacity inline

**Acceptance:** Slots created in UI appear in Supabase and Google Sheets.

---

## Phase 6: n8n Workflows

### TASK-016: Set Up n8n Instance
**Description:** Deploy n8n and configure base settings.
**Steps:**
1. Install n8n (Docker or npm)
2. Set environment variables (Supabase, Gemini, Telegram keys)
3. Configure n8n to use HTTPS webhook URL
4. Test Supabase node connection

**Acceptance:** n8n UI accessible. Supabase test query returns data.

---

### TASK-017: Central Discovery Bot Workflow
**Description:** Build Workflow 1 in n8n.
**Reference:** `n8n-workflows.md` → Workflow 1
**Steps:**
1. Create Telegram Trigger node for `@StayBotAI`
2. Add Set node for extraction
3. Add Supabase node for hotel search
4. Add Function node for formatting results
5. Add Telegram send node

**Acceptance:** Texting `@StayBotAI` with a city name returns a hotel list.

---

### TASK-018: Hotel Bot Handler Workflow
**Description:** Build Workflow 2 — main message router.
**Reference:** `n8n-workflows.md` → Workflow 2
**Steps:**
1. Telegram Trigger (dynamic per hotel token)
2. Hotel lookup by bot_token
3. Session lookup
4. Route to sub-workflows by intent

**Acceptance:** Messaging a hotel bot routes to correct flow based on user input.

---

### TASK-019: AI Intent Detection Sub-Workflow
**Description:** Build Workflow 3 — Gemini intent detection.
**Reference:** `n8n-workflows.md` → Workflow 3
**Steps:**
1. HTTP Request to Gemini API
2. Parse response
3. Keyword fallback
4. Return intent label

**Acceptance:** "I want to book a table" returns `book_table`.

---

### TASK-020: Booking Flow Sub-Workflow
**Description:** Build Workflow 4 — multi-step booking collection.
**Reference:** `n8n-workflows.md` → Workflow 4
**Steps:**
1. Switch on session.step
2. Implement each step: date → time → guests → name → phone → confirm
3. Call Availability Checker at guests step
4. Call Booking Writer on confirmation

**Acceptance:** Full booking flow works end-to-end in Telegram.

---

### TASK-021: Availability Checker Sub-Workflow
**Description:** Build Workflow 5.
**Reference:** `n8n-workflows.md` → Workflow 5

**Acceptance:** Returns correct available seat count. Suggests alternatives when full.

---

### TASK-022: Menu Fetcher Sub-Workflow
**Description:** Build Workflow 6.
**Reference:** `n8n-workflows.md` → Workflow 6

**Acceptance:** Bot sends formatted menu from Google Sheets.

---

### TASK-023: Booking Writer + Owner Notifier
**Description:** Build Workflows 7 and 8.
**Reference:** `n8n-workflows.md` → Workflows 7 & 8

**Acceptance:** Confirmed booking is written to Supabase AND Google Sheets. Owner receives Telegram notification.

---

### TASK-024: Session Cleanup Cron
**Description:** Build Workflow 9.
**Reference:** `n8n-workflows.md` → Workflow 9

**Acceptance:** Sessions older than 30 minutes are deleted automatically.

---

## Phase 7: Booking Management (Dashboard)

### TASK-025: Bookings API
**Description:** Full CRUD for bookings.
**File:** `backend/routes/bookings.py`
**Reference:** `dashboard.md` → Section 4.3

**Acceptance:** All endpoints return correct data with proper auth checks.

---

### TASK-026: Bookings UI
**Description:** Build Bookings page.
**File:** `dashboard/src/pages/Bookings.jsx`
- Filterable, searchable table
- Booking detail modal
- Cancel / Complete actions

**Acceptance:** Owners can view, filter, cancel, and complete bookings.

---

## Phase 8: Analytics

### TASK-027: Analytics API
**Description:** Implement analytics endpoints.
**File:** `backend/routes/analytics.py`
**Reference:** `dashboard.md` → Section 7.3

**Acceptance:** All analytics queries return correct aggregated data.

---

### TASK-028: Analytics UI
**Description:** Build Analytics page with charts.
**File:** `dashboard/src/pages/Analytics.jsx`
- Use `recharts` for bar, line, donut charts
- Date range filter

**Acceptance:** Charts render with real data from the API.

---

## Phase 9: Customer Database

### TASK-029: Customers API + UI
**Description:** Customer listing, detail view, CSV export.
**Files:** `backend/routes/customers.py`, `dashboard/src/pages/Customers.jsx`
**Reference:** `dashboard.md` → Section 8

**Acceptance:** Customers list shows all unique bookers. CSV export downloads correctly.

---

## Phase 10: Settings & Polish

### TASK-030: Settings Page
**Description:** Hotel profile, notification settings, password change.
**Files:** `backend/routes/hotels.py` (update endpoints), `dashboard/src/pages/Settings.jsx`

**Acceptance:** Owner can update hotel info and notification preferences.

---

### TASK-031: Dashboard Home / Summary Cards
**Description:** Build the main dashboard overview page.
**File:** `dashboard/src/pages/Dashboard.jsx`
- Summary cards (today's bookings, available slots, active menu items)
- Last 7 days bookings chart
- Recent 5 bookings table

**Acceptance:** Dashboard home shows live data.

---

### TASK-032: End-to-End Testing
**Description:** Test the full customer booking flow.
**Steps:**
1. Search hotel via `@StayBotAI`
2. Open hotel bot
3. Complete full booking flow
4. Verify booking appears in dashboard
5. Owner receives Telegram notification
6. Cancel booking from dashboard
7. Verify cancellation reflects in Google Sheets

**Acceptance:** All steps work without errors.

---

## Phase 11: Deployment

### TASK-033: Deploy Flask Backend
**Reference:** `deployment.md` → Section 3

---

### TASK-034: Deploy React Dashboard
**Reference:** `deployment.md` → Section 4

---

### TASK-035: Configure Production n8n & Webhooks
**Reference:** `deployment.md` → Section 5

---

### TASK-036: Final Security Audit
**Checklist:**
- [ ] All `.env` secrets set in production
- [ ] RLS enabled on all Supabase tables
- [ ] Rate limiting active
- [ ] CORS restricted to dashboard domain
- [ ] Bot tokens not logged
- [ ] JWT expiry set to 24h

---

## Task Summary Table

| Phase | Tasks | Count |
|---|---|---|
| Setup | 001–004 | 4 |
| Auth | 005–008 | 4 |
| Hotel | 009–010 | 2 |
| Menu | 011–013 | 3 |
| Slots | 014–015 | 2 |
| n8n | 016–024 | 9 |
| Bookings | 025–026 | 2 |
| Analytics | 027–028 | 2 |
| Customers | 029 | 1 |
| Settings | 030–031 | 2 |
| Testing | 032 | 1 |
| Deployment | 033–036 | 4 |
| **Total** | | **36** |
