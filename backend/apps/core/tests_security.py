import uuid
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Address
from apps.farmers.models import FarmerProfile
from apps.products.models import Category, Product, Inventory
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment, PaymentTransaction, ProcessedWebhook
from apps.cart.models import Cart, CartItem
from apps.reviews.models import Review

User = get_user_model()


class SecurityAuditTestSuite(TestCase):
    """
    Comprehensive Security Verification Test Suite
    Tests Authentication, Authorization (IDOR), Role Escalation, Payments,
    Inventory Row-Locking, and Webhook Idempotency.
    """

    def setUp(self):
        cache.clear()
        self.client = APIClient()

        # Customer 1
        self.customer1 = User.objects.create_user(
            email='customer1@example.com',
            username='customer1',
            password='SecureKhmer@2026!',
            role=User.Role.CUSTOMER,
            email_verified=True
        )

        # Customer 2 (Attacker attempting IDOR)
        self.customer2 = User.objects.create_user(
            email='customer2@example.com',
            username='customer2',
            password='SecureKhmer@2026!',
            role=User.Role.CUSTOMER,
            email_verified=True
        )

        # Farmer 1
        self.farmer_user1 = User.objects.create_user(
            email='farmer1@example.com',
            username='farmer1',
            password='SecureKhmer@2026!',
            role=User.Role.FARMER,
            email_verified=True
        )
        self.farmer1 = FarmerProfile.objects.create(
            user=self.farmer_user1,
            farm_name='Green Angkor Valley',
            province='Siem Reap',
            is_verified=True
        )

        # Farmer 2
        self.farmer_user2 = User.objects.create_user(
            email='farmer2@example.com',
            username='farmer2',
            password='SecureKhmer@2026!',
            role=User.Role.FARMER,
            email_verified=True
        )
        self.farmer2 = FarmerProfile.objects.create(
            user=self.farmer_user2,
            farm_name='Battambang Organic Farms',
            province='Battambang',
            is_verified=True
        )

        # Category & Product
        self.category = Category.objects.create(name='Fresh Fruit', slug='fresh-fruit')
        self.product1 = Product.objects.create(
            farmer=self.farmer1,
            category=self.category,
            name='Sweet Mangoes',
            slug='sweet-mangoes',
            price=Decimal('2.50'),
            unit=Product.Unit.KG,
            status=Product.Status.ACTIVE,
            harvest_date=timezone.now().date()
        )
        self.inventory1 = Inventory.objects.create(
            product=self.product1,
            available_quantity=Decimal('50.00'),
            reserved_quantity=Decimal('0.00')
        )

        # Customer 1's Order
        self.order1 = Order.objects.create(
            customer=self.customer1,
            farmer=self.farmer1,
            status=Order.Status.PENDING,
            total=Decimal('15.00'),
            delivery_address_snapshot={'label': 'Home'}
        )

    def tearDown(self):
        cache.clear()

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & JWT SECURITY
    # -------------------------------------------------------------
    def test_jwt_token_rotation_blacklists_old_refresh_token(self):
        refresh = RefreshToken.for_user(self.customer1)
        refresh_str = str(refresh)

        # Refresh token once
        res = self.client.post('/api/v1/auth/refresh/', {'refresh': refresh_str})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        new_refresh = res.data.get('refresh')
        self.assertIsNotNone(new_refresh)

        # Attempt to replay the old blacklisted refresh token
        res_replay = self.client.post('/api/v1/auth/refresh/', {'refresh': refresh_str})
        self.assertEqual(res_replay.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_escalation_attempt_in_registration_payload_is_sanitized(self):
        """Users cannot grant themselves ADMIN role or is_staff privileges during registration."""
        res = self.client.post('/api/v1/auth/register/', {
            'email': 'eviladmin@example.com',
            'username': 'eviladmin',
            'password': 'SecureKhmer@2026!',
            'role': 'ADMIN',  # Malicious role escalation payload
            'is_staff': True,
            'is_superuser': True,
            'phone_number': '+85512999888'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='eviladmin@example.com').exists())

    # -------------------------------------------------------------
    # 2. OBJECT-LEVEL AUTHORIZATION & IDOR PREVENTION
    # -------------------------------------------------------------
    def test_customer_cannot_view_another_customers_order(self):
        """Customer 2 should receive 404/403 when trying to access Customer 1's order ID."""
        self.client.force_authenticate(user=self.customer2)
        res = self.client.get(f'/api/v1/orders/{self.order1.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_cannot_cancel_another_customers_order(self):
        """Customer 2 cannot cancel Customer 1's order."""
        self.client.force_authenticate(user=self.customer2)
        res = self.client.post(f'/api/v1/orders/{self.order1.id}/cancel/', {
            'reason': 'Malicious cancellation attempt'
        })
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_cannot_update_another_farmers_product(self):
        """Farmer 2 cannot update Farmer 1's product."""
        self.client.force_authenticate(user=self.farmer_user2)
        res = self.client.patch(f'/api/v1/farmer/products/{self.product1.id}/', {
            'name': 'Hacked Mangoes'
        })
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_cannot_update_another_farmers_inventory(self):
        """Farmer 2 cannot modify inventory for Farmer 1's product."""
        self.client.force_authenticate(user=self.farmer_user2)
        res = self.client.patch(f'/api/v1/farmer/inventory/{self.product1.id}/', {
            'available_quantity': 999
        })
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------------------------------------------
    # 3. PAYMENT SECURITY & IDEMPOTENCY
    # -------------------------------------------------------------
    @override_settings(DEBUG=False)
    def test_simulation_payment_strictly_forbidden_in_production(self):
        """Simulated payment endpoints must return 403 Forbidden in production."""
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post(f'/api/v1/payments/{self.order1.id}/simulate-success/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_payment_webhook_idempotency_ignores_duplicate_events(self):
        """Duplicate webhook notifications for the same transaction ID are ignored idempotently."""
        payment = Payment.objects.create(
            order=self.order1,
            amount=Decimal('15.00'),
            transaction_id='ABA-TEST-TRAN-100',
            status=Payment.Status.COMPLETED
        )
        # Mark as processed in idempotency table
        ProcessedWebhook.objects.create(
            provider='ABA_PAYWAY',
            event_id='ABA-TEST-TRAN-100'
        )

        res = self.client.post('/api/v1/payments/webhooks/aba-payway/', {
            'tran_id': 'ABA-TEST-TRAN-100'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get('status'), 'already_processed')

    # -------------------------------------------------------------
    # 4. INVENTORY RACE CONDITION PREVENTION
    # -------------------------------------------------------------
    def test_checkout_rejects_insufficient_stock(self):
        """Checkout fails when requested quantity exceeds inventory."""
        self.inventory1.available_quantity = Decimal('2.00')
        self.inventory1.save()

        # Add address
        addr = Address.objects.create(
            user=self.customer1,
            label='Home',
            recipient_name='Tester',
            phone_number='+85512000111',
            province='Siem Reap',
            district='Siem Reap',
            street_address='St 01'
        )

        # Add 5 units to cart (exceeds available 2)
        cart = Cart.objects.create(user=self.customer1)
        CartItem.objects.create(cart=cart, product=self.product1, quantity=Decimal('5.00'))

        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/v1/orders/checkout/', {
            'address_id': str(addr.id),
            'payment_method': 'COD'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Stock conflict', str(res.data))

    # -------------------------------------------------------------
    # 5. PRODUCTION CORS & CSRF WHITELIST ENFORCEMENT
    # -------------------------------------------------------------
    @override_settings(
        DEBUG=False,
        CORS_ALLOWED_ORIGINS=['https://market-sale-direct.vercel.app'],
        CORS_ALLOWED_ORIGIN_REGEXES=[]
    )
    def test_prod_cors_rejects_random_vercel_preview(self):
        """Random preview deployments on *.vercel.app must not be allowed or reflected."""
        attacker_origin = 'https://evil-preview.vercel.app'
        response = self.client.get(
            '/api/v1/products/',
            HTTP_ORIGIN=attacker_origin
        )
        allow_origin = response.headers.get('Access-Control-Allow-Origin')
        self.assertNotEqual(allow_origin, attacker_origin)
        self.assertIsNone(allow_origin)

    @override_settings(
        DEBUG=False,
        CORS_ALLOWED_ORIGINS=['https://market-sale-direct.vercel.app'],
        CORS_ALLOWED_ORIGIN_REGEXES=[]
    )
    def test_prod_cors_allows_exact_frontend(self):
        """Production frontend origin is reflected exactly once."""
        trusted_origin = 'https://market-sale-direct.vercel.app'
        response = self.client.get(
            '/api/v1/products/',
            HTTP_ORIGIN=trusted_origin
        )
        self.assertEqual(response.headers.get('Access-Control-Allow-Origin'), trusted_origin)

    # -------------------------------------------------------------
    # 6. SEED PASSWORD ROTATION COMMAND TESTS
    # -------------------------------------------------------------
    def test_reset_seed_passwords_refuses_without_env_var(self):
        """Command must raise CommandError if ALLOW_SEED_RESET!=1."""
        from django.core.management import call_command
        from django.core.management.base import CommandError
        import os

        old_val = os.environ.pop('ALLOW_SEED_RESET', None)
        try:
            with self.assertRaises(CommandError) as ctx:
                call_command('reset_seed_passwords')
            self.assertIn("ALLOW_SEED_RESET=1", str(ctx.exception))
        finally:
            if old_val is not None:
                os.environ['ALLOW_SEED_RESET'] = old_val

    def test_reset_seed_passwords_rotates_passwords_when_allowed(self):
        """Command randomizes passwords for seeded accounts when ALLOW_SEED_RESET=1."""
        from django.core.management import call_command
        import os

        seeded_user = User.objects.create_user(
            email='sokha.farm@farmerdirect.com',
            username='sokha_test',
            password='farmer123456',
            role=User.Role.FARMER,
        )
        old_hash = seeded_user.password

        os.environ['ALLOW_SEED_RESET'] = '1'
        try:
            call_command('reset_seed_passwords')
            seeded_user.refresh_from_db()
            self.assertNotEqual(seeded_user.password, old_hash)
            self.assertFalse(seeded_user.check_password('farmer123456'))
        finally:
            os.environ.pop('ALLOW_SEED_RESET', None)

    # -------------------------------------------------------------
    # 7. HEALTH CHECK ENDPOINT TESTS
    # -------------------------------------------------------------
    def test_health_endpoint_returns_status_ok_only_without_route_map(self):
        """Root and health endpoints must return status: ok only without route map."""
        for path in ['/', '/health/']:
            res = self.client.get(path)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            data = res.json()
            self.assertEqual(data, {'status': 'ok'})
            self.assertNotIn('api_v1_endpoints', data)
            self.assertNotIn('service', data)
            self.assertNotIn('version', data)

    def test_robots_txt_disallows_all_crawlers_on_backend(self):
        """Backend robots.txt must disallow all crawlers from scraping API and admin surfaces."""
        res = self.client.get('/robots.txt')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/plain', res.headers.get('Content-Type', ''))
        content = res.content.decode('utf-8')
        self.assertIn('User-agent: *', content)
        self.assertIn('Disallow: /', content)

    # -------------------------------------------------------------
    # 8. AUTH THROTTLING & ANTI-ACCOUNT ENUMERATION
    # -------------------------------------------------------------
    def test_login_returns_identical_error_for_unknown_email_vs_wrong_password(self):
        """Unknown email and bad password must return identical 401 response to prevent user enumeration."""
        res_unknown = self.client.post('/api/v1/auth/login/', {
            'email': 'nonexistent_account_xyz@example.com',
            'password': 'WrongPassword123!'
        })
        res_bad_pw = self.client.post('/api/v1/auth/login/', {
            'email': self.customer1.email,
            'password': 'WrongPassword123!'
        })

        self.assertEqual(res_unknown.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_bad_pw.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_unknown.json(), res_bad_pw.json())

    def test_resend_verification_does_not_leak_email_existence(self):
        """Resending verification must return identical 200 response whether email exists or not."""
        res_unknown = self.client.post('/api/v1/auth/resend-verification/', {
            'email': 'ghost_user_doesnt_exist@example.com'
        })
        res_known = self.client.post('/api/v1/auth/resend-verification/', {
            'email': self.customer1.email
        })

        self.assertEqual(res_unknown.status_code, status.HTTP_200_OK)
        self.assertEqual(res_known.status_code, status.HTTP_200_OK)
        self.assertEqual(res_unknown.json(), res_known.json())

    def test_auth_views_have_auth_rate_throttle_configured(self):
        """All authentication endpoints must explicitly enforce AuthRateThrottle."""
        from apps.core.throttling import AuthRateThrottle
        from apps.accounts.views import (
            CustomTokenObtainPairView,
            CustomTokenRefreshView,
            RegisterView,
            VerifyEmailView,
            ResendVerificationEmailView,
            GoogleAuthView,
        )

        auth_views = [
            CustomTokenObtainPairView,
            CustomTokenRefreshView,
            RegisterView,
            VerifyEmailView,
            ResendVerificationEmailView,
            GoogleAuthView,
        ]
        for view_cls in auth_views:
            self.assertIn(
                AuthRateThrottle,
                getattr(view_cls, 'throttle_classes', []),
                f"{view_cls.__name__} must have AuthRateThrottle configured"
            )

    def test_login_rate_throttle_blocks_sixth_attempt_per_ip_and_email(self):
        """Repeated login attempts beyond the 5/15m limit must receive HTTP 429 on the 6th attempt."""
        cache.clear()
        # First 5 attempts return 401 Unauthorized
        for _ in range(5):
            res = self.client.post('/api/v1/auth/login/', {
                'email': 'victim@example.com',
                'password': 'badpassword'
            })
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 6th attempt must be blocked by LoginRateThrottle
        res_blocked = self.client.post('/api/v1/auth/login/', {
            'email': 'victim@example.com',
            'password': 'badpassword'
        })
        self.assertEqual(res_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_auth_rate_throttle_blocks_brute_force_exceeding_limit(self):
        """Repeated auth token refresh requests beyond the 10/minute auth rate limit must receive HTTP 429."""
        cache.clear()
        # 10 attempts evaluated against refresh endpoint (returning 400/401)
        for _ in range(10):
            res = self.client.post('/api/v1/auth/refresh/', {
                'refresh': 'invalid_token_sample'
            })
            self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

        # 11th attempt must be blocked by AuthRateThrottle
        res_blocked = self.client.post('/api/v1/auth/refresh/', {
            'refresh': 'invalid_token_sample'
        })
        self.assertEqual(res_blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_auth_error_envelope_sanitizes_errordetail_types(self):
        """Validation errors must have clean primitive types in envelope without leaking ErrorDetail objects."""
        from apps.core.exceptions import sanitize_error_payload
        from rest_framework.exceptions import ErrorDetail

        raw_errors = {
            "email": [ErrorDetail("Enter a valid email address.", code="invalid")],
            "nested": {
                "field": [ErrorDetail("This field is required.", code="required")]
            }
        }
        sanitized = sanitize_error_payload(raw_errors)
        self.assertEqual(sanitized["email"], ["Enter a valid email address."])
        self.assertEqual(sanitized["nested"]["field"], ["This field is required."])
        self.assertIsInstance(sanitized["email"][0], str)
        self.assertNotIsInstance(sanitized["email"][0], ErrorDetail)

    def test_cannot_initiate_payment_for_already_paid_order(self):
        """Initiating payment on an already paid order must be rejected with 400 Bad Request."""
        self.order1.payment_status = Order.PaymentStatus.PAID
        self.order1.save(update_fields=['payment_status'])

        self.client.force_authenticate(user=self.customer1)
        res = self.client.post(f'/api/v1/payments/{self.order1.id}/initiate/', {
            'payment_method': 'BAKONG_QR'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been paid", str(res.json()))

    def test_checkout_idempotency_prevents_duplicate_orders(self):
        """Retrying checkout with the same Idempotency-Key returns existing orders without double-charging or deducting stock twice."""
        from apps.orders.services import OrderService

        # Setup address and cart
        addr = Address.objects.create(
            user=self.customer1,
            label='Home',
            recipient_name='Customer One',
            phone_number='012345678',
            province='Siem Reap',
            district='Siem Reap',
            street_address='123 Main St',
            is_default=True
        )
        cart, _ = Cart.objects.get_or_create(user=self.customer1)
        CartItem.objects.create(cart=cart, product=self.product1, quantity=Decimal('2.00'))

        idempotency_key = "unique_checkout_idem_999"

        # First checkout attempt
        orders1 = OrderService.checkout(
            user=self.customer1,
            address_id=addr.id,
            payment_method=Order.PaymentMethod.COD,
            idempotency_key=idempotency_key
        )
        self.assertEqual(len(orders1), 1)

        # Retry with identical idempotency key
        orders2 = OrderService.checkout(
            user=self.customer1,
            address_id=addr.id,
            payment_method=Order.PaymentMethod.COD,
            idempotency_key=idempotency_key
        )
        self.assertEqual(len(orders2), 1)
        self.assertEqual(orders1[0].id, orders2[0].id)
        self.assertEqual(Order.objects.filter(customer=self.customer1, idempotency_key__startswith=idempotency_key).count(), 1)

    def test_cod_delivery_creates_payment_transaction_ledger(self):
        """When a COD order is marked DELIVERED, it must atomically write a PaymentTransaction recording commissions and farmer payout."""
        from apps.orders.services import OrderService

        cod_order = Order.objects.create(
            customer=self.customer1,
            farmer=self.farmer1,
            subtotal=Decimal('20.00'),
            delivery_fee=Decimal('2.00'),
            total=Decimal('22.00'),
            commission_rate_percentage=Decimal('5.00'),
            marketplace_commission=Decimal('1.00'),
            farmer_payout=Decimal('19.00'),
            payment_method=Order.PaymentMethod.COD,
            payment_status=Order.PaymentStatus.PENDING,
            status=Order.Status.READY
        )
        Payment.objects.create(
            order=cod_order,
            payment_method=Order.PaymentMethod.COD,
            amount=cod_order.total,
            status=Payment.Status.PENDING,
            transaction_id=f"COD-{uuid.uuid4().hex[:12].upper()}"
        )

        OrderService.update_order_status(cod_order, Order.Status.DELIVERED, actor=self.farmer_user1)
        cod_order.refresh_from_db()

        self.assertEqual(cod_order.status, Order.Status.DELIVERED)
        self.assertEqual(cod_order.payment_status, Order.PaymentStatus.PAID)
        self.assertEqual(cod_order.payment.status, Payment.Status.COMPLETED)

        # Confirm immutable ledger transaction exists
        tx = PaymentTransaction.objects.filter(order=cod_order).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.platform_commission, Decimal('1.00'))
        self.assertEqual(tx.farmer_net_payout, Decimal('19.00'))
        self.assertEqual(tx.status, PaymentTransaction.Status.SUCCESS)

    def test_farmer_cannot_set_negative_inventory_stock(self):
        """Farmer cannot set negative inventory quantity via API."""
        self.client.force_authenticate(user=self.farmer_user1)
        res = self.client.patch(f'/api/v1/farmer/inventory/{self.product1.id}/', {
            'available_quantity': '-15.00'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('available_quantity', str(res.json()))

    def test_farmer_cannot_create_product_with_zero_or_negative_price(self):
        """Creating products with zero or negative price must be rejected with 400 Bad Request."""
        self.client.force_authenticate(user=self.farmer_user1)
        res_neg = self.client.post('/api/v1/farmer/products/', {
            'category': self.category.id,
            'name': 'Free Produce Exploit',
            'price': '-2.00',
            'unit': 'KG',
            'harvest_date': timezone.now().date().isoformat(),
            'status': 'DRAFT'
        })
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)

        res_zero = self.client.post('/api/v1/farmer/products/', {
            'category': self.category.id,
            'name': 'Zero Produce Exploit',
            'price': '0.00',
            'unit': 'KG',
            'harvest_date': timezone.now().date().isoformat(),
            'status': 'DRAFT'
        })
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unprofiled_user_cannot_access_farmer_portal(self):
        """User with FARMER role but no associated FarmerProfile must be blocked with 403 Forbidden."""
        orphan_farmer = User.objects.create_user(
            email='orphan_farmer@example.com',
            username='orphan_farmer',
            password='SecureKhmer@2026!',
            role=User.Role.FARMER,
            email_verified=True
        )
        self.client.force_authenticate(user=orphan_farmer)
        res = self.client.get('/api/v1/farmer/products/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_farmer_cannot_update_another_farmers_order(self):
        """Farmer cannot update or manipulate another farmer's orders (IDOR protection)."""
        self.client.force_authenticate(user=self.farmer_user2)
        res = self.client.patch(f'/api/v1/farmer/orders/{self.order1.id}/status/', {
            'status': 'CONFIRMED'
        })
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_status_cannot_transition_from_delivered_terminal_state(self):
        """Orders marked DELIVERED cannot transition to any other status."""
        from apps.orders.services import OrderService
        from rest_framework.exceptions import ValidationError

        self.order1.status = Order.Status.DELIVERED
        self.order1.save(update_fields=['status'])

        with self.assertRaises(ValidationError):
            OrderService.update_order_status(self.order1, Order.Status.CANCELLED, actor=self.farmer_user1)

    def test_cancelling_paid_order_marks_payment_and_ledger_as_refunded(self):
        """Cancelling an already paid order marks payment REFUNDED and logs refund in ledger."""
        from apps.orders.services import OrderService

        paid_order = Order.objects.create(
            customer=self.customer1,
            farmer=self.farmer1,
            subtotal=Decimal('30.00'),
            delivery_fee=Decimal('2.00'),
            total=Decimal('32.00'),
            commission_rate_percentage=Decimal('5.00'),
            marketplace_commission=Decimal('1.50'),
            farmer_payout=Decimal('28.50'),
            payment_method=Order.PaymentMethod.BAKONG_QR,
            payment_status=Order.PaymentStatus.PAID,
            status=Order.Status.CONFIRMED
        )
        payment = Payment.objects.create(
            order=paid_order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=paid_order.total,
            status=Payment.Status.COMPLETED,
            transaction_id=f"KHQR-{uuid.uuid4().hex[:12].upper()}"
        )

        # Cancel the order
        OrderService.update_order_status(paid_order, Order.Status.CANCELLED, actor=self.farmer_user1)
        paid_order.refresh_from_db()
        payment.refresh_from_db()

        self.assertEqual(paid_order.status, Order.Status.CANCELLED)
        self.assertEqual(paid_order.payment_status, Order.PaymentStatus.REFUNDED)
        self.assertEqual(payment.status, Payment.Status.REFUNDED)

        # Confirm ledger transaction has REFUNDED status
        tx = PaymentTransaction.objects.filter(order=paid_order).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.status, PaymentTransaction.Status.REFUNDED)







