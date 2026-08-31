from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from .models import Payment
from .services import PaymentService
from apps.orders.models import Order


@extend_schema(tags=['Payments'])
class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, customer=request.user)
            payment = order.payment
        except (Order.DoesNotExist, Payment.DoesNotExist):
            return Response({'detail': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        success = PaymentService.verify_payment(payment)
        return Response({
            'status': 'success' if success else 'failed',
            'payment_status': payment.status,
            'order_status': order.status
        })


@extend_schema(tags=['Payments'])
class SimulatePaymentSuccessView(APIView):
    """Development & Demo endpoint to simulate mobile bank webhook confirmation."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
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
        payment.save(update_fields=['status'])
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=['payment_status'])

        return Response({
            'status': 'success',
            'message': 'Payment simulated successfully as COMPLETED.',
            'payment_status': payment.status,
            'order_status': order.status
        })
