# 🌾 FarmerDirect Marketplace

A modern, production-grade agricultural marketplace platform built to connect local farmers directly with consumers, restaurants, hotels, and local businesses. Zero middlemen, fair trade pricing, verified farm credentials, and fresh-harvest order dispatch.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 + Vite + TypeScript                    │
│             Tailwind CSS • TanStack Query • Lucide Icons • Zod          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JWT Auth
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Django REST Framework (DRF 5.1)                    │
│   Modular Clean Service Layer • ACID Inventory Locking • Uniform REST  │
├─────────────────┬───────────────────┬──────────────────────────────────┤
│  PostgreSQL 16  │   Redis 7 Cache   │     Celery Async Workers         │
│  (ACID Engine)  │   (Token & Cart)  │     (Notifications & Sync)       │
└─────────────────┴───────────────────┴──────────────────────────────────┘
```

---

## 🚀 Key Feature Matrix

### 👤 1. Conscious Consumers & Wholesale Buyers (B2C & B2B)
- **Direct Farm Sourcing**: Browse fresh vegetables, heritage grains, tropical fruits, and spices directly from verified growers.
- **Dynamic Catalog Filters**: Full-text search, category taxonomy, 100% certified organic toggle, origin province, and price ordering.
- **Farm Grouped Shopping Cart**: Items dynamically grouped by farm with clear per-farm delivery fees and subtotal calculations.
- **Multi-Method Checkout**:
  - 💵 **Cash on Delivery (COD)**
  - 📱 **Bakong KHQR** (Instant QR payment with Cambodian banking apps)
  - 💳 **Credit / Debit Card** (Stripe gateway abstraction)
- **Live Order Tracking**: Visual progress tracker (`PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED`).
- **Verified Reviews**: Review produce exclusively after confirmed delivery.

### 🚜 2. Farmer Portal
- **Real-Time Analytics**: Total sales revenue, 30-day monthly revenue, pending order count, active products, and top-selling produce.
- **Produce Management**: Multi-image uploads, minimum order quantities, harvest date tracking, and organic certification badges.
- **Live Inventory Manager**: Fast inline stock quantity editor with automatic low-stock warnings.
- **Fulfillment Console**: Step through order statuses, assign driver names and phone numbers, and view customer notes.
- **Customer Directory**: Track loyal restaurants, cafes, and consumers with lifetime spend totals.
- **Trust Badge Verification**: Submit government ID and land ownership certificates for platform administrator approval.

### 🛡️ 3. Administrator Console
- **Marketplace GMV Oversight**: Real-time Gross Merchandise Volume, commission revenues (5%), and total order metrics.
- **Farmer Verification Console**: Inspect credentials and issue verified producer badges (`Verified Farm ✓`).
- **Order & Product Moderation**: Oversight across all platform-wide listings and transactions.
- **Review Moderation**: Audit and flag customer reviews for platform integrity.

---

## 🔐 Concurrency & Financial Integrity

1. **ACID Inventory Locking**:
   - Checkout uses `transaction.atomic()` and `Inventory.objects.select_for_update()` to prevent double-selling under high concurrency.
2. **Immutable Price Snapshots**:
   - `OrderItem` stores point-in-time snapshots of product name, image, unit, and unit price. Subsequent farmer price edits never alter historical invoices.
3. **Backend-Calculated Totals**:
   - Frontend prices are untrusted. Backend recalculates product subtotal, delivery fee, commission, and grand totals on every mutation.
4. **Stock Restoration on Cancellation**:
   - Rejecting or cancelling an order immediately releases reserved stock back into available inventory.

---

## 🔑 Pre-Seeded Demonstration Accounts

All accounts come pre-configured with active produce, historical orders, and verified reviews:

| Role | Email Address | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@farmerdirect.com` | `admin123456` | Platform Admin Console & Verification |
| **Farmer (Siem Reap)** | `sokha.farm@farmerdirect.com` | `farmer123456` | Sokha Green Organic Farm |
| **Farmer (Battambang)** | `battambang.valley@farmerdirect.com` | `farmer123456` | Battambang Valley Rice & Fruits |
| **Farmer (Kampot)** | `kampot.pepper@farmerdirect.com` | `farmer123456` | Kampot Heritage Pepper Estate |
| **Farmer (Mondulkiri)** | `mondulkiri.coffee@farmerdirect.com` | `farmer123456` | Mondulkiri Highlands Organic |
| **Customer** | `customer@example.com` | `customer123456` | Som Dara (Individual / Restaurant) |

