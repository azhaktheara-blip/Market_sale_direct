import random
import string
from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.farmers.models import FarmerProfile
from apps.products.models import Product


def generate_order_number():
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"FDM-{random_str}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Confirmation'
        CONFIRMED = 'CONFIRMED', 'Order Confirmed'
        PREPARING = 'PREPARING', 'Preparing / Harvesting'
        READY = 'READY', 'Packed & Ready'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled by Customer'
        REJECTED = 'REJECTED', 'Rejected by Farmer'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Payment Pending'
        PAID = 'PAID', 'Payment Received'
        REFUNDED = 'REFUNDED', 'Payment Refunded'
        FAILED = 'FAILED', 'Payment Failed'

    class PaymentMethod(models.TextChoices):
        COD = 'COD', 'Cash on Delivery'
        CREDIT_CARD = 'CREDIT_CARD', 'Credit / Debit Card'
        BAKONG_QR = 'BAKONG_QR', 'KHQR / Bakong'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Direct Bank Transfer'

    order_number = models.CharField(max_length=30, unique=True, default=generate_order_number, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True
    )
    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=2.00)
    commission_rate_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="Marketplace commission rate applied (e.g. 5.00%).")
    marketplace_commission = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Total commission retained by platform.")
    farmer_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Net payout payable to farmer (subtotal - commission).")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    idempotency_key = models.CharField(max_length=64, blank=True, null=True, unique=True, db_index=True)
    
    # Immutable address snapshot taken at order placement
    delivery_address_snapshot = models.JSONField(default=dict)
    customer_notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['farmer', 'status']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.farmer.farm_name} (${self.total}) [{self.status}]"


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items'
    )
    product_name_snapshot = models.CharField(max_length=200)
    product_image_snapshot = models.CharField(max_length=500, blank=True)
    unit_snapshot = models.CharField(max_length=20)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.quantity} {self.unit_snapshot} x {self.product_name_snapshot} (${self.subtotal})"


class Delivery(TimeStampedModel):
    class DeliveryType(models.TextChoices):
        FARMER_DIRECT = 'FARMER_DIRECT', 'Direct Farmer Delivery'
        MARKETPLACE_LOGISTICS = 'MARKETPLACE_LOGISTICS', 'Marketplace Express Logistics'
        THIRD_PARTY = 'THIRD_PARTY', 'Third-party Logistics Partner'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_type = models.CharField(
        max_length=30,
        choices=DeliveryType.choices,
        default=DeliveryType.FARMER_DIRECT
    )
    tracking_number = models.CharField(max_length=100, blank=True)
    driver_name = models.CharField(max_length=150, blank=True)
    driver_phone = models.CharField(max_length=30, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Delivery for {self.order.order_number}"


class Subscription(TimeStampedModel):
    class Frequency(models.TextChoices):
        WEEKLY = 'WEEKLY', 'Weekly Regular Harvest'
        BIWEEKLY = 'BIWEEKLY', 'Every Two Weeks'
        MONTHLY = 'MONTHLY', 'Monthly'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active Subscription'
        PAUSED = 'PAUSED', 'Paused'
        CANCELLED = 'CANCELLED', 'Cancelled'

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        db_index=True
    )
    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        db_index=True
    )
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.WEEKLY
    )
    delivery_day = models.CharField(
        max_length=20,
        default='Tuesday',
        help_text="Preferred delivery day (e.g., Tuesday morning)"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    delivery_address = models.ForeignKey(
        'accounts.Address',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    payment_method = models.CharField(
        max_length=30,
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.COD
    )
    next_delivery_date = models.DateField(db_index=True)
    customer_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def estimated_total(self):
        return sum(item.subtotal for item in self.items.all())

    def __str__(self):
        return f"Sub #{str(self.id)[:8]} - {self.customer.username} ({self.farmer.farm_name}) [{self.frequency}]"


class SubscriptionItem(TimeStampedModel):
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='subscription_items'
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)

    class Meta:
        unique_together = ('subscription', 'product')

    @property
    def unit_price(self):
        return self.product.get_unit_price_for_quantity(self.quantity)

    @property
    def subtotal(self):
        return round(self.unit_price * self.quantity, 2)

    def __str__(self):
        return f"{self.quantity} {self.product.unit} x {self.product.name}"

