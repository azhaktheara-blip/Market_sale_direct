from rest_framework import serializers
from .models import Review
from apps.orders.models import OrderItem


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    farm_name = serializers.CharField(source='farmer.farm_name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'farmer', 'farm_name',
            'customer', 'customer_name', 'customer_avatar',
            'order_item', 'rating', 'title', 'comment', 'image',
            'is_approved', 'created_at'
        ]
        read_only_fields = ['id', 'product', 'farmer', 'customer', 'is_approved', 'created_at']

    def get_customer_avatar(self, obj):
        if obj.customer.avatar:
            return obj.customer.avatar.url
        return None


class CreateReviewSerializer(serializers.Serializer):
    order_item_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=150)
    comment = serializers.CharField()
    image = serializers.ImageField(required=False, allow_null=True)

    def validate_order_item_id(self, value):
        user = self.context['request'].user
        try:
            order_item = OrderItem.objects.select_related('order__customer', 'product').get(id=value)
        except OrderItem.DoesNotExist:
            raise serializers.ValidationError("Purchased order item not found.")

        if order_item.order.customer != user:
            raise serializers.ValidationError("You can only review products from your own orders.")

        if order_item.order.status != 'DELIVERED':
            raise serializers.ValidationError("You can only submit a review after the order has been delivered.")

        if hasattr(order_item, 'review'):
            raise serializers.ValidationError("You have already submitted a review for this purchase.")

        if not order_item.product:
            raise serializers.ValidationError("The associated product is no longer available.")

        return value