---

## 🛠️ Quick Start Guide

### Option A: Running with Docker Compose (Recommended)

```bash
# Clone and enter directory
cd Farmer-direct_marketplace

# Launch PostgreSQL, Redis, Celery, Django REST Framework, and React Frontend
docker-compose up --build
```
- **Web Marketplace**: [http://localhost](http://localhost)
- **Django REST API**: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **OpenAPI Swagger UI**: [http://localhost:8000/swagger/](http://localhost:8000/swagger/)
- **Interactive Redoc**: [http://localhost:8000/redoc/](http://localhost:8000/redoc/)

---

### Option B: Local Manual Setup

#### 1. Backend (Django REST Framework)
```bash
cd backend
python -m venv ..\venv
..\venv\Scripts\activate  # On Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data   # Seeds 10 verified farms, 47 products, reviews & orders
python manage.py runserver
```

#### 2. Frontend (React 19 + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Testing

Run the Django automated test suite covering authentication, default address exclusivity, product filters, atomic checkout inventory locking, and verified review access controls:

```bash
cd backend
python manage.py test
```

---

## 🚀 Production Deployment

FarmerDirect is configured for instant containerized deployment and cloud PaaS workflows:

- 🐳 **Docker Compose (VPS / AWS EC2 / DigitalOcean)**: Single-command deployment orchestrating Nginx, React, Django Gunicorn, PostgreSQL 16, Redis 7, and Celery workers.
- ☁️ **Cloud Platform Deployment (Vercel + Render / Railway + Supabase)**: Serverless frontend with managed backend and remote PostgreSQL.

👉 **See the complete step-by-step instructions in [DEPLOYMENT.md](file:///c:/Users/User/Desktop/Farmer-direct_marketplace/DEPLOYMENT.md)**.

---

## 📂 Project Structure

```
Farmer-direct_marketplace/
├── docker-compose.yml              # Multi-container orchestration
├── backend/
│   ├── config/                     # Django master settings, URLs, Celery
│   ├── apps/
│   │   ├── core/                   # Base models, custom exception handler, analytics
│   │   ├── accounts/               # Custom User (Customer, Farmer, Admin), Addresses
│   │   ├── farmers/                # FarmerProfile, Verification workflow
│   │   ├── products/               # Categories, Product, ProductImage, Inventory
│   │   ├── cart/                   # Cart, CartItem, Per-farmer group calculations
│   │   ├── orders/                 # Order, OrderItem, Atomic Checkout Service
│   │   ├── reviews/                # Verified Reviews, Aggregate Star Recalculation
│   │   ├── payments/               # Payment Gateways (COD, Bakong KHQR, Stripe)
│   │   ├── notifications/          # In-app alerts
│   │   └── favorites/              # Wishlist and farm bookmarks
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── api/                    # Axios client, JWT interceptors, API services
    │   ├── context/                # AuthContext, CartContext
    │   ├── components/             # Reusable Buttons, Inputs, Badges, Modals, Cards, Navbars
    │   ├── pages/
    │   │   ├── public/             # HomePage, ProductsPage, ProductDetailPage, FarmersPage
    │   │   ├── auth/               # LoginPage, RegisterPage (Customer vs Farmer)
    │   │   ├── customer/           # CartPage, CheckoutPage, Orders, Addresses, Wishlist
    │   │   ├── farmer/             # Dashboard, Products, Inventory, Orders, Customers
    │   │   └── admin/              # GMV Analytics, Farmer Verification, Moderation
    │   └── types/                  # TypeScript domain interfaces
    ├── package.json
    └── tailwind.config.js
```

---

## 📄 License & Attribution
MIT License © 2026 FarmerDirect Marketplace Inc. Built with love for local agriculture and sustainable farming communities.

