from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Address
from apps.orders.models import Order
from apps.orders.services import OrderService
from apps.farmers.models import FarmerProfile
from apps.products.models import Category, Product, Inventory
from apps.cart.models import Cart, CartItem
from .models import Payment, PaymentTransaction, ProcessedWebhook
from .services import PaymentService, PaymentSettlementError, WebhookSignatureVerificationError, ABAPayWayGateway
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

    def test_unsigned_webhook_leaves_payment_pending(self):
        payment = Payment.objects.create(
            order=self.order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=self.order.total,
            status=Payment.Status.PENDING,
            transaction_id='ABA-FD-TEST-9901'
        )
        payload = {
            'tran_id': payment.transaction_id,
            'amount': str(payment.amount),
            'req_time': '20260907090000',
            'merchant_id': 'ec478104',
        }
        # Call webhook without signature header or hash field
        response = self.client.post('/api/v1/payments/webhooks/aba-payway/', payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(ProcessedWebhook.objects.filter(event_id=payment.transaction_id).count(), 0)

    @override_settings(ABA_PAYWAY_MERCHANT_ID='ec478104', ABA_PAYWAY_API_KEY='test-secret-key')
    @patch.object(ABAPayWayGateway, 'verify_payment', return_value=True)
    def test_replayed_tran_id_does_not_duplicate_transaction(self, mock_verify):
        payment = Payment.objects.create(
            order=self.order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=self.order.total,
            status=Payment.Status.PENDING,
            transaction_id='ABA-FD-REPLAY-01'
        )
        req_time = '20260907100000'
        raw_str = f"{req_time}ec478104{payment.transaction_id}{payment.amount:.2f}"
        sig = ABAPayWayGateway.get_hash(raw_str, 'test-secret-key')
        payload = {
            'tran_id': payment.transaction_id,
            'amount': f"{payment.amount:.2f}",
            'req_time': req_time,
            'merchant_id': 'ec478104',
            'hash': sig,
        }

        # First webhook delivery
        resp1 = self.client.post('/api/v1/payments/webhooks/aba-payway/', payload)
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.COMPLETED)
        self.assertEqual(PaymentTransaction.objects.filter(order=self.order).count(), 1)

        # Replayed webhook delivery
        resp2 = self.client.post('/api/v1/payments/webhooks/aba-payway/', payload)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data.get('status'), 'already_processed')
        self.assertEqual(PaymentTransaction.objects.filter(order=self.order).count(), 1)

    @override_settings(ABA_PAYWAY_MERCHANT_ID='ec478104', ABA_PAYWAY_API_KEY='test-secret-key')
    def test_amount_mismatch_does_not_settle(self):
        payment = Payment.objects.create(
            order=self.order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=self.order.total,  # $12.00
            status=Payment.Status.PENDING,
            transaction_id='ABA-FD-MISMATCH-01'
        )
        req_time = '20260907100000'
        # Attacker reports $1.00 instead of $12.00
        tampered_amount = '1.00'
        raw_str = f"{req_time}ec478104{payment.transaction_id}{tampered_amount}"
        sig = ABAPayWayGateway.get_hash(raw_str, 'test-secret-key')
        payload = {
            'tran_id': payment.transaction_id,
            'amount': tampered_amount,
            'req_time': req_time,
            'merchant_id': 'ec478104',
            'hash': sig,
        }

        response = self.client.post('/api/v1/payments/webhooks/aba-payway/', payload)
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(PaymentTransaction.objects.filter(order=self.order).count(), 0)

    def test_bakong_verify_payment_fails_closed_without_gateway_confirmation(self):
        payment = Payment.objects.create(
            order=self.order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=self.order.total,
            status=Payment.Status.PENDING,
            transaction_id='KHQR-RAW-001'
        )
        result = PaymentService.verify_payment(payment)
        self.assertFalse(result)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)

    @override_settings(DEBUG=True)
    @patch('apps.payments.payway_client.PayWayClient.check_transaction')
    def test_aba_payway_status_minus_one_does_not_settle_even_in_debug(self, mock_check):
        mock_check.return_value = {'status': -1, 'description': 'Timeout or connection failed'}
        payment = Payment.objects.create(
            order=self.order,
            payment_method=Order.PaymentMethod.BAKONG_QR,
            amount=self.order.total,
            status=Payment.Status.PENDING,
            transaction_id='ABA-DEBUG-FAIL'
        )
        result = PaymentService.verify_payment(payment)
        self.assertFalse(result)
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)



class PaymentFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Roots', slug='roots-pay')
        
        self.farmer_user = User.objects.create_user(email='farmpay@example.com', password='password123', role='FARMER')
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user, farm_name='Pay Farm', province='Siem Reap', is_verified=True
        )
        self.product = Product.objects.create(
            farmer=self.farmer_profile, category=self.category, name='Pay Carrots',
            price=Decimal('2.00'), unit='KG', minimum_order_qty=Decimal('1.00'),
            harvest_date=timezone.now().date(), status=Product.Status.ACTIVE
        )
        Inventory.objects.create(product=self.product, available_quantity=Decimal('20.00'))

        self.customer = User.objects.create_user(email='buyerpay@example.com', password='password123', role='CUSTOMER')
        self.address = Address.objects.create(
            user=self.customer, label='Home', recipient_name='Buyer Dara',
            phone_number='+85512345678', province='Siem Reap', district='Siem Reap',
            street_address='St 08'
        )

        cart, _ = Cart.objects.get_or_create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('5.00'))
        orders = OrderService.checkout(self.customer, self.address.id)
        self.order = orders[0]

    def test_cod_does_not_autocomplete_on_verify(self):
        # Create a COD payment manually since checkout created it via signal
        payment, _ = Payment.objects.get_or_create(
            order=self.order,
            defaults={'payment_method': Order.PaymentMethod.COD, 'amount': self.order.total, 'status': Payment.Status.PENDING}
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/v1/payments/{self.order.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Payment should still be pending
        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)
        
        # Calling verify should return success=pending
        self.assertEqual(response.data['status'], 'pending')


    def test_stripe_credit_card_does_not_autocomplete_without_real_intent(self):
        payment, _ = Payment.objects.get_or_create(
            order=self.order,
            defaults={
                'payment_method': Order.PaymentMethod.CREDIT_CARD,
                'amount': self.order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': 'pi_mock_123'
            }
        )

        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/v1/payments/{self.order.id}/verify/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.Status.PENDING)
        self.assertEqual(response.data['status'], 'pending')

    @override_settings(DEBUG=True)
    def test_payment_success_records_transaction_with_commission_deduction(self):
        from apps.payments.models import PaymentTransaction
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/v1/payments/{self.order.id}/simulate-success/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PAID)

        # Check PaymentTransaction record was created
        tx = PaymentTransaction.objects.filter(order=self.order).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.status, PaymentTransaction.Status.SUCCESS)
        self.assertEqual(tx.gross_amount, self.order.total)
        self.assertEqual(tx.platform_commission, self.order.marketplace_commission)
        self.assertEqual(tx.farmer_net_payout, self.order.farmer_payout)
        self.assertIsNotNone(tx.settled_at)

        # Verify transaction list endpoint
        list_resp = self.client.get('/api/v1/payments/transactions/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        tx_list = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        self.assertEqual(len(tx_list), 1)
        self.assertEqual(tx_list[0]['transaction_id'], tx.transaction_id)
        self.assertTrue(tx_list[0]['customer_account_id'].startswith('USR-'))
        self.assertTrue(tx_list[0]['farmer_account_id'].startswith('FMR-'))

    def test_farmer_registration_with_bank_details(self):
        reg_payload = {
            'email': 'green_organic_farm@example.com',
            'username': 'greenorganic',
            'password': 'SecureKhmer@2026!',
            'role': 'FARMER',
            'farm_name': 'Green Organic Farm',
            'province': 'Battambang',
            'bank_name': 'ABA Bank',
            'bank_account_name': 'GREEN ORGANIC FARM CO',
            'bank_account_number': '001 234 567',
            'bakong_account_id': 'green_farm@aba'
        }
        res = self.client.post('/api/v1/auth/register/', reg_payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_farmer = User.objects.get(email='green_organic_farm@example.com')
        self.assertTrue(new_farmer.account_id.startswith('FMR-'))
        self.assertEqual(new_farmer.farmer_profile.bank_name, 'ABA Bank')
        self.assertEqual(new_farmer.farmer_profile.bank_account_name, 'GREEN ORGANIC FARM CO')
        self.assertEqual(new_farmer.farmer_profile.bank_account_number, '001 234 567')
        self.assertEqual(new_farmer.farmer_profile.bakong_account_id, 'green_farm@aba')
        self.assertEqual(new_farmer.farmer_profile.account_id, new_farmer.account_id)

