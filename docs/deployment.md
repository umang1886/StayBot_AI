# StayBot AI – Deployment Architecture & Environment Setup

## 1. Overview

| Component | Hosting Option | Recommended Service |
|---|---|---|
| Flask Backend | VPS or PaaS | Railway / Render / DigitalOcean App Platform |
| React Dashboard | Static CDN | Vercel / Netlify / Cloudflare Pages |
| n8n | VPS (Docker) | DigitalOcean Droplet / Hetzner VPS |
| Supabase | Managed | Supabase Cloud |
| Google Sheets | Managed | Google Workspace |
| Domain / SSL | CDN + Cert | Cloudflare (free SSL) |

---

## 2. Environment Variables

### 2.1 Backend `.env`

```env
# Flask
FLASK_ENV=production
SECRET_KEY=<random-32-char-string>
JWT_SECRET_KEY=<random-32-char-string>
JWT_ACCESS_TOKEN_EXPIRES=86400   # 24 hours in seconds

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_JSON=/app/credentials/google-service-account.json

# AI
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...

# Telegram
CENTRAL_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# CORS
ALLOWED_ORIGINS=https://dashboard.staybot.ai

# Rate Limiting
RATELIMIT_DEFAULT=100/minute
RATELIMIT_AUTH=5/minute
```

### 2.2 Dashboard `.env`

```env
VITE_API_BASE_URL=https://api.staybot.ai
VITE_APP_NAME=StayBot AI
```

### 2.3 n8n Environment Variables

Set in n8n Settings → Environment Variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
CENTRAL_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
DASHBOARD_URL=https://dashboard.staybot.ai
N8N_WEBHOOK_BASE_URL=https://n8n.staybot.ai
```

---

## 3. Flask Backend Deployment

### 3.1 Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:create_app()"]
```

### 3.2 requirements.txt

```
flask==3.0.0
flask-jwt-extended==4.6.0
flask-cors==4.0.0
flask-limiter==3.5.0
supabase==2.3.0
bcrypt==4.1.2
python-dotenv==1.0.0
gunicorn==21.2.0
google-auth==2.27.0
google-api-python-client==2.116.0
requests==2.31.0
marshmallow==3.20.2
```

### 3.3 Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init

# Set environment variables
railway variables set FLASK_ENV=production
railway variables set SECRET_KEY=...
# (set all vars from section 2.1)

# Deploy
railway up
```

### 3.4 Deploy to Render

1. Connect GitHub repo
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `gunicorn --bind 0.0.0.0:$PORT app:create_app()`
4. Add all environment variables in Render dashboard

### 3.5 Nginx Reverse Proxy (if self-hosted)

```nginx
server {
    listen 80;
    server_name api.staybot.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.staybot.ai;

    ssl_certificate /etc/letsencrypt/live/api.staybot.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.staybot.ai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. React Dashboard Deployment

### 4.1 Build

```bash
cd dashboard
npm run build
# Output: dist/ folder
```

### 4.2 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# Set VITE_API_BASE_URL in Vercel dashboard environment variables
```

### 4.3 Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 4.4 `_redirects` file (Netlify SPA routing)

```
/* /index.html 200
```

### 4.5 `vercel.json` (Vercel SPA routing)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 5. n8n Deployment

### 5.1 Docker Compose (Production)

```yaml
# n8n/docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_ADMIN_PASSWORD}
      - N8N_HOST=n8n.staybot.ai
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.staybot.ai/
      - GENERIC_TIMEZONE=Asia/Kolkata
    volumes:
      - n8n_data:/home/node/.n8n
    env_file:
      - .env

volumes:
  n8n_data:
```

### 5.2 Deploy Steps

```bash
# On VPS (Ubuntu 22.04)
sudo apt update && sudo apt install docker.io docker-compose -y

git clone https://github.com/your-org/staybot-ai.git
cd staybot-ai/n8n

# Set secrets
cp .env.example .env
nano .env   # fill in all values

docker-compose up -d

# Set up Nginx + Certbot for SSL
sudo apt install nginx certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.staybot.ai
```

### 5.3 Import Workflows

1. Open `https://n8n.staybot.ai`
2. Go to Workflows → Import
3. Import each JSON file from `n8n/workflows/`
4. Activate all workflows

### 5.4 Register Telegram Webhooks

After n8n is running, register webhooks for all hotel bots:

```python
# scripts/setup_webhooks.py
import requests
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
hotels = supabase.table('hotels').select('bot_token, bot_username').execute()

for hotel in hotels.data:
    token = hotel['bot_token']
    webhook_url = f"https://n8n.staybot.ai/webhook/{token}/hotel-bot"
    r = requests.post(
        f"https://api.telegram.org/bot{token}/setWebhook",
        json={"url": webhook_url}
    )
    print(f"{hotel['bot_username']}: {r.json()}")
```

---

## 6. Supabase Setup

### 6.1 Create Project
1. Go to https://supabase.com → New Project
2. Choose region closest to your users (e.g., Mumbai / Singapore)
3. Save the project URL and `service_role` key

### 6.2 Run Migrations

```bash
# Using Supabase CLI
npm install -g supabase
supabase login
supabase db push --db-url postgresql://postgres:[password]@[host]:5432/postgres
```

Or paste each SQL file from `database/migrations/` into the Supabase SQL Editor.

### 6.3 Enable RLS

Run `008_rls_policies.sql` in Supabase SQL Editor after all tables are created.

---

## 7. Google Sheets Setup

### 7.1 Create Service Account

1. Go to https://console.cloud.google.com
2. Create a new project: `staybot-ai`
3. Enable APIs: `Google Sheets API`, `Google Drive API`
4. Create Service Account → Download JSON credentials
5. Save as `backend/credentials/google-service-account.json`
6. Add to `.gitignore`

### 7.2 Share Hotel Sheet With Service Account

For each hotel's Google Sheet:
1. Open the sheet
2. Share → paste the service account email (from JSON file: `client_email`)
3. Give "Editor" access

---

## 8. DNS Configuration

| Record | Type | Value |
|---|---|---|
| `api.staybot.ai` | A/CNAME | Flask backend IP/URL |
| `dashboard.staybot.ai` | CNAME | Vercel/Netlify URL |
| `n8n.staybot.ai` | A | n8n VPS IP |

---

## 9. Production Checklist

### Pre-Launch
- [ ] All `.env` variables set in production environments
- [ ] SSL certificates active for all subdomains
- [ ] Supabase RLS policies applied
- [ ] All n8n workflows activated
- [ ] Telegram webhooks registered for all hotel bots
- [ ] Google Sheets shared with service account
- [ ] CORS configured to dashboard domain only
- [ ] Rate limiting active on Flask API
- [ ] JWT secret key is strong and random

### Monitoring
- [ ] Set up n8n error workflow → Telegram alert to admin
- [ ] Enable Supabase logs
- [ ] Set up UptimeRobot for `api.staybot.ai/api/health`
- [ ] Set up UptimeRobot for `n8n.staybot.ai`

### Backup
- [ ] Enable Supabase automated backups (daily)
- [ ] n8n workflows exported and committed to `n8n/workflows/`

---

## 10. Scaling Considerations

| Bottleneck | Solution |
|---|---|
| High n8n webhook load | Upgrade to n8n Cloud or add more workers |
| Supabase connection limits | Use Supabase connection pooling (PgBouncer) |
| Google Sheets API rate limits | Cache menu/slot data in Supabase; read from Supabase first |
| Flask API load | Add Gunicorn workers; move to Railway/Render auto-scaling |
| Many hotel bots | All bots share one n8n workflow; no per-bot scaling needed |
