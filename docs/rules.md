# StayBot AI – Coding Rules, Architecture Rules & Constraints

## 1. General Coding Rules

### 1.1 Language & Runtime
- Backend: Python 3.11+ with Flask
- Frontend: React 18+ with Vite
- n8n: Latest stable version (self-hosted)
- Node.js 20+ for any tooling

### 1.2 Code Style
- Python: Follow PEP8. Use `black` formatter. Max line length: 100.
- JavaScript/JSX: Follow Airbnb style guide. Use ESLint + Prettier.
- All files must have a top-level docstring or comment block describing purpose.

### 1.3 Naming Conventions
| Layer | Convention | Example |
|---|---|---|
| Python variables | snake_case | `hotel_id`, `booking_data` |
| Python functions | snake_case | `get_booking_by_id()` |
| Python classes | PascalCase | `BookingService` |
| React components | PascalCase | `BookingTable` |
| React hooks | camelCase with `use` prefix | `useBookings` |
| CSS classes | kebab-case (Tailwind utility-first) | `text-gray-500` |
| API routes | kebab-case | `/api/menu-items` |
| DB columns | snake_case | `hotel_id`, `created_at` |

### 1.4 Error Handling
- All Flask routes must return structured JSON errors:
  ```json
  { "error": "Booking not found", "code": 404 }
  ```
- All n8n Function Nodes must wrap logic in try/catch
- All React API calls must have `.catch()` / error state handling

---

## 2. Flask API Rules

### 2.1 Blueprint Structure
- Every resource must have its own Blueprint (`bookings.py`, `menu.py`, etc.)
- Register all blueprints in `app.py` using `app.register_blueprint()`

### 2.2 Authentication
- Every protected endpoint MUST use `@jwt_required()` decorator
- JWT identity must be `owner_id` (UUID string)
- Never expose raw passwords — always use `bcrypt` hashing

### 2.3 Authorization
- After JWT validation, ALWAYS verify the owner has access to the requested `hotel_id`:
  ```python
  hotel = supabase.table('hotels').select('*').eq('id', hotel_id).eq('owner_id', owner_id).single().execute()
  if not hotel.data:
      return {"error": "Unauthorized"}, 403
  ```

### 2.4 Input Validation
- Use `marshmallow` or manual validation for all POST/PUT request bodies
- Validate: required fields, data types, string lengths, date formats
- Return 400 with descriptive error on validation failure

### 2.5 Rate Limiting
- Apply `Flask-Limiter` globally: 100 req/min per IP
- Stricter on auth endpoints: 5 req/min for `/api/auth/login`

### 2.6 CORS
- Only allow requests from the dashboard domain:
  ```python
  CORS(app, origins=["https://dashboard.staybot.ai"])
  ```

---

## 3. Supabase Rules

### 3.1 Client Usage
- Always use the **service role key** on the backend (never expose to frontend)
- Initialize a single shared `supabase` client in `app/db.py`
- Never expose `SUPABASE_SERVICE_KEY` in client-side code

### 3.2 RLS Policies
- Enable RLS on all tables from Day 1
- All queries from Flask backend use service role key (bypasses RLS — must validate ownership in code)
- Direct client queries from frontend are NOT allowed — all data goes through Flask API

### 3.3 Query Rules
- Always filter by `hotel_id` in every query involving hotel data
- Never run unbounded queries — always add `.limit()` or pagination
- Use `.single()` only when exactly one record is expected; handle missing record gracefully

---

## 4. Google Sheets Rules

### 4.1 Access
- Use a Google Service Account (not OAuth user account)
- Service account credentials stored as a JSON file, path in `.env`
- Never commit the credentials JSON to version control

### 4.2 Operations
- Always specify the exact range when reading (e.g., `A:C`, not `A:Z`)
- When appending rows, use `valueInputOption: 'USER_ENTERED'` for date/number formatting
- The Bookings sheet must always append — never overwrite

### 4.3 Sync Rules
- Supabase is the **source of truth** for all booking data
- Google Sheets is a **secondary mirror** for owner visibility / offline access
- If a conflict arises, Supabase data takes precedence

---

## 5. n8n Workflow Rules

### 5.1 Webhook Security
- All n8n webhooks must use a secret token in the URL path (not guessable)
- Example: `/webhook/abc123secret/hotel-bot`

### 5.2 Node Naming
- Name every node clearly: e.g., `"Get Hotel By Token"`, `"Detect Intent via Gemini"`
- Do not leave nodes with default names like `"HTTP Request"` or `"Function"`

### 5.3 Error Handling
- Every main workflow must have an **Error Trigger** connected to a Telegram alert node
- Errors must be logged to Supabase `error_logs` table (optional but recommended)

### 5.4 State Management
- Session data MUST be stored in Supabase `bot_sessions`, not in n8n memory
- This ensures state survives n8n restarts

### 5.5 AI Calls
- Always implement a keyword-based fallback if the AI API call fails
- Set timeout on AI HTTP Request node: 10 seconds
- Log failed AI calls for monitoring

---

## 6. Telegram Bot Rules

### 6.1 Webhook vs Polling
- Always use **webhooks** (not polling) in production
- Set webhook URL to n8n endpoint on hotel bot registration

### 6.2 Bot Token Storage
- Bot tokens stored in Supabase `hotels.bot_token` column — encrypted at rest
- Never log bot tokens in application logs

### 6.3 Message Format
- Keep messages concise (Telegram has 4096 char limit per message)
- Use emoji sparingly for readability
- Always provide clear numbered options for menu choices

### 6.4 Multi-Bot Architecture
- Each hotel bot is registered separately with Telegram BotFather
- Each bot webhook points to the same n8n workflow but with a hotel-specific URL token
- The n8n workflow identifies the hotel by matching `bot_token` in Supabase

---

## 7. Security Rules

### 7.1 Secrets Management
- All secrets go in `.env` files — never hardcoded
- Use separate `.env` files for dev/staging/production
- `.env` files must be in `.gitignore`

### 7.2 Environment Variables Required
```
# Flask
SECRET_KEY=
JWT_SECRET_KEY=
FLASK_ENV=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# AI
GEMINI_API_KEY=
OPENAI_API_KEY=

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/credentials.json

# n8n
N8N_WEBHOOK_SECRET=

# Telegram
CENTRAL_BOT_TOKEN=
```

### 7.3 Data Privacy
- Never log customer phone numbers or personal data in application logs
- Mask phone numbers in logs: `9999999999` → `99*****99`

---

## 8. React Dashboard Rules

### 8.1 State Management
- Use React Context for auth state only
- Use local `useState`/`useReducer` for component-level state
- No Redux (overkill for this project)

### 8.2 API Layer
- All API calls must go through a centralized `api/` module (Axios instance with base URL + JWT interceptor)
- Never write `fetch()` or `axios` calls directly in components

### 8.3 Storage
- JWT token stored in React state (in-memory) only
- No localStorage or sessionStorage usage

### 8.4 Loading & Error States
- Every data-fetching component must handle: loading spinner, error message, empty state

---

## 9. Architecture Constraints

| Constraint | Rule |
|---|---|
| Single database | Supabase only — no mixing with SQLite or other DBs |
| Per-hotel isolation | All queries MUST include `hotel_id` filter |
| No direct DB from frontend | All data via Flask API only |
| No hardcoded hotel data | Everything dynamic from Supabase |
| No cron in Flask | Use n8n cron workflows for all scheduled tasks |
| Bot state in DB | No in-memory session state in n8n |
| AI is optional layer | System must work with keyword fallback if AI is down |
