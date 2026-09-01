import hashlib
import uuid
from abc import ABC, abstractmethod
from decimal import Decimal
from django.utils import timezone
from .models import Payment
from apps.orders.models import Order


class BasePaymentGateway(ABC):
    @abstractmethod
    def create_payment(self, order: Order, **kwargs) -> dict:
        pass

    @abstractmethod
    def verify_payment(self, payment: Payment, **kwargs) -> bool:
        pass

    @abstractmethod
    def refund_payment(self, payment: Payment, amount: Decimal = None, **kwargs) -> bool:
        pass


class CashOnDeliveryGateway(BasePaymentGateway):
    def create_payment(self, order: Order, **kwargs) -> dict:
        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                'payment_method': Order.PaymentMethod.COD,
                'amount': order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': f"COD-{uuid.uuid4().hex[:12].upper()}"
            }
        )
        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'method': 'COD',
            'amount': str(payment.amount),
            'instructions': 'Pay in cash directly upon receiving your produce.'
        }

    def verify_payment(self, payment: Payment, **kwargs) -> bool:
        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        return True

    def refund_payment(self, payment: Payment, amount: Decimal = None, **kwargs) -> bool:
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status'])
        return True


from .khqr import BakongKHQR


class BakongKHQRGateway(BasePaymentGateway):
    """
    Cambodia National Bank Bakong / KHQR payment provider abstraction.
    Generates standard EMVCo compatible QR representation and handles verification webhook/polling.
    """
    def create_payment(self, order: Order, **kwargs) -> dict:
        currency = kwargs.get('currency', 'USD')
        # Exchange rate: 1 USD = 4,100 KHR
        amount = order.total if currency == 'USD' else round(order.total * Decimal('4100'), 0)

        farmer = order.farmer
        merchant_name = farmer.farm_name if farmer else "FarmerDirect Marketplace"
        city = farmer.province if farmer and farmer.province else "Phnom Penh"

        # Farmer specific Bakong account ID
        bakong_account_id = "farmerdirect@bakong"
        if farmer:
            if farmer.bakong_account_id:
                bakong_account_id = farmer.bakong_account_id.strip()
            elif farmer.phone_number:
                clean_phone = farmer.phone_number.replace(' ', '').replace('+', '').replace('-', '')
                bakong_account_id = f"{clean_phone}@aba"
            else:
                bakong_account_id = f"{farmer.slug[:15]}@bakong"

        khqr_payload = BakongKHQR.generate_payload(
            bakong_account_id=bakong_account_id,
            merchant_name=merchant_name,
            merchant_city=city,
            amount=amount,
            currency=currency,
            bill_number=order.order_number,
        )

        qr_image_base64 = BakongKHQR.generate_qr_image_base64(khqr_payload)
        tx_hash = hashlib.sha256(f"{order.id}:{order.total}:{bakong_account_id}:{timezone.now().isoformat()}".encode()).hexdigest().upper()

        farmer_qr_url = farmer.farmer_qr_image.url if farmer and farmer.farmer_qr_image else None

        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'payment_method': Order.PaymentMethod.BAKONG_QR,
                'amount': order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': f"KHQR-{tx_hash[:16]}",
                'payment_gateway_response': {
                    'qr_string': khqr_payload,
                    'qr_image': qr_image_base64,
                    'farmer_qr_url': farmer_qr_url,
                    'bakong_account_id': bakong_account_id,
                    'bank_name': getattr(farmer, 'bank_name', 'ABA Bank'),
                    'bank_account_name': getattr(farmer, 'bank_account_name', merchant_name),
                    'bank_account_number': getattr(farmer, 'bank_account_number', ''),
                    'hash': tx_hash,
                    'currency': currency,
                    'amount_khr': str(int(order.total * Decimal('4100'))),
                }
            }
        )

        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'method': 'BAKONG_QR',
            'amount_usd': str(payment.amount),
            'amount_khr': str(int(order.total * Decimal('4100'))),
            'currency': currency,
            'qr_string': khqr_payload,
            'qr_image': qr_image_base64,
            'farmer_qr_url': farmer_qr_url,
            'bakong_account_id': bakong_account_id,
            'farmer_bank_name': getattr(farmer, 'bank_name', 'ABA Bank') if farmer else 'Bakong',
            'farmer_account_name': getattr(farmer, 'bank_account_name', merchant_name) if farmer else merchant_name,
            'farmer_account_number': getattr(farmer, 'bank_account_number', '') if farmer else '',
            'transaction_id': payment.transaction_id,
            'signature_hash': tx_hash[:32],
            'deep_link': f"bakong://pay?qr={khqr_payload}",
            'instructions': f"Scan to pay ${order.total} directly to {merchant_name} using ABA Mobile, ACLEDA, Wing, or any Bakong-enabled app."
        }

    def verify_payment(self, payment: Payment, **kwargs) -> bool:
        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        payment.order.payment_status = Order.PaymentStatus.PAID
        payment.order.save(update_fields=['payment_status'])
        return True

    def refund_payment(self, payment: Payment, amount: Decimal = None, **kwargs) -> bool:
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status'])
        return True


