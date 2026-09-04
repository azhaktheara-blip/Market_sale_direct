from decimal import Decimal
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from apps.core.models import TimeStampedModel
from apps.farmers.models import FarmerProfile
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from django.db import connection


class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon identifier, e.g. Carrot, Apple, Wheat")
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    class Unit(models.TextChoices):
        KG = 'KG', 'Kilogram (kg)'
        GRAM = 'GRAM', 'Gram (g)'
        TON = 'TON', 'Metric Ton'
        BASKET = 'BASKET', 'Basket'
        BOX = 'BOX', 'Box / Crate'
        BUNCH = 'BUNCH', 'Bunch'
        PIECE = 'PIECE', 'Piece / Unit'
        LITER = 'LITER', 'Liter'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active / In Stock'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Out of Stock'
        SUSPENDED = 'SUSPENDED', 'Suspended by Admin'

    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name='products',
        db_index=True
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        db_index=True
    )
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=250, unique=True, db_index=True)
    short_description = models.CharField(max_length=300, help_text="Short highlight for cards.")
    description = models.TextField(help_text="Detailed nutritional info, harvest methods, culinary tips.")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        db_index=True
    )
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.KG)
    minimum_order_qty = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01)]
    )
    harvest_date = models.DateField(db_index=True)
    is_preorder = models.BooleanField(default=False, db_index=True, help_text="True if item is pre-harvest advance order")
    expected_harvest_date = models.DateField(blank=True, null=True, help_text="Expected harvest date for pre-orders")
    peak_season_months = models.JSONField(default=list, blank=True, help_text="Months [1..12] when crop is in peak season")
    is_organic = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_index=True)
    rating_count = models.PositiveIntegerField(default=0)
    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_organic', 'category']),
            models.Index(fields=['price', 'rating_avg']),
            GinIndex(fields=['search_vector'], name='product_search_vector_gin'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.farmer.farm_name}-{self.name}")
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
        if connection.vendor == 'postgresql':
            from django.contrib.postgres.search import SearchVector
            Product.objects.filter(id=self.id).update(
                search_vector=(
                    SearchVector('name', weight='A') +
                    SearchVector('short_description', weight='B') +
                    SearchVector('description', weight='C') +
                    SearchVector('farmer__farm_name', weight='B')
                )
            )

    def get_unit_price_for_quantity(self, quantity):
        qty = Decimal(str(quantity))
        tier = self.volume_tiers.filter(min_quantity__lte=qty).order_by('-min_quantity').first()
        if tier and tier.unit_price:
            return tier.unit_price
        return self.price

    def recalculate_rating(self):
        from apps.reviews.models import Review
        reviews = Review.objects.filter(product=self, is_approved=True)
        count = reviews.count()
        if count > 0:
            avg = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0.0
            self.rating_avg = round(avg, 2)
            self.rating_count = count
        else:
            self.rating_avg = 0.0
            self.rating_count = 0
        self.save(update_fields=['rating_avg', 'rating_count'])

    @property
    def primary_image_url(self):
        primary = self.images.filter(is_primary=True).first() or self.images.first()
        if primary and primary.image:
            return primary.image.url
        from .fallback_images import get_fallback_produce_image
        cat_slug = getattr(self.category, 'slug', '') if hasattr(self, 'category') and self.category else ''
        return get_fallback_produce_image(self.name, cat_slug)

    @property
    def thumbnail_url(self):
        primary = self.images.filter(is_primary=True).first() or self.images.first()
        if primary and primary.thumbnail_url:
            return primary.thumbnail_url
        from .fallback_images import get_fallback_produce_image
        cat_slug = getattr(self.category, 'slug', '') if hasattr(self, 'category') and self.category else ''
        return get_fallback_produce_image(self.name, cat_slug)

    @property
    def medium_image_url(self):
        primary = self.images.filter(is_primary=True).first() or self.images.first()
        if primary and primary.medium_url:
            return primary.medium_url
        from .fallback_images import get_fallback_produce_image
        cat_slug = getattr(self.category, 'slug', '') if hasattr(self, 'category') and self.category else ''
        return get_fallback_produce_image(self.name, cat_slug)

    @property
    def blur_placeholder(self):
        primary = self.images.filter(is_primary=True).first() or self.images.first()
        if primary:
            return primary.blur_placeholder
        return ""

    @property
    def available_stock(self):
        if hasattr(self, 'inventory'):
            return self.inventory.available_quantity
        return 0

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.unit} ({self.farmer.farm_name})"


class VolumeDiscountTier(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='volume_tiers')
    min_quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Minimum quantity required for tier")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Percentage discount e.g. 15.00 for 15%")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Discounted unit price override")

    class Meta:
        ordering = ['min_quantity']
        unique_together = ('product', 'min_quantity')

    def save(self, *args, **kwargs):
        if not self.unit_price and self.product_id:
            discount_factor = (Decimal('100.00') - self.discount_percentage) / Decimal('100.00')
            self.unit_price = round(self.product.price * discount_factor, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} (>= {self.min_quantity} {self.product.unit}): {self.discount_percentage}% OFF (${self.unit_price})"


class ProductImage(TimeStampedModel):
    class ProcessingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        READY = 'READY', 'Ready'
        FAILED = 'FAILED', 'Failed'

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/%Y/%m/')
    thumbnail = models.ImageField(upload_to='products/thumbs/%Y/%m/', blank=True, null=True)
    medium = models.ImageField(upload_to='products/medium/%Y/%m/', blank=True, null=True)
    blur_placeholder = models.TextField(blank=True, help_text="Base64 data URI of blurred micro preview")
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        db_index=True
    )

    class Meta:
        ordering = ['-is_primary', 'display_order', 'created_at']

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(id=self.id).update(is_primary=False)
        elif not ProductImage.objects.filter(product=self.product).exclude(id=self.id).exists():
            self.is_primary = True
        super().save(*args, **kwargs)

    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        return self.image.url if self.image else None

    @property
    def medium_url(self):
        if self.medium:
            return self.medium.url
        return self.image.url if self.image else None

    def __str__(self):
        return f"Image for {self.product.name}"


class Inventory(TimeStampedModel):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    available_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.00)]
    )
    reserved_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.00)]
    )
    low_stock_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=5.00
    )
    last_restocked_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Inventories'
        constraints = [
            models.CheckConstraint(
                check=models.Q(available_quantity__gte=0),
                name='available_quantity_non_negative'
            ),
            models.CheckConstraint(
                check=models.Q(reserved_quantity__gte=0),
                name='reserved_quantity_non_negative'
            ),
        ]

    def __str__(self):
        return f"{self.product.name}: {self.available_quantity} {self.product.unit} available"

