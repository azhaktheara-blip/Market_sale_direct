from django.db import models
from apps.core.models import TimeStampedModel
from apps.orders.models import Order


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Payment Pending'
        COMPLETED = 'COMPLETED', 'Payment Completed'
        FAILED = 'FAILED', 'Payment Failed'
        REFUNDED = 'REFUNDED', 'Payment Refunded'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=30, choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.COD)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    transaction_id = models.CharField(max_length=150, blank=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_gateway_response = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Payment for {self.order.order_number}: ${self.amount} ({self.status})"


class ProcessedWebhook(TimeStampedModel):
    """
    Guarantees idempotency and replay protection for payment webhooks.
    """
    provider = models.CharField(max_length=50, db_index=True)
    event_id = models.CharField(max_length=255, unique=True, db_index=True)
    payload_hash = models.CharField(max_length=64, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider} - {self.event_id}"
