from rest_framework import serializers
from .models import Favorite
from apps.products.serializers import ProductListSerializer
from apps.farmers.serializers import FarmerPublicListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    farmer = FarmerPublicListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'farmer', 'created_at']


class ToggleFavoriteSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(required=False, allow_null=True)
    farmer_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        if not attrs.get('product_id') and not attrs.get('farmer_id'):
            raise serializers.ValidationError("Either product_id or farmer_id must be provided.")
        if attrs.get('product_id') and attrs.get('farmer_id'):
            raise serializers.ValidationError("Provide only one of product_id or farmer_id.")
        return attrs

