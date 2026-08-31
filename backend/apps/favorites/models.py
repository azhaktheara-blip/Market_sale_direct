from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.core.models import TimeStampedModel
from apps.products.models import Product
from apps.farmers.models import FarmerProfile


class Favorite(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        db_index=True
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='favorited_by'
    )
    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='favorited_by'
    )

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                condition=models.Q(product__isnull=False),
                name='unique_user_product_favorite'
            ),
            models.UniqueConstraint(
                fields=['user', 'farmer'],
                condition=models.Q(farmer__isnull=False),
                name='unique_user_farmer_favorite'
            ),
        ]

    def clean(self):
        if not self.product and not self.farmer:
            raise ValidationError("A favorite must reference either a Product or a Farmer.")
        if self.product and self.farmer:
            raise ValidationError("A favorite cannot reference both a Product and a Farmer simultaneously.")

    def __str__(self):
        if self.product:
            return f"{self.user.email} saved product: {self.product.name}"
        return f"{self.user.email} saved farmer: {self.farmer.farm_name}"

