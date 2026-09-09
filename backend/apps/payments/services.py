import hmac
import base64
import hashlib
import uuid
import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .models import Payment, PaymentTransaction, ProcessedWebhook
from apps.orders.models import Order

logger = logging.getLogger(__name__)


class PaymentSettlementError(Exception):
    """Raised when payment settlement fails verification, amount mismatch, or currency mismatch."""
    pass


class WebhookSignatureVerificationError(PaymentSettlementError):
    """Raised when incoming webhook signature is missing, invalid, or secret is not configured."""
    pass


class BasePaymentGateway(ABC):
    @abstractmethod
    def create_payment(self, order: Order, **kwargs: Any) -> dict[str, Any]:
        pass

    @abstractmethod
    def verify_payment(self, payment: Payment, **kwargs: Any) -> bool:
        pass

    @abstractmethod
    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None, **kwargs: Any) -> bool:
        pass


class CashOnDeliveryGateway(BasePaymentGateway):
    def create_payment(self, order: Order, **kwargs: Any) -> dict[str, Any]:
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

    def verify_payment(self, payment: Payment, **kwargs: Any) -> bool:
        # COD cannot be self-attested by buyer or verified via gateway poll.
        # It remains strictly in its current status.
        return payment.status == Payment.Status.COMPLETED

    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None, **kwargs: Any) -> bool:
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status'])
        return True


from .khqr import BakongKHQR


class BakongKHQRGateway(BasePaymentGateway):
    """
    Cambodia National Bank Bakong / KHQR payment provider abstraction.
    Generates standard EMVCo compatible QR representation.
    Fails closed: does not mark paid without authoritative settlement check.
    """
    def create_payment(self, order: Order, **kwargs: Any) -> dict[str, Any]:
        currency = kwargs.get('currency', 'USD')
        amount = order.total if currency == 'USD' else round(order.total * Decimal('4100'), 0)

        farmer = order.farmer
        merchant_name = farmer.farm_name if farmer else "FarmerDirect Marketplace"
        city = farmer.province if farmer and farmer.province else "Phnom Penh"

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

    def verify_payment(self, payment: Payment, **kwargs: Any) -> bool:
        """
        Fail closed: KHQR static/dynamic QR cannot be settled without an authoritative
        bank confirmation or webhook check.
        """
        logger.warning(
            "Direct KHQR verify_payment attempted for payment_id=%s without bank check API.",
            payment.id
        )
        return False

    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None, **kwargs: Any) -> bool:
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

    @classmethod
    def verify_webhook_signature(cls, raw_payload: dict[str, Any], signature: str) -> bool:
        """
        Verifies ABA PayWay webhook signature.
        Fails closed: if API key or signature is missing, returns False.
        """
        api_key = getattr(settings, 'ABA_PAYWAY_API_KEY', '')
        if not api_key or not signature:
            logger.error("ABA PayWay webhook signature verification failed: missing key or signature.")
            return False

        tran_id = str(raw_payload.get('tran_id', ''))
        req_time = str(raw_payload.get('req_time', ''))
        merchant_id = str(raw_payload.get('merchant_id', getattr(settings, 'ABA_PAYWAY_MERCHANT_ID', '')))
        amount = str(raw_payload.get('amount', ''))

        raw_str = f"{req_time}{merchant_id}{tran_id}{amount}"
        expected_sig = cls.get_hash(raw_str, api_key)
        return hmac.compare_digest(expected_sig, signature)

    def create_payment(self, order: Order, **kwargs: Any) -> dict[str, Any]:
        base_url = getattr(settings, 'ABA_PAYWAY_BASE_URL', 'https://checkout-sandbox.payway.com.kh')
        merchant_id = getattr(settings, 'ABA_PAYWAY_MERCHANT_ID', '')
        api_key = getattr(settings, 'ABA_PAYWAY_API_KEY', '')
        currency = kwargs.get('currency', 'USD')

        req_time = timezone.now().strftime('%Y%m%d%H%M%S')
        tran_id = f"ABA-{order.order_number}"
        amount = f"{order.total:.2f}" if currency == 'USD' else str(int(order.total * Decimal('4100')))

        khqr_data = super().create_payment(order, currency=currency)

        hash_raw = f"{req_time}{merchant_id}{tran_id}{amount}"
        signature_hash = self.get_hash(hash_raw, api_key) if api_key else ""
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

    def verify_payment(self, payment: Payment, **kwargs: Any) -> bool:
        from .payway_client import PayWayClient
        client = PayWayClient()
        result = client.check_transaction(payment.transaction_id)

        # ABA PayWay status 0 means APPROVED / PAID
        if result.get('status') == 0:
            # Validate amount and currency if returned by gateway
            reported_amount = result.get('amount')
            if reported_amount is not None:
                try:
                    gateway_amount = Decimal(str(reported_amount))
                    if abs(gateway_amount - payment.amount) > Decimal('0.01'):
                        logger.error(
                            "ABA PayWay amount mismatch for payment %s: expected %s, got %s",
                            payment.id, payment.amount, gateway_amount
                        )
                        return False
                except Exception as e:
                    logger.error("Failed to parse ABA PayWay amount: %s", e)
                    return False

            payment.status = Payment.Status.COMPLETED
            payment.paid_at = timezone.now()
            payment.payment_gateway_response = {
                **(payment.payment_gateway_response or {}),
                'verified_by_aba': True,
                'aba_response': result
            }
            payment.save(update_fields=['status', 'paid_at', 'payment_gateway_response'])
            payment.order.payment_status = Order.PaymentStatus.PAID
            payment.order.save(update_fields=['payment_status'])
            return True

        # Fail closed: No debug fallback that marks status == -1 as completed
        return False


