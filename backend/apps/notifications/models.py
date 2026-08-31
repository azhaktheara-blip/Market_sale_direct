from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    class Type(models.TextChoices):
        ORDER_UPDATE = 'ORDER_UPDATE', 'Order Status Update'
        INVENTORY_ALERT = 'INVENTORY_ALERT', 'Low Inventory Alert'
        VERIFICATION = 'VERIFICATION', 'Farmer Verification'
        REVIEW = 'REVIEW', 'New Review'
        SYSTEM = 'SYSTEM', 'System Announcement'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.SYSTEM,
        db_index=True
    )
    link_url = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

