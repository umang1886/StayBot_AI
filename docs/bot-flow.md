# StayBot AI – Telegram Bot Interaction Flows

## 1. Central Discovery Bot Flow (`@StayBotAI`)

### State Machine

```
START
  │
  ▼
[/start or any message]
  │
  ▼
Send: "Welcome to StayBot AI! 🏨
Search for a hotel by name or city.
Just type your query below."
  │
  ▼
[User sends: "Ahmedabad" or "Royal Hotel"]
  │
  ▼
[n8n queries Supabase hotels table]
  │
  ├─── Results found?
  │         │
  │         ▼ YES
  │    Send numbered list:
  │    "Hotels in Ahmedabad:
  │     1. Royal Hotel
  │     2. Taj Restaurant
  │     3. Comfort Cafe"
  │         │
  │         ▼
  │    [User replies with number or hotel name]
  │         │
  │         ▼
  │    Send: "Royal Hotel ✅
  │    Open booking bot: https://t.me/RoyalHotelBot"
  │
  └─── No results?
            ▼
       Send: "No hotels found for '[query]'.
       Try a different city or hotel name."
```

---

## 2. Hotel Bot – Main Menu Flow (`@RoyalHotelBot`)

### Step 1: `/start` or first message

```
Bot sends:
━━━━━━━━━━━━━━━━━━━━━
🏨 Welcome to Royal Hotel!

Please choose an option:
1️⃣ View Menu
2️⃣ Book Table
3️⃣ Check Availability
4️⃣ Contact Us
━━━━━━━━━━━━━━━━━━━━━
Reply with the number of your choice.
```

### Step 2: Route by selection

| Input | Action |
|---|---|
| `1` or `menu` | → Menu Flow |
| `2` or `book` | → Booking Flow |
| `3` or `availability` | → Availability Flow |
| `4` or `contact` | → Contact Flow |
| anything else | → AI Intent Detection → route accordingly |

---

## 3. Menu Flow

```
[User selects 1 or intent = show_menu]
  │
  ▼
n8n reads Google Sheets "Menu" tab for hotel
  │
  ▼
Bot sends formatted menu:

━━━━━━━━━━━━━━━━━━━━━
🍽️ Royal Hotel Menu

🍕 Pizza — ₹250
🍔 Burger — ₹180
🥗 Salad — ₹120
🍰 Dessert — ₹100

Reply with "Book" to reserve a table.
━━━━━━━━━━━━━━━━━━━━━
```

---

## 4. Booking Flow (Multi-Step)

The booking flow collects information across multiple messages using session state stored in Supabase `bot_sessions`.

### Step-by-Step Collection

```
STEP 1 — Ask for Date
─────────────────────
Bot: "📅 What date would you like to book?
(e.g., 20 Jun, tomorrow, 25/06)"

User: "20 Jun"
→ Save to session: {date: "20 Jun"}
→ Move to step 2


STEP 2 — Ask for Time
─────────────────────
Bot: "⏰ What time would you like?
(e.g., 7 PM, 8:30 PM)"

User: "8 PM"
→ Save to session: {date: "20 Jun", time: "8 PM"}
→ Move to step 3


STEP 3 — Ask for Guests
───────────────────────
Bot: "👥 How many guests?"

User: "4"
→ Save to session: {..., guests: 4}
→ CHECK AVAILABILITY NOW
→ Query Supabase: available = capacity - booked

IF available >= 4:
  → Move to step 4

IF NOT available:
  Bot: "⚠️ Sorry, 8 PM on 20 Jun is fully booked.

  Available slots:
  ✅ 7 PM (12 seats available)
  ✅ 9 PM (8 seats available)

  Would you like to choose another slot? (yes/no)"

  IF yes → restart from Step 1
  IF no  → end flow


STEP 4 — Ask for Name
─────────────────────
Bot: "👤 Please enter your name:"

User: "Rahul Sharma"
→ Save to session: {..., name: "Rahul Sharma"}
→ Move to step 5


STEP 5 — Ask for Phone
──────────────────────
Bot: "📞 Please enter your phone number:"

User: "9999999999"
→ Save to session: {..., phone: "9999999999"}
→ Move to confirmation


STEP 6 — Confirmation
─────────────────────
Bot: "✅ Please confirm your booking:

📅 Date: 20 Jun
⏰ Time: 8 PM
👥 Guests: 4
👤 Name: Rahul Sharma
📞 Phone: 9999999999

Reply YES to confirm or NO to cancel."


STEP 7 — Final Action
─────────────────────
User: "YES"
→ Write booking to Supabase bookings table
→ Write booking to Google Sheets Bookings tab
→ Clear bot_session record

Bot: "🎉 Booking Confirmed!
Booking ID: #ROYAL-2024-0047

📅 20 Jun | ⏰ 8 PM | 👥 4 guests
We look forward to seeing you! 🙏"

→ n8n triggers owner notification via Telegram


User: "NO"
→ Clear bot_session record
Bot: "❌ Booking cancelled. Type /start to begin again."
```

---

## 5. Availability Check Flow

```
[User selects 3 or intent = check_availability]
  │
  ▼
Bot: "📅 Which date would you like to check?
(e.g., 20 Jun)"

User: "20 Jun"
  │
  ▼
n8n queries Supabase slots + bookings for hotel_id + date
  │
  ▼
Bot sends:

━━━━━━━━━━━━━━━━━━━━━
📊 Availability on 20 Jun

⏰ 7 PM — ✅ 8 seats available
⏰ 8 PM — ❌ Full
⏰ 9 PM — ✅ 15 seats available

Type "Book" to reserve a slot.
━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Contact Flow

```
[User selects 4 or intent = contact]
  │
  ▼
n8n reads hotel contact info from Supabase
  │
  ▼
Bot sends:

━━━━━━━━━━━━━━━━━━━━━
📞 Royal Hotel Contact

📱 Phone: +91 98765 43210
📍 Address: 123 Main Street, Ahmedabad
🕐 Hours: 11 AM – 11 PM
━━━━━━━━━━━━━━━━━━━━━
```

---

## 7. AI Fallback Flow

When the user sends a free-text message that doesn't match a numbered option:

```
[User types: "I want to reserve a table for tonight"]
  │
  ▼
n8n sends text to AI Intent Detection API
  │
  ▼
AI returns: "book_table"
  │
  ▼
n8n routes to Booking Flow
```

If AI returns `unknown`:
```
Bot: "I didn't understand that. 😕
Please choose:
1. View Menu
2. Book Table
3. Check Availability
4. Contact"
```

---

## 8. Session State Management

Sessions are stored in `bot_sessions` table in Supabase.

| Field | Purpose |
|---|---|
| `telegram_chat_id` | Identifies the user |
| `hotel_id` | Which hotel they're talking to |
| `step` | Current step in the flow |
| `session_data` | JSON blob with collected inputs |

### Session Steps Enum
```
idle
awaiting_date
awaiting_time
awaiting_guests
checking_availability
awaiting_name
awaiting_phone
awaiting_confirmation
```

Session is cleared on:
- Booking confirmed
- Booking cancelled
- User sends `/start`
- Session inactive for > 30 minutes (cleanup cron)

---

## 9. Owner Notification Message Format

Sent to the owner's Telegram chat_id on every confirmed booking:

```
🔔 New Booking — Royal Hotel

👤 Name: Rahul Sharma
📞 Phone: 9999999999
👥 Guests: 4
📅 Date: 20 Jun
⏰ Time: 8 PM
🆔 Booking ID: #ROYAL-2024-0047

Manage bookings → https://dashboard.staybot.ai
```