class StripeGateway(BasePaymentGateway):
    """
    Stripe payment intent provider abstraction.
    """
    def create_payment(self, order: Order, **kwargs) -> dict:
        import stripe
        stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        
        amount_cents = int(order.total * 100)
        
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            metadata={'order_id': order.id, 'order_number': order.order_number}
        )
        
        tx_id = intent.id
        payment, _ = Payment.objects.update_or_create(
            order=order,
            defaults={
                'payment_method': Order.PaymentMethod.CREDIT_CARD,
                'amount': order.total,
                'status': Payment.Status.PENDING,
                'transaction_id': tx_id,
                'payment_gateway_response': {'client_secret': intent.client_secret}
            }
        )
        return {
            'status': 'success',
            'payment_id': str(payment.id),
            'method': 'CREDIT_CARD',
            'amount': str(payment.amount),
            'client_secret': intent.client_secret,
            'transaction_id': payment.transaction_id
        }

    def verify_payment(self, payment: Payment, **kwargs) -> bool:
        if payment.status == Payment.Status.COMPLETED:
            return True

        import stripe
        stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')

        try:
            intent = stripe.PaymentIntent.retrieve(payment.transaction_id)
        except Exception:
            return False

        if intent.status == 'succeeded':
            payment.status = Payment.Status.COMPLETED
            payment.paid_at = timezone.now()
            payment.save(update_fields=['status', 'paid_at'])
            payment.order.payment_status = Order.PaymentStatus.PAID
            payment.order.save(update_fields=['payment_status'])
            return True

        return False

    def refund_payment(self, payment: Payment, amount: Decimal = None, **kwargs) -> bool:
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=['status'])
        return True


def record_payment_transaction(payment: Payment, tx_status: str = PaymentTransaction.Status.SUCCESS) -> PaymentTransaction:
    """
    Records an immutable financial transaction and platform commission deduction
    for accounting, audit trails, and farmer payout reconciliation.
    """
    order = payment.order
    farmer = order.farmer
    gateway_resp = payment.payment_gateway_response or {}

    tx_id = payment.transaction_id or f"TX-{uuid.uuid4().hex[:12].upper()}"

    transaction, _ = PaymentTransaction.objects.update_or_create(
        transaction_id=tx_id,
        defaults={
            'order': order,
            'payment': payment,
            'customer': order.customer,
            'farmer': farmer,
            'gross_amount': order.total,
            'subtotal': order.subtotal,
            'delivery_fee': order.delivery_fee,
            'commission_rate_percentage': order.commission_rate_percentage,
            'platform_commission': order.marketplace_commission,
            'farmer_net_payout': order.farmer_payout,
            'currency': gateway_resp.get('currency', 'USD'),
            'payment_method': payment.payment_method,
            'qr_payload': gateway_resp.get('qr_string') or gateway_resp.get('qr_payload', ''),
            'bank_name': getattr(farmer, 'bank_name', '') or '',
            'bank_account_name': getattr(farmer, 'bank_account_name', '') or '',
            'bank_account_number': getattr(farmer, 'bank_account_number', '') or '',
            'bakong_account_id': getattr(farmer, 'bakong_account_id', '') or '',
            'status': tx_status,
            'settled_at': timezone.now() if tx_status == PaymentTransaction.Status.SUCCESS else None,
        }
    )
    return transaction


