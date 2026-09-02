from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.orders.models import Order
from apps.farmers.models import FarmerProfile
from .models import Payment
from .payway_client import PayWayClient

User = get_user_model()


class PaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer_user = User.objects.create_user(
            email='farmer_pay@example.com',
            password='SecureKhmer@2026!',
            role='FARMER'
        )
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            farm_name='Test Payment Farm',
            province='Siem Reap'
        )
        self.customer_user = User.objects.create_user(
            email='customer_pay@example.com',
            password='SecureKhmer@2026!',
            role='CUSTOMER'
        )
        self.order = Order.objects.create(
            order_number='FD-TEST-9901',
            customer=self.customer_user,
            farmer=self.farmer_profile,
            subtotal=Decimal('10.00'),
            delivery_fee=Decimal('2.00'),
            total=Decimal('12.00'),
            status=Order.Status.PENDING,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            payment_status=Order.PaymentStatus.PENDING
        )

    @override_settings(ABA_PAYWAY_MERCHANT_ID='ec478104', ABA_PAYWAY_API_KEY='test-merchant-api-key')
    def test_initiate_aba_payway_payment_returns_hash(self):
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(f'/api/v1/payments/{self.order.id}/initiate/', {
            'payment_method': 'BAKONG_QR',
            'currency': 'USD'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('qr_image', response.data)
        self.assertIn('qr_string', response.data)
        self.assertIn('signature_hash', response.data)
        self.assertIn('direct_pay_link', response.data)
        self.assertEqual(response.data['aba_merchant_id'], 'ec478104')

    @override_settings(DEBUG=False)
    def test_simulate_payment_forbidden_in_production(self):
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.post(f'/api/v1/payments/{self.order.id}/simulate-success/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PENDING)

    def test_payway_client_hmac_sha512_hash(self):
        client = PayWayClient(
            merchant_id='ec478104',
            api_key='ce16f4443ee14a83052c02f3ac36d96f58f0fcae'
        )
        raw_str = "20260901120000ec478104ABA-FD-00110.00"
        sig = client.get_hash(raw_str)
        self.assertTrue(len(sig) > 20)

