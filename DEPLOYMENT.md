# 🚀 FarmerDirect Production Deployment Guide

This guide covers step-by-step instructions to deploy the **FarmerDirect marketplace** (Django REST Backend + React Vite Frontend + PostgreSQL + Redis + Celery + Nginx) into production.

---

## 📋 Architecture Overview

```
                        ┌───────────────────────────────┐
                        │     Internet / End Users      │
                        └───────────────┬───────────────┘
                                        │ (HTTPS: 443 / HTTP: 80)
                                        ▼
                        ┌───────────────────────────────┐
                        │         Nginx Proxy           │
                        │    (SSL / Gzip / Caching)     │
                        └───────┬───────────────┬───────┘
                                │               │
                  / (Static App)│               │ /api/ & /media/
                                ▼               ▼
                ┌──────────────────┐    ┌──────────────────┐
                │  React Frontend  │    │  Django Gunicorn │
                │   (Vite Build)   │    │  (WSGI Workers)  │
                └──────────────────┘    └────────┬─────────┘
                                                 │
                                ┌────────────────┼────────────────┐
                                ▼                ▼                ▼
                        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                        │  PostgreSQL  │ │ Redis Broker │ │ Celery Worker│
                        │   Database   │ │   & Cache    │ │   & Beat     │
                        └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🛠️ Method 1: Docker Compose Deployment (Recommended for VPS / AWS EC2 / DigitalOcean)

The fastest and most robust production method. It spins up all 6 services with a single command.

### 1. Provision Your Server
- **OS**: Ubuntu 22.04 / 24.04 LTS
- **Recommended Spec**: 2 CPU cores, 4GB RAM (or minimum 1 CPU, 2GB RAM with swap enabled).

### 2. Install Docker & Docker Compose
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Enable Docker without sudo
sudo usermod -aG docker $USER
```

### 3. Clone Repository & Setup Environment
```bash
git clone https://github.com/your-username/Farmer-direct_marketplace.git
cd Farmer-direct_marketplace

# Create production environment variables
cat << 'EOF' > .env
POSTGRES_DB=farmer_direct_db
POSTGRES_USER=farmer_admin
POSTGRES_PASSWORD=YourStrongDatabasePassword123!
SECRET_KEY=your-super-secret-django-production-key-change-this!
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF
```

### 4. Build & Launch Containers
```bash
# Build and run containers in detached mode
docker compose up -d --build

# Verify all services are healthy
docker compose ps
```

### 5. Create Django Superuser (Admin)
```bash
docker compose exec backend python manage.py createsuperuser
```

### 6. Enable Free SSL / HTTPS with Let's Encrypt (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ☁️ Method 2: Modern Managed Cloud (Vercel + Render / Railway + Supabase)

Zero server maintenance with automatic continuous deployment (CI/CD) on every Git push.

### 1. Database (Supabase PostgreSQL)
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. Under **Project Settings -> Database**, copy the **Connection string (URI)**.
   *(e.g., `postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`)*

---

### 2. Backend (Render.com or Railway.app)
1. Link your GitHub repository on [Render](https://render.com) or [Railway](https://railway.app).
2. Set **Root Directory**: `backend`
3. Set **Build Command**:
   ```bash
   pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
   ```
4. Set **Start Command**:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2
   ```
5. Add **Environment Variables**:
   - `DEBUG`: `False`
   - `DATABASE_URL`: *(Your Supabase connection URI)*
   - `SECRET_KEY`: *(Your Django secret key)*
   - `ALLOWED_HOSTS`: `*`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`

---

### 3. Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) and click **Add New -> Project**.
2. Select your repository and set **Root Directory**: `frontend`
3. Set **Framework Preset**: `Vite`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api/v1`
5. Click **Deploy**.

---

## 🛡️ Production Verification Checklist

| Check | Item | Status |
|---|---|---|
| 🔒 | `DEBUG = False` in production | ✅ Required |
| 🔑 | Unique, secure `SECRET_KEY` | ✅ Required |
| 🌐 | `ALLOWED_HOSTS` matches domain | ✅ Configured |
| 🗄️ | Database migrations applied (`python manage.py migrate`) | ✅ Completed |
| ⚡ | GZip compression enabled (`django.middleware.gzip.GZipMiddleware`) | ✅ Active |
| 📦 | Frontend lazy route code splitting | ✅ Active |
| 💳 | Live Bakong KHQR QR & Card payment gateway configured | ✅ Ready |

