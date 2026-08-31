from rest_framework import serializers
from .models import Order, OrderItem, Delivery
from apps.farmers.serializers import FarmerSummarySerializer
from apps.payments.models import Payment


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = [
            'id', 'delivery_type', 'tracking_number', 'driver_name',
            'driver_phone', 'estimated_delivery', 'actual_delivery', 'delivery_notes'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name_snapshot', 'product_image_snapshot',
            'unit_snapshot', 'unit_price_snapshot', 'quantity', 'subtotal',
            'has_reviewed'
        ]

    def get_has_reviewed(self, obj):
        return hasattr(obj, 'review')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    delivery = DeliverySerializer(read_only=True)
    farmer = FarmerSummarySerializer(read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_email', 'customer_name',
            'farmer', 'status', 'subtotal', 'delivery_fee', 'commission_rate_percentage',
            'marketplace_commission', 'farmer_payout', 'total',
            'delivery_address_snapshot', 'customer_notes', 'cancellation_reason',
            'payment_status', 'payment_method', 'delivery', 'items',
            'created_at', 'updated_at'
        ]


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.COD)
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    idempotency_key = serializers.CharField(required=False, allow_blank=True, max_length=64)


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    driver_name = serializers.CharField(required=False, allow_blank=True)
    driver_phone = serializers.CharField(required=False, allow_blank=True)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    cancellation_reason = serializers.CharField(required=False, allow_blank=True)


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


from .models import Subscription, SubscriptionItem
from apps.products.serializers import ProductListSerializer


class SubscriptionItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']


class SubscriptionSerializer(serializers.ModelSerializer):
    items = SubscriptionItemSerializer(many=True, read_only=True)
    farmer = FarmerSummarySerializer(read_only=True)
    estimated_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'farmer', 'frequency', 'delivery_day',
            'status', 'delivery_address', 'payment_method',
            'next_delivery_date', 'customer_notes', 'items',
            'estimated_total', 'created_at'
        ]


class CreateSubscriptionItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, default=1.00)


class CreateSubscriptionSerializer(serializers.Serializer):
    farmer_id = serializers.UUIDField()
    frequency = serializers.ChoiceField(choices=Subscription.Frequency.choices, default=Subscription.Frequency.WEEKLY)
    delivery_day = serializers.CharField(default='Tuesday')
    address_id = serializers.UUIDField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.COD)
    items = CreateSubscriptionItemInputSerializer(many=True)
    customer_notes = serializers.CharField(required=False, allow_blank=True)

