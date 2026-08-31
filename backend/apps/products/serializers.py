from rest_framework import serializers
from django.db import transaction
from .models import Category, Product, ProductImage, Inventory, VolumeDiscountTier
from .services import ProductImageService
from apps.farmers.serializers import FarmerSummarySerializer


class VolumeDiscountTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolumeDiscountTier
        fields = ['id', 'min_quantity', 'discount_percentage', 'unit_price']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'is_active', 'display_order', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(status='ACTIVE').count()


class ProductImageSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.ReadOnlyField()
    medium_url = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'thumbnail', 'medium', 'image_url',
            'thumbnail_url', 'medium_url', 'blur_placeholder',
            'is_primary', 'alt_text', 'display_order', 'width', 'height'
        ]

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['available_quantity', 'reserved_quantity', 'low_stock_threshold', 'last_restocked_at']


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    thumbnail_url = serializers.ReadOnlyField()
    medium_image_url = serializers.ReadOnlyField()
    blur_placeholder = serializers.ReadOnlyField()
    farmer = FarmerSummarySerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    available_stock = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    volume_tiers = VolumeDiscountTierSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'price', 'unit',
            'minimum_order_qty', 'harvest_date', 'is_preorder', 'expected_harvest_date',
            'peak_season_months', 'is_organic', 'is_featured',
            'status', 'rating_avg', 'rating_count', 'primary_image',
            'thumbnail_url', 'medium_image_url', 'blur_placeholder',
            'available_stock', 'volume_tiers', 'category', 'category_name', 'farmer',
            'created_at'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary and primary.image:
            return primary.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    farmer = FarmerSummarySerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    inventory = InventorySerializer(read_only=True)
    volume_tiers = VolumeDiscountTierSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    thumbnail_url = serializers.ReadOnlyField()
    medium_image_url = serializers.ReadOnlyField()
    blur_placeholder = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'description',
            'price', 'unit', 'minimum_order_qty', 'harvest_date',
            'is_preorder', 'expected_harvest_date', 'peak_season_months',
            'is_organic', 'is_featured', 'status', 'rating_avg',
            'rating_count', 'primary_image', 'thumbnail_url', 'medium_image_url',
            'blur_placeholder', 'images', 'volume_tiers', 'category',
            'farmer', 'inventory', 'created_at', 'updated_at'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary and primary.image:
            return primary.image.url
        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    initial_stock = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        write_only=True,
        default=0.00
    )
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'name', 'short_description', 'description',
            'price', 'unit', 'minimum_order_qty', 'harvest_date',
            'is_organic', 'is_featured', 'status',
            'initial_stock', 'uploaded_images'
        ]

    def validate(self, attrs):
        status_val = attrs.get('status')
        uploaded_imgs = attrs.get('uploaded_images', [])

        # Validate mandatory image rule for active products
        if status_val == Product.Status.ACTIVE:
            if self.instance:
                has_existing = self.instance.images.exists()
                if not has_existing and not uploaded_imgs:
                    raise serializers.ValidationError({
                        'status': 'At least one produce image is required to publish as Active. You can save as Draft in the meantime.'
                    })
            elif not uploaded_imgs:
                raise serializers.ValidationError({
                    'status': 'At least one produce photo is required before publishing as Active. Upload a photo or set status to Draft.'
                })
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        initial_stock = validated_data.pop('initial_stock', 0.00)
        uploaded_images = validated_data.pop('uploaded_images', [])
        farmer = self.context['request'].user.farmer_profile

        product = Product.objects.create(farmer=farmer, **validated_data)
        
        # Create inventory
        Inventory.objects.create(
            product=product,
            available_quantity=initial_stock,
            low_stock_threshold=5.00
        )

        # Process and compress images via Pillow pipeline
        for index, img_file in enumerate(uploaded_images):
            ProductImageService.process_and_create_image(
                product=product,
                uploaded_file=img_file,
                is_primary=(index == 0),
                alt_text=f"{product.name} fresh harvest"
            )

        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        initial_stock = validated_data.pop('initial_stock', None)
        uploaded_images = validated_data.pop('uploaded_images', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if initial_stock is not None and hasattr(instance, 'inventory'):
            instance.inventory.available_quantity = initial_stock
            instance.inventory.save(update_fields=['available_quantity', 'last_restocked_at'])

        if uploaded_images:
            for index, img_file in enumerate(uploaded_images):
                ProductImageService.process_and_create_image(
                    product=instance,
                    uploaded_file=img_file,
                    is_primary=not instance.images.exists() and index == 0,
                    alt_text=f"{instance.name} fresh harvest"
                )

        return instance


class ProductImageUploadResponseSerializer(serializers.Serializer):
    image = ProductImageSerializer()
    quality = serializers.DictField()


class InventoryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['available_quantity', 'low_stock_threshold']