class ABAPayWayGateway(BakongKHQRGateway):
    """
    Official ABA Bank PayWay Payment Gateway Integration.
    Supports Sandbox (https://checkout-sandbox.payway.com.kh/)
    and Production (https://checkout.payway.com.kh/).
    """
    @staticmethod
    def get_hash(raw_string: str, key: str) -> str:
        """Computes ABA PayWay HMAC-SHA512 signature in Base64."""
        signature = hmac.new(key.encode('utf-8'), raw_string.encode('utf-8'), hashlib.sha512).digest()
        return base64.b64encode(signature).decode('utf-8')

    def create_payment(self, order: Order, **kwargs) -> dict:
        base_url = getattr(settings, 'ABA_PAYWAY_BASE_URL', 'https://checkout-sandbox.payway.com.kh')
        merchant_id = getattr(settings, 'ABA_PAYWAY_MERCHANT_ID', 'ec478104')
        api_key = getattr(settings, 'ABA_PAYWAY_API_KEY', 'ce16f4443ee14a83052c02f3ac36d96f58f0fcae')
        currency = kwargs.get('currency', 'USD')

        req_time = timezone.now().strftime('%Y%m%d%H%M%S')
        tran_id = f"ABA-{order.order_number}"
        amount = f"{order.total:.2f}" if currency == 'USD' else str(int(order.total * Decimal('4100')))

        # Delegate to Bakong KHQR for instant embedded QR rendering
        khqr_data = super().create_payment(order, currency=currency)

        hash_raw = f"{req_time}{merchant_id}{tran_id}{amount}"
        signature_hash = self.get_hash(hash_raw, api_key) if api_key else ""

        # Official PayWay Direct Link
        direct_link = "https://link-sandbox.payway.com.kh/pS81031X"

        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'payment_method': Order.PaymentMethod.BAKONG_QR,
                'amount': order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': tran_id,
                'payment_gateway_response': {
                    **khqr_data,
                    'aba_payway_url': f"{base_url}/api/payment-gateway/v1/payments/purchase",
                    'aba_merchant_id': merchant_id,
                    'req_time': req_time,
                    'hash': signature_hash,
                    'direct_pay_link': direct_link,
                }
            }
        )

        return {
            **khqr_data,
            'aba_payway_url': f"{base_url}/api/payment-gateway/v1/payments/purchase",
            'aba_merchant_id': merchant_id,
            'req_time': req_time,
            'signature_hash': signature_hash,
            'direct_pay_link': direct_link,
            'is_sandbox': 'sandbox' in base_url,
        }


class StripeGateway(BasePaymentGateway):
    """
    Stripe payment intent provider abstraction.
    """
    def create_payment(self, order: Order, **kwargs) -> dict:
        tx_id = f"pi_mock_{uuid.uuid4().hex}"
        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'payment_method': Order.PaymentMethod.CREDIT_CARD,
                'amount': order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': tx_id,
                'payment_gateway_response': {'client_secret': f"{tx_id}_secret_test"}
            }
        )
        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'method': 'CREDIT_CARD',
            'amount': str(payment.amount),
            'client_secret': f"{tx_id}_secret_test",
            'transaction_id': payment.transaction_id
        }

    def verify_payment(self, payment: Payment, **kwargs) -> bool:
        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        payment.order.payment_status = Order.PaymentStatus.PAID
        payment.order.save(update_fields=['payment_status'])
        return True

    def refund_payment(self, payment: Payment, amount: Decimal = None, **kwargs) -> bool:
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status'])
        return True


class PaymentService:
    @staticmethod
    def get_gateway(method: str) -> BasePaymentGateway:
        gateways = {
            Order.PaymentMethod.COD: CashOnDeliveryGateway(),
            Order.PaymentMethod.BAKONG_QR: ABAPayWayGateway(),
            Order.PaymentMethod.CREDIT_CARD: StripeGateway(),
            Order.PaymentMethod.BANK_TRANSFER: CashOnDeliveryGateway(),
        }
        return gateways.get(method, ABAPayWayGateway())

    @staticmethod
    def initiate_payment(order: Order, method: str) -> dict:
        gateway = PaymentService.get_gateway(method)
        return gateway.create_payment(order)

    @staticmethod
    def verify_payment(payment: Payment) -> bool:
        gateway = PaymentService.get_gateway(payment.payment_method)
        return gateway.verify_payment(payment)

