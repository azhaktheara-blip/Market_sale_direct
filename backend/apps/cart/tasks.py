from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging
from .models import Cart

logger = logging.getLogger(__name__)


@shared_task(name='apps.cart.tasks.cleanup_expired_guest_carts')
def cleanup_expired_guest_carts():
    """
    Deletes anonymous/guest Cart rows where user is null and updated_at
    is older than 30 days. Cascade-deletes all associated CartItems.
    """
    cutoff = timezone.now() - timedelta(days=30)
    expired_carts = Cart.objects.filter(user__isnull=True, updated_at__lt=cutoff)
    count, details = expired_carts.delete()
    logger.info(f"Cleaned up {count} expired guest cart object(s) older than {cutoff}. Details: {details}")
    return count
