from rest_framework import serializers
from .models import FarmerProfile, FarmerVerification


class FarmerSummarySerializer(serializers.ModelSerializer):
    account_id = serializers.CharField(read_only=True)

    class Meta:
        model = FarmerProfile
        fields = ['id', 'account_id', 'farm_name', 'slug', 'province', 'is_verified', 'verification_status', 'profile_image', 'rating_avg']



class FarmerPublicListSerializer(serializers.ModelSerializer):
    account_id = serializers.CharField(read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = FarmerProfile
        fields = [
            'id', 'account_id', 'farm_name', 'slug', 'bio', 'farming_practice',
            'years_of_experience', 'profile_image', 'cover_image',
            'province', 'district', 'commune', 'address_line',
            'is_verified', 'verification_status',
            'rating_avg', 'rating_count', 'product_count',
            'created_at'
        ]

    def get_product_count(self, obj):
        return obj.products.filter(status='ACTIVE').count()


class FarmerPublicDetailSerializer(serializers.ModelSerializer):
    account_id = serializers.CharField(read_only=True)
    product_count = serializers.SerializerMethodField()
    products = serializers.SerializerMethodField()

    class Meta:
        model = FarmerProfile
        fields = [
            'id', 'account_id', 'farm_name', 'slug', 'bio', 'story', 'farming_practice',
            'years_of_experience', 'profile_image', 'cover_image',
            'province', 'district', 'commune', 'address_line',
            'latitude', 'longitude', 'phone_number', 'website_url',
            'is_verified', 'verification_status',
            'rating_avg', 'rating_count', 'product_count', 'products',
            'created_at'
        ]

    def get_product_count(self, obj):
        return obj.products.filter(status='ACTIVE').count()

    def get_products(self, obj):
        from apps.products.serializers import ProductListSerializer
        products = obj.products.filter(status='ACTIVE')[:12]
        return ProductListSerializer(products, many=True, context=self.context).data


class FarmerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = [
            'farm_name', 'bio', 'story', 'farming_practice',
            'years_of_experience', 'profile_image', 'cover_image',
            'province', 'district', 'commune', 'address_line',
            'latitude', 'longitude', 'phone_number', 'website_url',
            'bank_name', 'bank_account_name', 'bank_account_number',
            'bakong_account_id', 'farmer_qr_image'
        ]


class FarmerVerificationSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.farm_name', read_only=True)
    farmer_slug = serializers.CharField(source='farmer.slug', read_only=True)

    class Meta:
        model = FarmerVerification
        fields = [
            'id', 'farmer', 'farmer_name', 'farmer_slug',
            'id_card_image', 'land_certificate_image', 'organic_certification_doc',
            'admin_notes', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'farmer', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']
