# StayBot AI – n8n Automation Workflows

## 1. Overview

n8n is the central automation engine. All Telegram bot messages are received via webhooks in n8n and routed through the appropriate workflow.

**Base URL (n8n):** `https://n8n.yourdomain.com`

---

## 2. Workflow List

| # | Workflow Name | Trigger | Purpose |
|---|---|---|---|
| 1 | Central Bot Handler | Telegram Webhook | Hotel discovery |
| 2 | Hotel Bot Handler | Telegram Webhook | Per-hotel message routing |
| 3 | AI Intent Detector | Called by Workflow 2 | Detect user intent |
| 4 | Booking Flow | Sub-workflow | Manage booking steps |
| 5 | Availability Checker | Sub-workflow | Check slot capacity |
| 6 | Menu Fetcher | Sub-workflow | Read menu from Google Sheets |
| 7 | Booking Writer | Sub-workflow | Write booking to Sheets + Supabase |
| 8 | Owner Notifier | Sub-workflow | Send Telegram alert to owner |
| 9 | Session Cleanup | Cron | Delete stale bot sessions |

---

## 3. Workflow 1: Central Bot Handler

**Trigger:** Telegram Webhook on `@StayBotAI`

```
[Telegram Trigger Node]
  │  receives: {message.text, message.chat.id}
  ▼
[Set Node] — extract: chat_id, user_text
  │
  ▼
[Supabase Node] — query hotels table
  Query: SELECT * FROM hotels
         WHERE city ILIKE '%{{user_text}}%'
            OR hotel_name ILIKE '%{{user_text}}%'
         LIMIT 10
  │
  ├── Results found?
  │       ▼ YES
  │   [Function Node] — format hotel list as numbered text
  │       │
  │       ▼
  │   [Telegram Node] — send list to chat_id
  │       │
  │       ▼
  │   [Wait for next message - session stored with step='selecting_hotel']
  │       │
  │       ▼
  │   [Supabase Node] — get selected hotel bot link
  │       │
  │       ▼
  │   [Telegram Node] — send: "Open: https://t.me/{bot_username}"
  │
  └── No results?
          ▼
      [Telegram Node] — send: "No hotels found. Try again."
```

---

## 4. Workflow 2: Hotel Bot Handler (Main Router)

**Trigger:** Telegram Webhook (one webhook per hotel bot OR dynamic webhook lookup)

```
[Telegram Trigger Node]
  │  receives: {message.text, message.chat.id, bot_token (from webhook URL)}
  ▼
[Set Node] — extract: chat_id, text, bot_token
  │
  ▼
[Supabase Node] — lookup hotel by bot_token
  Query: SELECT * FROM hotels WHERE bot_token = '{{bot_token}}'
  │
  ▼
[Supabase Node] — get or create bot_session
  Query: SELECT * FROM bot_sessions
         WHERE hotel_id = '{{hotel_id}}'
           AND telegram_chat_id = '{{chat_id}}'
  │
  ▼
[IF Node] — is session step NOT 'idle'?
  │
  ├── YES (user is mid-flow) → [Booking Flow Sub-Workflow]
  │
  └── NO (new conversation)
        │
        ▼
      [Workflow 3: AI Intent Detector]
        │
        ▼
      [Switch Node] — route by intent
        ├── show_menu         → [Workflow 6: Menu Fetcher]
        ├── book_table        → [Workflow 4: Booking Flow]
        ├── check_availability→ [Workflow 5: Availability Checker]
        ├── contact           → [Supabase Node → Telegram Node]
        └── unknown           → [Telegram Node: send main menu]
```

---

## 5. Workflow 3: AI Intent Detector

**Type:** Sub-workflow / Called via Execute Workflow node

**Input:** `{ user_text: string, hotel_id: string }`
**Output:** `{ intent: string }`

```
[Execute Workflow Trigger]
  │
  ▼
[HTTP Request Node] — POST to Gemini or OpenAI API
  URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
  Headers: {Authorization: Bearer {{$env.GEMINI_API_KEY}}}
  Body:
  {
    "contents": [{
      "parts": [{
        "text": "Detect the user intent. Return one of: show_menu, book_table, cancel_booking, check_availability, contact, unknown.\n\nMessage: \"{{user_text}}\"\n\nReturn only the intent label."
      }]
    }]
  }
  │
  ▼
[Function Node] — extract intent from response text
  const raw = items[0].json.candidates[0].content.parts[0].text.trim().toLowerCase();
  const valid = ['show_menu','book_table','cancel_booking','check_availability','contact'];
  return [{ json: { intent: valid.includes(raw) ? raw : 'unknown' } }];
  │
  ▼
[Return to parent workflow]
```

**Fallback keyword matching (inside Function Node):**
```javascript
const text = user_text.toLowerCase();
if (text.includes('menu') || text.includes('food')) return 'show_menu';
if (text.includes('book') || text.includes('reserve')) return 'book_table';
if (text.includes('cancel')) return 'cancel_booking';
if (text.includes('available') || text.includes('slot')) return 'check_availability';
if (text.includes('contact') || text.includes('phone')) return 'contact';
return 'unknown';
```

---

## 6. Workflow 4: Booking Flow (Multi-Step)

**Input:** `{ hotel_id, chat_id, session, user_text, bot_token }`

