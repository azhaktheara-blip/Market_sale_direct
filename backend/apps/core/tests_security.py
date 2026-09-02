import uuid
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Address
from apps.farmers.models import FarmerProfile
from apps.products.models import Category, Product, Inventory
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment, ProcessedWebhook
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
