from django.db import models
from django.conf import settings
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


class PaymentTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Settlement'
        SUCCESS = 'SUCCESS', 'Settled / Successful'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    transaction_id = models.CharField(max_length=150, unique=True, db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_transactions')
    farmer = models.ForeignKey('farmers.FarmerProfile', on_delete=models.CASCADE, related_name='payment_transactions')

    # Financial Breakdown & Automatic Commission Deduction
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total amount paid by buyer")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    commission_rate_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2, help_text="Marketplace fee retained by platform")
    farmer_net_payout = models.DecimalField(max_digits=12, decimal_places=2, help_text="Net amount credited to farmer")

    currency = models.CharField(max_length=10, default='USD')
    payment_method = models.CharField(max_length=30)
    qr_payload = models.TextField(blank=True, help_text="KHQR / EMVCo QR code string")

    # Farmer Bank Snapshot
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_name = models.CharField(max_length=150, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bakong_account_id = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TX-{self.transaction_id} | Order {self.order.order_number} | Gross: ${self.gross_amount} | Fee: ${self.platform_commission} | Net: ${self.farmer_net_payout}"

