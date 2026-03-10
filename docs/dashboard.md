# StayBot AI – Owner Dashboard Specification

## 1. Overview

The Owner Dashboard is a React web application backed by a Flask REST API. It gives hotel owners full control over their bot, bookings, menu, slots, and analytics.

**Tech Stack:**
- Frontend: React (Vite)
- Styling: Tailwind CSS
- API: Flask (Python)
- Auth: JWT (Flask-JWT-Extended)
- DB: Supabase via `supabase-py`

**Base URL:** `https://dashboard.staybot.ai`

---

## 2. Authentication Module

### 2.1 Login Page (`/login`)
- Email + Password form
- POST `/api/auth/login` → returns `access_token`
- Token stored in React state / memory (not localStorage)
- Redirect to `/dashboard` on success

### 2.2 Register Page (`/register`)
- Owner registration: full_name, email, password, phone
- POST `/api/auth/register`
- After registration → redirect to hotel setup wizard

### 2.3 JWT Middleware (Flask)
```python
@jwt_required()
def protected_route():
    owner_id = get_jwt_identity()
```

---

## 3. Dashboard Home (`/dashboard`)

### Summary Cards (top row)
| Card | Data | Source |
|---|---|---|
| Total Bookings Today | COUNT bookings WHERE date=today | Supabase |
| Available Slots Right Now | SUM available seats | Supabase |
| Total Revenue This Month | (future feature placeholder) | — |
| Active Menu Items | COUNT menu_items WHERE is_available=true | Supabase |

### Quick Graphs
- Bookings over the last 7 days (bar chart)
- Today's slot occupancy by time (horizontal bar)

### Recent Bookings Table
- Last 5 bookings with: Name, Time, Guests, Status
- Link to full bookings page

---

## 4. Booking Management Module (`/dashboard/bookings`)

### 4.1 Bookings List View

**Table columns:**
| Column | Description |
|---|---|
| # | Booking ID |
| Name | Customer name |
| Phone | Customer phone |
| Date | Booking date |
| Time | Time slot |
| Guests | Number of guests |
| Status | confirmed / cancelled / completed |
| Actions | Edit, Cancel, Complete |

**Filters:**
- Date picker (filter by date range)
- Status dropdown (All / Confirmed / Cancelled / Completed)
- Search by name or phone

### 4.2 Booking Detail Modal

On clicking a booking row, open modal with:
- Full booking details
- Edit fields: date, time, guests, status
- Save / Cancel buttons

### 4.3 API Endpoints (Bookings)

```
GET    /api/bookings?hotel_id=&date=&status=   → list bookings
GET    /api/bookings/:id                        → single booking
PUT    /api/bookings/:id                        → update booking
DELETE /api/bookings/:id                        → cancel booking
PATCH  /api/bookings/:id/complete               → mark completed
```

---

## 5. Menu Management Module (`/dashboard/menu`)

### 5.1 Menu List View

**Table columns:**
| Column | Description |
|---|---|
| Item Name | Dish name |
| Category | e.g., Starters, Mains, Desserts |
| Price | In ₹ |
| Available | Toggle (yes/no) |
| Actions | Edit, Delete |

### 5.2 Add Menu Item Form

Fields:
- Item Name (required)
- Category (dropdown)
- Price (number, required)
- Available (checkbox, default: checked)

On submit: POST `/api/menu` → writes to Supabase + Google Sheets

### 5.3 Edit Menu Item

Inline edit or modal. PUT `/api/menu/:id`

### 5.4 Toggle Availability

Quick toggle per row. PATCH `/api/menu/:id/toggle`

### 5.5 API Endpoints (Menu)

```
GET    /api/menu?hotel_id=    → list menu items
POST   /api/menu              → add item
PUT    /api/menu/:id          → update item
DELETE /api/menu/:id          → delete item
PATCH  /api/menu/:id/toggle   → toggle availability
```

---

## 6. Slot Management Module (`/dashboard/slots`)

### 6.1 Slot Calendar / Table View

Show a weekly calendar-style view of slots.

