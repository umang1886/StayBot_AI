# StayBot AI – Product Requirements Document (PRD)

## 1. Product Overview

**StayBot AI** is a Telegram-based automation platform designed for hotels and restaurants to manage bookings using chatbots.

### Customer Capabilities
- Discover hotels through a central Telegram bot (`@StayBotAI`)
- Access hotel-specific booking chatbots
- View menus
- Check slot availability
- Book tables

### Hotel Owner Capabilities
- Manage bookings (view, edit, cancel, mark complete)
- Update menu items (add, edit, disable)
- Control slot capacities per time period
- View booking analytics and insights
- Access customer database
- Receive Telegram notifications for new bookings

---

## 2. Problem Statement

Small restaurants and hotels face the following operational issues:
- Manual booking through phone or WhatsApp
- Staff cannot handle all incoming messages at scale
- Double bookings due to no real-time availability tracking
- No automated availability checking system
- No analytics or customer database
- No centralized discovery platform for customers

---

## 3. Proposed Solution

StayBot AI introduces a **multi-bot automation ecosystem** with the following core components:

| Component | Description |
|---|---|
| Central Discovery Telegram Bot | Allows customers to search and find hotels |
| Hotel-Specific Telegram Bots | Individual bots per hotel for booking and menu |
| AI Intent Detection Layer | Detects user intent from free-text using Gemini/OpenAI |
| n8n Automation Engine | Orchestrates all workflows between bots, DB, and sheets |
| Supabase Database | Central relational database for hotels and bookings |
| Google Sheets | Per-hotel data storage for menu, slots, and bookings |
| Owner Web Dashboard | React-based web portal for hotel owners |

---

## 4. Central Telegram Discovery Bot

**Bot handle:** `@StayBotAI`

### User Flow
1. User opens the central bot
2. Bot asks for hotel name or city name
3. System searches the hotel database in Supabase
4. Bot returns matching hotels as a list
5. User selects a hotel
6. Bot provides the direct link to the hotel's booking bot

### Example Interaction
```
User: Ahmedabad restaurants

Bot:
Hotels in Ahmedabad:
1. Royal Hotel
2. Taj Restaurant
3. Comfort Cafe

User: 1

Bot:
Royal Hotel found.
Open booking bot: https://t.me/RoyalHotelBot
```

---

## 5. Hotel-Specific Telegram Bots

Each registered hotel has its own dedicated Telegram bot (e.g., `@RoyalHotelBot`).

### Capabilities
- Show menu with items, prices, and availability
- Book a table (collect date, time, guests, name, phone)
- Check slot availability
- Handle customer queries via AI intent detection

### Welcome Flow
```
Welcome to Royal Hotel 🍽️

Please choose an option:
1. View Menu
2. Book Table
3. Contact Us
```

---

## 6. Customer Booking Flow

| Step | Action |
|---|---|
| Step 1 | Customer opens hotel bot (e.g., `@RoyalHotelBot`) |
| Step 2 | Bot sends welcome message with options |
| Step 3 | Customer selects "Book Table" |
| Step 4 | Bot asks for: Date, Time, Number of guests, Name, Phone number |
| Step 5 | System checks slot capacity |
| Step 6 | If available → confirm booking and write to Google Sheets + Supabase |
| Step 7 | If unavailable → suggest alternative open slots |
| Step 8 | Owner receives Telegram notification of new booking |

---

## 7. Slot Capacity System

The system uses **seat-based slot management** (not table-based).

### Google Sheet – Slots Sheet

| date | time | capacity |
|---|---|---|
| 20 Jun | 7 PM | 20 |
| 20 Jun | 8 PM | 20 |

### Availability Algorithm
```
capacity = slot.capacity
booked = COUNT(bookings WHERE date=slot.date AND time=slot.time AND status='confirmed')
available = capacity - booked

IF available >= requested_guests:
    → Confirm booking
ELSE:
    → Return list of other available slots
```

---

## 8. Google Sheets Structure (Per Hotel)

Each hotel gets its own Google Sheet with three tabs:

### Sheet 1 – Menu
| item | price | available |
|---|---|---|
| Pizza | 250 | yes |

### Sheet 2 – Slots
| date | time | capacity |
|---|---|---|
| 20 Jun | 7 PM | 20 |

### Sheet 3 – Bookings
| name | phone | date | time | guests | status |
|---|---|---|---|---|---|
| Rahul | 9999999999 | 20 Jun | 8 PM | 4 | confirmed |

---

## 9. AI Intent Detection

AI detects the user's intent from free-text messages.

### Supported Intents
| Intent | Example Phrases |
|---|---|
| `show_menu` | "show menu", "what's available", "food list" |
| `book_table` | "book a table", "reserve for 4", "I want to book" |
| `cancel_booking` | "cancel my booking", "I won't come" |
| `check_availability` | "is 8 PM available?", "any slots tonight?" |
| `contact` | "phone number", "how to reach you" |

### AI Models Supported
- **Gemini** (Google)
- **OpenAI GPT**

### Example Prompt
```
You are a hotel booking assistant.
Detect the user's intent from the following message and return one of: 
show_menu, book_table, cancel_booking, check_availability, contact, unknown.

Message: "{user_message}"
Return only the intent label.
```

---

## 10. Owner Dashboard Features

The web dashboard (React + Flask) gives hotel owners full control.

### Modules
1. **Booking Management** – View, edit, cancel, complete bookings
2. **Menu Management** – Add, edit, disable menu items
3. **Slot Management** – Set and update time slot capacities
4. **Analytics Dashboard** – Bookings per day, peak slots, repeat customers
5. **Customer Database** – Searchable list of all past customers
6. **Notification Settings** – Configure Telegram alerts

---

## 11. Notifications

Owners receive Telegram alerts for new bookings:

```
🔔 New Booking at Royal Hotel

👤 Name: Rahul
📞 Phone: 9999999999
👥 Guests: 4
📅 Date: 20 Jun
⏰ Time: 8 PM
```

---

## 12. Security Requirements

| Feature | Implementation |
|---|---|
| Bot token storage | Encrypted in Supabase |
| Dashboard auth | JWT-based authentication |
| API validation | Request validation middleware in Flask |
| Rate limiting | Flask-Limiter on all public endpoints |
| CORS | Restricted to dashboard domain only |

---

## 13. Scalability Targets

| Metric | Target |
|---|---|
| Hotels supported | 10,000 |
| Bookings per day | 100,000 |
| Architecture | Single n8n workflow per hotel type, Supabase auto-scaling |

---

## 14. Monetization Plans

| Plan | Setup Fee | Monthly Fee | Features |
|---|---|---|---|
| Basic | ₹3,000 | ₹1,000/month | 1 bot, basic analytics |
| Premium | ₹7,000 | ₹2,500/month | Custom bot, full analytics, priority support |

---

## 15. Technology Stack

| Layer | Technology |
|---|---|
| Frontend (Dashboard) | React |
| Backend (API) | Flask (Python) |
| Automation | n8n |
| Database | Supabase (PostgreSQL) |
| Bot Platform | Telegram Bot API |
| Data Storage | Google Sheets API |
| AI / Intent Detection | Gemini / OpenAI |
