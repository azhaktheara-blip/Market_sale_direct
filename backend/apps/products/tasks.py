import logging
from celery import shared_task
from .models import ProductImage
from .services import ProductImageService

logger = logging.getLogger(__name__)


@shared_task(name='apps.products.tasks.process_product_image_task', bind=True, max_retries=3)
def process_product_image_task(self, image_id: str):
    """
    Celery background worker task that pulls a pending ProductImage,
    runs the Pillow pipeline (resizing, WebP, blur placeholder, quality heuristics),
    and updates processing_status to READY or FAILED.
    """
    try:
        img_instance = ProductImage.objects.select_related('product').get(id=image_id)
    except ProductImage.DoesNotExist:
        logger.error(f"ProductImage {image_id} not found for background processing.")
        return {'status': 'error', 'message': 'Image not found'}

    try:
        ProductImageService.process_existing_image(img_instance)
        logger.info(f"Successfully processed image {image_id} for product {img_instance.product.name}")
        return {'status': 'success', 'image_id': str(image_id)}
    except Exception as exc:
        logger.exception(f"Error processing image {image_id}: {exc}")
        img_instance.processing_status = ProductImage.ProcessingStatus.FAILED
        img_instance.save(update_fields=['processing_status'])
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=5 * (2 ** self.request.retries))