**Table columns:**
| Column | Description |
|---|---|
| Date | Date of the slot |
| Time | Time slot (e.g., 7 PM) |
| Capacity | Max guests allowed |
| Booked | Current booked guests |
| Available | capacity - booked |
| Actions | Edit capacity |

### 6.2 Add Slot Form

Fields:
- Date (date picker)
- Time (text input, e.g., "7 PM")
- Capacity (number input)

On submit: POST `/api/slots`

### 6.3 Bulk Slot Generator

Allow owner to set recurring slots:
- Select days of week (Mon–Sun)
- Select time
- Set capacity
- Apply for next N weeks

### 6.4 API Endpoints (Slots)

```
GET    /api/slots?hotel_id=&date=   → list slots for date
POST   /api/slots                   → add slot
PUT    /api/slots/:id               → update capacity
DELETE /api/slots/:id               → remove slot
POST   /api/slots/bulk              → bulk create recurring slots
```

---

## 7. Analytics Dashboard (`/dashboard/analytics`)

### 7.1 Available Charts

| Chart | Type | Data |
|---|---|---|
| Bookings Per Day (last 30 days) | Line Chart | COUNT bookings GROUP BY date |
| Peak Time Slots | Bar Chart | COUNT bookings GROUP BY time |
| Popular Menu Items | Pie Chart | (future: from order data) |
| Repeat Customers | Table | Customers with > 1 booking |
| Bookings by Status | Donut Chart | COUNT GROUP BY status |

### 7.2 Date Range Filter

- Preset: Today, Last 7 days, Last 30 days, Custom range

### 7.3 API Endpoints (Analytics)

```
GET /api/analytics/bookings-per-day?hotel_id=&from=&to=
GET /api/analytics/peak-slots?hotel_id=
GET /api/analytics/repeat-customers?hotel_id=
GET /api/analytics/status-breakdown?hotel_id=
```

---

## 8. Customer Database (`/dashboard/customers`)

### 8.1 Table View

| Column | Description |
|---|---|
| Name | Customer name |
| Phone | Phone number |
| Total Bookings | COUNT of all their bookings |
| Last Visit | Date of last booking |
| Status | Active / Inactive |

- Search by name or phone
- Export to CSV button

### 8.2 Customer Detail View

Click a customer → shows full booking history for that phone number.

### 8.3 API Endpoints (Customers)

```
GET /api/customers?hotel_id=&search=    → list customers
GET /api/customers/:phone               → customer detail with history
GET /api/customers/export?hotel_id=     → export CSV
```

---

## 9. Settings Module (`/dashboard/settings`)

### 9.1 Hotel Profile

- Edit: hotel_name, city, address, contact_phone
- PUT `/api/hotels/:id`

### 9.2 Bot Settings

- Display bot_username (read-only)
- Re-link Google Sheet (enter new sheet_id)
- PUT `/api/hotels/:id/sheet`

### 9.3 Notification Settings

- Toggle Telegram notifications on/off
- Enter owner's Telegram chat_id for notifications
- PUT `/api/owners/:id/notifications`

### 9.4 Password Change

- Current password + new password + confirm
- POST `/api/auth/change-password`

---

## 10. React App Structure

```
src/
├── api/           → Axios API client + endpoint functions
├── components/    → Reusable UI components (Table, Modal, Chart, etc.)
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Bookings.jsx
│   ├── Menu.jsx
│   ├── Slots.jsx
│   ├── Analytics.jsx
│   ├── Customers.jsx
│   └── Settings.jsx
├── context/       → AuthContext (JWT token state)
├── hooks/         → useAuth, useBookings, useMenu, etc.
├── utils/         → date formatters, validators
└── App.jsx        → Router setup
```

---

## 11. Flask API Blueprint Structure

```
app/
├── routes/
│   ├── auth.py       → /api/auth/*
│   ├── bookings.py   → /api/bookings/*
│   ├── menu.py       → /api/menu/*
│   ├── slots.py      → /api/slots/*
│   ├── analytics.py  → /api/analytics/*
│   ├── customers.py  → /api/customers/*
│   └── hotels.py     → /api/hotels/*
├── models/           → Supabase query functions
├── middleware/        → JWT, rate limiting, CORS
└── app.py            → Flask app factory
```
