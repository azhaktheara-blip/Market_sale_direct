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

