from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    effective_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_discounted = serializers.BooleanField(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'effective_unit_price', 'is_discounted', 'subtotal', 'created_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    farmer_groups = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'delivery_fee', 'total', 'farmer_groups']

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_subtotal(self, obj):
        sub = sum(item.subtotal for item in obj.items.all())
        return round(sub, 2)

    def get_delivery_fee(self, obj):
        # Delivery fee: $2 per unique farmer in cart
        farmer_ids = set(item.product.farmer_id for item in obj.items.all())
        return round(Decimal('2.00') * len(farmer_ids), 2)

    def get_total(self, obj):
        return round(self.get_subtotal(obj) + self.get_delivery_fee(obj), 2)

    def get_farmer_groups(self, obj):
        groups = {}
        for item in obj.items.all():
            farmer = item.product.farmer
            if farmer.id not in groups:
                groups[farmer.id] = {
                    'farmer_id': str(farmer.id),
                    'farm_name': farmer.farm_name,
                    'farmer_slug': farmer.slug,
                    'province': farmer.province,
                    'is_verified': farmer.is_verified,
                    'items': [],
                    'subtotal': Decimal('0.00'),
                    'delivery_fee': Decimal('2.00'),
                }
            item_subtotal = item.product.price * item.quantity
            groups[farmer.id]['subtotal'] += item_subtotal
            groups[farmer.id]['items'].append(CartItemSerializer(item, context=self.context).data)

        # Convert to list and calculate farm totals
        result = []
        for g in groups.values():
            g['subtotal'] = round(g['subtotal'], 2)
            g['total'] = round(g['subtotal'] + g['delivery_fee'], 2)
            result.append(g)
        return result


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), default=Decimal('1.00'))


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'))

