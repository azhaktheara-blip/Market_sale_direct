# FarmerDirect — Production Deployment Guide

This guide details the complete production architecture, secrets management, container orchestration, database setup, monitoring, and disaster recovery procedures.

---

## 🏗️ 1. Architecture Overview

```text
[ Internet / Client Traffic ]
             │
             ▼ HTTPS (443)
┌────────────────────────────────────────┐
│ Nginx Reverse Proxy (Frontend & SSL)   │
│ - Security Headers (HSTS, CSP, X-Frame)│
│ - Static Assets & Vite Single Page App │
└──────────────────┬─────────────────────┘
                   │ Reverse Proxy (Port 8000)
                   ▼
┌────────────────────────────────────────┐
│ Gunicorn WSGI (Django Application)     │
│ - Non-root execution (`app` user)      │
│ - 3 Workers / 2 Threads per worker     │
│ - DRF API Throttling & JWT Blacklist   │
└──────────┬─────────────────┬───────────┘
           │                 │
           ▼                 ▼
┌────────────────────┐ ┌────────────────────┐
│ PostgreSQL 16      │ │ Redis 7            │
│ (Supabase Pooler)  │ │ (Shared Cache /    │
│ - SSL Required     │ │  Celery Broker)    │
│ - Private Network  │ │ - Private Network  │
└────────────────────┘ └─────────┬──────────┘
                                 │
                                 ▼
                       ┌────────────────────┐
                       │ Celery Workers &   │
                       │ Celery Beat        │
                       └────────────────────┘
```

---

## 🔐 2. Production Environment Variables (`.env`)

Configure these on Render, Railway, AWS ECS, or Docker host:

```bash
# Core Application Settings
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=generate_with_python_secrets_token_urlsafe_50
ALLOWED_HOSTS=farmer-direct-backend.onrender.com,market-sale-direct.vercel.app,yourdomain.com
CORS_ALLOWED_ORIGINS=https://market-sale-direct.vercel.app,https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://market-sale-direct.vercel.app,https://farmer-direct-backend.onrender.com,https://yourdomain.com

# PostgreSQL Database (Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:6543/postgres?sslmode=require

# Redis & Celery
REDIS_URL=redis://:[PASSWORD]@[REDIS_HOST]:6379/0
REDIS_CACHE_URL=redis://:[PASSWORD]@[REDIS_HOST]:6379/0
CELERY_BROKER_URL=redis://:[PASSWORD]@[REDIS_HOST]:6379/1

# Email Service (SendGrid / AWS SES / Postmark)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_secure_smtp_api_key
DEFAULT_FROM_EMAIL=FarmerDirect <noreply@farmerdirect.com>

# Google OAuth 2.0 Integration
FRONTEND_URL=https://market-sale-direct.vercel.app
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# ABA PayWay Payment Gateway
ABA_PAYWAY_BASE_URL=https://checkout.payway.com.kh
ABA_PAYWAY_MERCHANT_ID=your_production_merchant_id
ABA_PAYWAY_API_KEY=your_production_merchant_api_key

# Marketplace Economics
MARKETPLACE_COMMISSION_PERCENTAGE=5.0
DEFAULT_DELIVERY_FEE=2.00
```

---

## 🐳 3. Docker Deployment Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/azhaktheara-blip/Market_sale_direct.git
cd Market_sale_direct
```

### Step 2: Create Production Environment File
```bash
cp backend/.env.example .env
# Edit .env with your real production secrets (never commit this file)
nano .env
```

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Run Migrations & Collect Static Files
```bash
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py collectstatic --noinput
```

### Step 5: Verify Deployment Health
```bash
docker compose exec backend python manage.py check --deploy
```

---

## 💾 4. Database Backup & Disaster Recovery

### Automated Daily PostgreSQL Backups (Cron / Supabase)
```bash
# Backup command
pg_dump -Fc --no-acl --no-owner -h [DB_HOST] -U [DB_USER] -d [DB_NAME] > /backups/farmerdirect_$(date +%Y%m%d_%H%M%S).dump

# Encrypt backup
gpg --symmetric --cipher-algo AES256 /backups/farmerdirect_*.dump
```

### Restoration Testing Procedure
1. Create isolated staging database.
2. Run restore command:
   ```bash
   pg_restore --clean --no-acl --no-owner -h [STAGING_HOST] -U [DB_USER] -d [STAGING_DB] /backups/farmerdirect_backup.dump
   ```
3. Run test suite: `python manage.py test`.

---

## 🔄 5. Rollback Procedure

If an unhealthy release occurs:
1. **Frontend Rollback**: In Vercel dashboard → Deployments → Instant Rollback to previous production deployment.
2. **Backend Rollback**: In Render dashboard → Deployments → Rollback to previous healthy commit.
3. **Database Migration Reversal**:
   ```bash
   python manage.py migrate accounts 0001
   ```