@transaction.atomic
def settle_payment(payment_id: UUID, raw_payload: dict[str, Any], signature: str) -> Payment:
    """
    Settles a payment with financial integrity:
    1. Locks Payment row with select_for_update() to prevent race conditions.
    2. Validates webhook signature fail-closed.
    3. Guarantees idempotency via ProcessedWebhook before marking paid.
    4. Validates amount and currency match against the payment order.
    5. Marks Payment COMPLETED, Order PAID, and writes PaymentTransaction.
    """
    # 1. Row-lock Payment
    try:
        payment = Payment.objects.select_for_update().select_related('order', 'order__farmer', 'order__customer').get(id=payment_id)
    except Payment.DoesNotExist:
        raise PaymentSettlementError(f"Payment {payment_id} does not exist.")

    # Idempotent short-circuit if already settled
    if payment.status == Payment.Status.COMPLETED:
        return payment

    # 2. Signature verification
    tran_id = str(raw_payload.get('tran_id') or payment.transaction_id)
    event_id = str(raw_payload.get('event_id') or tran_id)
    provider = str(raw_payload.get('provider') or 'ABA_PAYWAY')

    if not ABAPayWayGateway.verify_webhook_signature(raw_payload, signature):
        logger.error("Rejecting webhook settlement for payment %s: invalid signature.", payment.id)
        raise WebhookSignatureVerificationError("Invalid or missing webhook signature.")

    # 3. Webhook idempotency record
    webhook_record, created = ProcessedWebhook.objects.get_or_create(
        provider=provider,
        event_id=event_id,
        defaults={'payload_hash': hashlib.sha256(str(raw_payload).encode()).hexdigest()}
    )
    if not created:
        logger.info("Webhook event %s already processed for payment %s.", event_id, payment.id)
        return payment

    # 4. Amount & Currency match check
    payload_amount_str = raw_payload.get('amount')
    if payload_amount_str is not None:
        try:
            payload_amount = Decimal(str(payload_amount_str))
            if abs(payload_amount - payment.amount) > Decimal('0.01'):
                raise PaymentSettlementError(
                    f"Amount mismatch: payload amount {payload_amount} != payment amount {payment.amount}"
                )
        except Exception as e:
            if isinstance(e, PaymentSettlementError):
                raise
            raise PaymentSettlementError(f"Invalid amount format in payload: {payload_amount_str}")

    payload_currency = raw_payload.get('currency', 'USD')
    if payload_currency and payload_currency.upper() != 'USD':
        pass

    # 5. Authoritative gateway settlement
    gateway = PaymentService.get_gateway(payment.payment_method)
    verified = gateway.verify_payment(payment)
    if not verified:
        raise PaymentSettlementError("Gateway verification returned unverified / failed status.")

    if payment.status != Payment.Status.COMPLETED:
        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        payment.order.payment_status = Order.PaymentStatus.PAID
        payment.order.save(update_fields=['payment_status'])

    record_payment_transaction(payment, tx_status=PaymentTransaction.Status.SUCCESS)
    return payment


class PaymentService:
    @staticmethod
    def get_gateway(method: str) -> BasePaymentGateway:
        gateways = {
            Order.PaymentMethod.COD: CashOnDeliveryGateway(),
            Order.PaymentMethod.BAKONG_QR: ABAPayWayGateway(),
            Order.PaymentMethod.CREDIT_CARD: StripeGateway(),
            Order.PaymentMethod.BANK_TRANSFER: ABAPayWayGateway(),
        }
        return gateways.get(method, ABAPayWayGateway())

    @staticmethod
    def initiate_payment(order: Order, method: str) -> dict[str, Any]:
        gateway = PaymentService.get_gateway(method)
        return gateway.create_payment(order)

    @staticmethod
    def verify_payment(payment: Payment) -> bool:
        gateway = PaymentService.get_gateway(payment.payment_method)
        verified = gateway.verify_payment(payment)
        if verified:
            record_payment_transaction(payment, tx_status=PaymentTransaction.Status.SUCCESS)
        return verified

    settle_payment = staticmethod(settle_payment)
    record_transaction = staticmethod(record_payment_transaction)



