import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from .models import Payment, PaymentTransaction, ProcessedWebhook
from .services import PaymentService
from apps.orders.models import Order
from apps.core.throttling import PaymentRateThrottle

logger = logging.getLogger(__name__)


@extend_schema(tags=['Payments'])
class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request, order_id):
        try:
            order = Order.objects.select_related('farmer').get(id=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        method = request.data.get('payment_method', order.payment_method)
        currency = request.data.get('currency', 'USD')
        result = PaymentService.get_gateway(method).create_payment(order, currency=currency)
        return Response(result)


@extend_schema(tags=['Payments'])
class VerifyPaymentView(APIView):
    """
    Reconciles payment status against the payment gateway (ABA PayWay / Bakong).
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, customer=request.user)
            payment = order.payment
        except (Order.DoesNotExist, Payment.DoesNotExist):
            return Response({'detail': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        success = PaymentService.verify_payment(payment)
        return Response({
            'status': 'success' if success else 'pending',
            'payment_status': payment.status,
            'order_status': order.status
        })


@extend_schema(tags=['Payments'])
class ABAPayWayWebhookView(APIView):
    """
    Webhook receiver for ABA PayWay pushback notifications.
    Reconciles transaction with Check Transaction API before marking completed.
    Guarantees idempotency via ProcessedWebhook records.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request):
        tran_id = request.data.get('tran_id') or request.POST.get('tran_id')
        logger.info("Received ABA PayWay webhook notification for tran_id=%s", tran_id)
        if not tran_id:
            return Response({'detail': 'Missing tran_id parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency check
        if ProcessedWebhook.objects.filter(provider='ABA_PAYWAY', event_id=tran_id).exists():
            logger.info("Webhook event for tran_id=%s has already been processed.", tran_id)
            return Response({'status': 'already_processed', 'message': 'Duplicate event ignored.'})

        try:
            payment = Payment.objects.select_related('order').get(transaction_id=tran_id)
        except Payment.DoesNotExist:
            logger.warning("Payment with transaction_id=%s not found in system.", tran_id)
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            success = PaymentService.verify_payment(payment)
            if success:
                ProcessedWebhook.objects.get_or_create(
                    provider='ABA_PAYWAY',
                    event_id=tran_id,
                    defaults={'payload_hash': str(hash(tran_id))}
                )

        return Response({
            'status': 'success' if success else 'unverified',
            'payment_status': payment.status
        })


@extend_schema(tags=['Payments'])
class SimulatePaymentSuccessView(APIView):
    """
    Development-only endpoint to simulate mobile bank webhook confirmation.
    Disabled in production (DEBUG=False).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        if not getattr(settings, 'DEBUG', False):
            return Response(
                {'detail': 'Simulated payments are strictly disabled in production.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            order = Order.objects.get(id=order_id, customer=request.user)
            payment, _ = Payment.objects.get_or_create(
                order=order,
                defaults={
                    'payment_method': order.payment_method,
                    'amount': order.total,
                    'status': Payment.Status.PENDING,
                    'transaction_id': f"SIM-{order.order_number}"
                }
            )
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment.status = Payment.Status.COMPLETED
        payment.paid_at = timezone.now()
        payment.save(update_fields=['status', 'paid_at'])
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=['payment_status'])
        PaymentService.record_transaction(payment, tx_status=PaymentTransaction.Status.SUCCESS)

        return Response({
            'status': 'success',
            'message': 'Payment simulated successfully as COMPLETED.',
            'payment_status': payment.status,
            'order_status': order.status
        })


from rest_framework.generics import ListAPIView
from .serializers import PaymentTransactionSerializer

@extend_schema(tags=['Payments'])
class TransactionListView(ListAPIView):
    """
    List transactions for the authenticated user:
    - Farmers see incoming sales, marketplace commission deductions, and net payouts.
    - Customers see their payment receipts.
    - Admins see all platform payment transactions.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentTransactionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return PaymentTransaction.objects.select_related('order', 'customer', 'farmer').all()
        elif user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
            return PaymentTransaction.objects.select_related('order', 'customer', 'farmer').filter(farmer=user.farmer_profile)
        else:
            return PaymentTransaction.objects.select_related('order', 'customer', 'farmer').filter(customer=user)

