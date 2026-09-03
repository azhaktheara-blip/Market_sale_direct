from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Order
from .serializers import (
    OrderSerializer,
    CheckoutSerializer,
    UpdateOrderStatusSerializer,
    CancelOrderSerializer
)
from .services import OrderService
from apps.core.permissions import IsFarmer, IsAdminUserOnly


@extend_schema(tags=['Orders & Checkout'])
class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        address_id = serializer.validated_data['address_id']
        payment_method = serializer.validated_data.get('payment_method', Order.PaymentMethod.COD)
        customer_notes = serializer.validated_data.get('customer_notes', '')
        idempotency_key = request.headers.get('Idempotency-Key') or serializer.validated_data.get('idempotency_key')

        orders = OrderService.checkout(
            user=request.user,
            address_id=address_id,
            payment_method=payment_method,
            customer_notes=customer_notes,
            idempotency_key=idempotency_key
        )

        order_serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'message': f'Successfully placed {len(orders)} order(s).',
            'orders': order_serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Orders & Checkout'])
class CustomerOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)\
            .select_related('farmer', 'delivery')\
            .prefetch_related('items__product', 'items__review')


@extend_schema(tags=['Orders & Checkout'])
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'ADMIN':
            return Order.objects.all()
        if user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
            return Order.objects.filter(farmer=user.farmer_profile)
        return Order.objects.filter(customer=user)


@extend_schema(tags=['Orders & Checkout'])
class CustomerCancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(pk=pk, customer=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        updated_order = OrderService.cancel_order_by_customer(
            order=order,
            user=request.user,
            reason=serializer.validated_data.get('reason', '')
        )
        return Response({
            'status': 'success',
            'message': 'Order successfully cancelled.',
            'order': OrderSerializer(updated_order, context={'request': request}).data
        })


@extend_schema(tags=['Farmer Portal'])
class FarmerOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.filter(farmer=self.request.user.farmer_profile)\
            .select_related('customer', 'delivery')\
            .prefetch_related('items__product')


@extend_schema(tags=['Farmer Portal'])
class FarmerUpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def patch(self, request, pk):
        serializer = UpdateOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(pk=pk, farmer=request.user.farmer_profile)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = serializer.validated_data['status']
        if serializer.validated_data.get('cancellation_reason'):
            order.cancellation_reason = serializer.validated_data['cancellation_reason']

        # If shipping info provided, update delivery
        if hasattr(order, 'delivery'):
            delivery = order.delivery
            if serializer.validated_data.get('driver_name'):
                delivery.driver_name = serializer.validated_data['driver_name']
            if serializer.validated_data.get('driver_phone'):
                delivery.driver_phone = serializer.validated_data['driver_phone']
            if serializer.validated_data.get('tracking_number'):
                delivery.tracking_number = serializer.validated_data['tracking_number']
            delivery.save()

        updated_order = OrderService.update_order_status(order, new_status, request.user)
        return Response({
            'status': 'success',
            'message': f'Order status updated to {new_status}.',
            'order': OrderSerializer(updated_order, context={'request': request}).data
        })


@extend_schema(tags=['Admin Portal'])
class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all().select_related('customer', 'farmer', 'delivery').prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'farmer__province']
    ordering_fields = ['created_at', 'total']


from django.http import HttpResponse
from .models import Subscription, SubscriptionItem
from .serializers import SubscriptionSerializer, CreateSubscriptionSerializer
from .pdf_services import OrderPDFService
from datetime import timedelta
from django.utils import timezone


@extend_schema(tags=['Orders & Checkout'])
class OrderInvoicePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.select_related('farmer', 'customer', 'delivery').prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'status': 'error', 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or request.user == order.customer or (hasattr(request.user, 'farmer_profile') and request.user.farmer_profile == order.farmer)):
            return Response({'detail': 'You do not have permission to view this invoice.'}, status=status.HTTP_403_FORBIDDEN)

        pdf_buffer = OrderPDFService.generate_invoice_pdf(order)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Invoice_{order.order_number}.pdf"'
        return response


@extend_schema(tags=['Orders & Checkout'])
class OrderPackingSlipPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.select_related('farmer', 'customer', 'delivery').prefetch_related('items').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'status': 'error', 'message': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or request.user == order.customer or (hasattr(request.user, 'farmer_profile') and request.user.farmer_profile == order.farmer)):
            return Response({'detail': 'You do not have permission to view this packing slip.'}, status=status.HTTP_403_FORBIDDEN)

        pdf_buffer = OrderPDFService.generate_packing_slip_pdf(order)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="PackingSlip_{order.order_number}.pdf"'
        return response


@extend_schema(tags=['Subscriptions'])
class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
            return Subscription.objects.filter(farmer=user.farmer_profile).select_related('farmer', 'customer').prefetch_related('items__product')
        return Subscription.objects.filter(customer=user).select_related('farmer', 'customer').prefetch_related('items__product')

    def create(self, request, *args, **kwargs):
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.farmers.models import FarmerProfile
        from apps.accounts.models import Address
        from apps.products.models import Product

        farmer = FarmerProfile.objects.get(id=data['farmer_id'])
        addr_id = data.get('address_id')
        address = None
        if addr_id:
            address = Address.objects.filter(id=addr_id, user=request.user).first()
        if not address:
            address = Address.objects.filter(user=request.user, is_default=True).first() or Address.objects.filter(user=request.user).first()
        next_date = timezone.now().date() + timedelta(days=7)

        sub = Subscription.objects.create(
            customer=request.user,
            farmer=farmer,
            frequency=data['frequency'],
            delivery_day=data['delivery_day'],
            delivery_address=address,
            payment_method=data['payment_method'],
            next_delivery_date=next_date,
            customer_notes=data.get('customer_notes', '')
        )

        for it in data['items']:
            prod = Product.objects.get(id=it['product_id'])
            SubscriptionItem.objects.create(
                subscription=sub,
                product=prod,
                quantity=it['quantity']
            )

        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_201_CREATED)

