from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel
from apps.products.models import Product
from apps.farmers.models import FarmerProfile
from apps.orders.models import OrderItem


class Review(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    order_item = models.OneToOneField(
        OrderItem,
        on_delete=models.CASCADE,
        related_name='review',
        help_text="Ensures review is tied directly to a verified delivered purchase."
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        db_index=True
    )
    title = models.CharField(max_length=150)
    comment = models.TextField()
    image = models.ImageField(upload_to='reviews/', blank=True, null=True)
    is_approved = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'is_approved', 'rating']),
            models.Index(fields=['farmer', 'is_approved', 'rating']),
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate aggregates on product & farmer
        if self.product:
            self.product.recalculate_rating()
        if self.farmer:
            self.farmer.recalculate_rating()

    def delete(self, *args, **kwargs):
        product = self.product
        farmer = self.farmer
        super().delete(*args, **kwargs)
        if product:
            product.recalculate_rating()
        if farmer:
            farmer.recalculate_rating()

    def __str__(self):
        return f"{self.customer.email} -> {self.product.name} ({self.rating} stars)"

