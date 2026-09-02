# 📋 FarmerDirect — Production Security Checklist

Use this checklist prior to launching live or deploying updates to production.

---

### Core Security & Secrets
- [x] **`DEBUG=False`** enforced by default in production.
- [x] **`SECRET_KEY`** required in environment (fails to boot in prod without 50+ char random secret).
- [x] **No hardcoded secrets** in Git repository or `.env.example`.
- [x] **`.env`** and credentials included in `.gitignore` and `.dockerignore`.
- [x] **Credential Rotation**: All previously exposed test API keys/passwords scheduled for production rotation.

### Network, SSL & Headers
- [x] **HTTPS Enabled**: `SECURE_SSL_REDIRECT = True` when `DEBUG=False`.
- [x] **HSTS Configured**: `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SECURE_HSTS_PRELOAD = True`.
- [x] **Strict Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Secure Cookies**: `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`, `SESSION_COOKIE_HTTPONLY = True`.
- [x] **CORS Allowlist**: Wildcards (`*`) removed; only trusted production and local dev origins permitted.
- [x] **CSRF Trusted Origins**: Configured for Render and Vercel domains.

### Authentication & Authorization
- [x] **Short-Lived JWT Tokens**: Access tokens expire in 15 minutes; refresh tokens expire in 7 days.
- [x] **Token Rotation & Blacklist**: Rotated refresh tokens are blacklisted immediately (`BLACKLIST_AFTER_ROTATION = True`).
- [x] **Email Verification Gating**: Unverified accounts blocked from login with `email_not_verified` code.
- [x] **Google OAuth 2.0**: ID token signatures verified against Google servers before user creation.
- [x] **Role Escalation Prevention**: `role`, `is_staff`, and `is_superuser` are protected from arbitrary client assignment.
- [x] **Object-Level Authorization (IDOR)**: Queries strictly scoped to `request.user` across orders, addresses, reviews, and carts.

### Financial Transactions & Inventory
- [x] **Server-Side Verification**: Orders are never marked `PAID` via client request; verified via ABA PayWay Check Transaction API.
- [x] **Simulation Endpoint Gated**: `SimulatePaymentSuccessView` returns `403 Forbidden` in production.
- [x] **Webhook Idempotency**: `ProcessedWebhook` model prevents duplicate or replayed notifications.
- [x] **Inventory Row-Locking**: `select_for_update()` inside `transaction.atomic()` prevents concurrent overselling.

### Infrastructure & Rate Limiting
- [x] **Rate Limiting Enabled**: DRF throttling applied for authentication (10/min), payments (30/min), and uploads (20/min).
- [x] **Docker Hardening**: Containers run under dedicated non-root `app` user; PostgreSQL and Redis ports isolated on internal network.
- [x] **API Documentation Gated**: Swagger and OpenAPI schema endpoints require admin authentication in production.
- [x] **Django Deployment Security Checks**: `python manage.py check --deploy` passes with 0 fatal errors.
- [x] **Automated Test Coverage**: 26 / 26 automated unit and security tests passing.
