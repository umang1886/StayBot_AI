# StayBot AI 🤖🏨

StayBot AI is an intelligent Telegram automation platform designed for hotels and restaurants. It streamlines operations by offering direct bookings, multi-language support, automated menu fetching, and intelligent intent detection.

## 📁 Project Structure

This monorepo contains:
- `/backend`: Flask REST API, services, and authentication.
- `/dashboard`: React + Vite frontend for hotel owners (Tailwind v4, Shadcn/ui principles).
- `/database`: Supabase SQL migrations and seed data.
- `/n8n`: Exported n8n workflow configurations.
- `/scripts`: Utility scripts (e.g., Telegram webhook registration).
- `/docs`: Comprehensive project documentation.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v20+)
- Python (v3.11+)
- Docker & Docker Compose
- A Supabase Project
- A Google Cloud Service Account (for Sheets API)

### 2. Database & Environment Variables
1. Run all SQL migrations in `/database/migrations` on your Supabase project.
2. Fill out the environment variables:
   - In `/backend`, edit `.env` and add your `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, etc.
   - Place your Google Service Account JSON in `/backend/credentials/google-service-account.json`.
   - In `/dashboard`, edit `.env` and set `VITE_API_BASE_URL`.

### 3. Run with Docker Compose
```bash
docker-compose up --build
```
This will start:
- **Flask Backend:** http://localhost:5000
- **React Dashboard:** http://localhost:5173
- **n8n Automation Engine:** http://localhost:5678

### 4. Setup n8n Workflows
1. Open n8n at `http://localhost:5678`.
2. Import the workflows from the `/n8n` directory.
3. Configure your Telegram and HTTP Request credentials in n8n.
4. Run the script `python scripts/setup_webhooks.py` to register webhooks.

## 🛡️ Security
- All sensitive data (tokens, API keys) must be stored in `.env`.
- Authentication uses JWT tokens (Flask-JWT-Extended).
- Supabase enforces Row-Level Security (RLS) to isolate hotel owner data.
- Rate limiting is applied to the Flask API.
