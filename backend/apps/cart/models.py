from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from apps.core.models import TimeStampedModel
from apps.products.models import Product


class Cart(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        null=True,
        blank=True
    )
    session_key = models.CharField(max_length=64, blank=True, null=True, db_index=True)

    def __str__(self):
        if self.user:
            return f"Cart for User: {self.user.email}"
        return f"Cart for Session: {self.session_key}"


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01)]
    )

    class Meta:
        unique_together = ('cart', 'product')
        ordering = ['-created_at']

    @property
    def effective_unit_price(self):
        return self.product.get_unit_price_for_quantity(self.quantity)

    @property
    def subtotal(self):
        return round(self.effective_unit_price * self.quantity, 2)

    @property
    def is_discounted(self):
        return self.effective_unit_price < self.product.price

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

