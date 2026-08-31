from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.farmers.models import FarmerProfile
from apps.products.models import Product


class Conversation(TimeStampedModel):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_conversations',
        db_index=True
    )
    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name='farmer_conversations',
        db_index=True
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inquiries'
    )
    subject = models.CharField(max_length=200, default='Produce Inquiry')
    last_message_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-last_message_at']
        unique_together = ('customer', 'farmer', 'product')

    def __str__(self):
        return f"Chat: {self.customer.username} ↔ {self.farmer.farm_name} ({self.subject})"


class ChatMessage(TimeStampedModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender.username}: {self.message[:30]}"