```
[Execute Workflow Trigger]
  │
  ▼
[Switch Node] — route by session.step
  │
  ├── 'idle' or 'book_table_start'
  │     ▼
  │   [Supabase Upsert] — set step='awaiting_date'
  │   [Telegram] — "📅 What date would you like to book?"
  │
  ├── 'awaiting_date'
  │     ▼
  │   [Function Node] — validate date input
  │   [Supabase Update] — session_data.date = user_text, step='awaiting_time'
  │   [Telegram] — "⏰ What time would you like?"
  │
  ├── 'awaiting_time'
  │     ▼
  │   [Supabase Update] — session_data.time = user_text, step='awaiting_guests'
  │   [Telegram] — "👥 How many guests?"
  │
  ├── 'awaiting_guests'
  │     ▼
  │   [Supabase Update] — session_data.guests = user_text
  │   → Call [Workflow 5: Availability Checker]
  │       │
  │       ├── Available → step='awaiting_name'
  │       │   [Telegram] — "👤 Please enter your name:"
  │       │
  │       └── Not Available
  │           [Telegram] — "⚠️ Slot full. Available: [list]"
  │           step='idle'
  │
  ├── 'awaiting_name'
  │     ▼
  │   [Supabase Update] — session_data.name = user_text, step='awaiting_phone'
  │   [Telegram] — "📞 Please enter your phone number:"
  │
  ├── 'awaiting_phone'
  │     ▼
  │   [Supabase Update] — session_data.phone = user_text, step='awaiting_confirmation'
  │   [Telegram] — send summary + "Reply YES to confirm or NO to cancel"
  │
  └── 'awaiting_confirmation'
        ▼
      [IF Node] — user_text.toLowerCase() == 'yes'?
        │
        ├── YES → [Workflow 7: Booking Writer]
        │         [Telegram] — "🎉 Booking Confirmed! ID: #..."
        │         [Workflow 8: Owner Notifier]
        │         [Supabase Delete] — clear session
        │
        └── NO  → [Supabase Delete] — clear session
                  [Telegram] — "❌ Booking cancelled."
```

---

## 7. Workflow 5: Availability Checker

**Input:** `{ hotel_id, date, time, guests }`
**Output:** `{ available: boolean, available_slots: array }`

```
[Execute Workflow Trigger]
  │
  ▼
[Supabase Node] — run availability SQL query
  SELECT
    s.time,
    s.capacity,
    COALESCE(SUM(b.guests), 0) AS booked,
    s.capacity - COALESCE(SUM(b.guests), 0) AS available
  FROM slots s
  LEFT JOIN bookings b
    ON b.hotel_id = s.hotel_id AND b.date = s.date
    AND b.time = s.time AND b.status = 'confirmed'
  WHERE s.hotel_id = '{{hotel_id}}' AND s.date = '{{date}}'
  GROUP BY s.time, s.capacity
  │
  ▼
[Function Node] — check if requested slot has enough seats
  const requested = parseInt(guests);
  const slot = items.find(i => i.json.time === requested_time);
  const isAvailable = slot && slot.json.available >= requested;
  const otherSlots = items.filter(i => i.json.available >= requested && i.json.time !== requested_time);
  return [{ json: { available: isAvailable, other_slots: otherSlots } }];
  │
  ▼
[Return to parent workflow]
```

---

## 8. Workflow 6: Menu Fetcher

**Input:** `{ hotel_id, sheet_id, bot_token, chat_id }`

```
[Execute Workflow Trigger]
  │
  ▼
[Google Sheets Node]
  Operation: Read
  Sheet ID: {{sheet_id}}
  Tab: Menu
  Range: A:C
  │
  ▼
[Function Node] — format menu as text
  let menu = "🍽️ Our Menu\n\n";
  for (const item of items) {
    if (item.json.available === 'yes') {
      menu += `• ${item.json.item} — ₹${item.json.price}\n`;
    }
  }
  menu += "\nReply 'Book' to reserve a table.";
  return [{ json: { menu_text: menu } }];
  │
  ▼
[Telegram Node] — send menu_text to chat_id
```

---

## 9. Workflow 7: Booking Writer

**Input:** `{ hotel_id, sheet_id, booking_data }`

```
[Execute Workflow Trigger]
  │
  ▼
[Function Node] — generate booking_id
  const id = 'BOOK-' + Date.now();
  │
  ▼
[Supabase Node] — INSERT into bookings table
  { hotel_id, name, phone, date, time, guests, status: 'confirmed', telegram_chat_id }
  │
  ▼
[Google Sheets Node]
  Operation: Append Row
  Sheet: {{sheet_id}}
  Tab: Bookings
  Values: [booking_id, name, phone, date, time, guests, 'confirmed', timestamp]
  │
  ▼
[Return booking_id to parent]
```

---

## 10. Workflow 8: Owner Notifier

**Input:** `{ hotel_id, booking_data }`

```
[Execute Workflow Trigger]
  │
  ▼
[Supabase Node] — get owner's telegram_chat_id
  SELECT o.telegram_chat_id
  FROM owners o
  JOIN hotels h ON h.owner_id = o.id
  WHERE h.id = '{{hotel_id}}'
  │
  ▼
[Function Node] — format notification message
  │
  ▼
[Telegram Node] — sendMessage to owner telegram_chat_id
  Message:
  🔔 New Booking — {{hotel_name}}
  👤 {{name}} | 📞 {{phone}}
  👥 {{guests}} guests | 📅 {{date}} ⏰ {{time}}
```

---

## 11. Workflow 9: Session Cleanup (Cron)

**Trigger:** Cron — every 30 minutes

```
[Cron Trigger]
  │
  ▼
[Supabase Node] — DELETE stale sessions
  DELETE FROM bot_sessions
  WHERE updated_at < NOW() - INTERVAL '30 minutes'
```

---

## 12. Environment Variables (n8n)

Set these in n8n → Settings → Environment Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
TELEGRAM_CENTRAL_BOT_TOKEN=123456:ABC...
DASHBOARD_URL=https://dashboard.staybot.ai
```
