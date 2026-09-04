import base64
import io
import math
from PIL import Image, ImageOps, ImageStat, ImageFilter
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from .models import Product, ProductImage


class ProductImageService:
    """
    Agency-grade Pillow image pipeline for agricultural produce photos.
    - Handles EXIF auto-rotation
    - Resizes to responsive breakpoints (Original 1400px, Medium 700px, Thumbnail 300px)
    - Compresses to modern WebP format
    - Generates 16x16 micro blur data URI placeholder
    - Calculates quality heuristics (sharpness, exposure)
    """

    MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024  # 12 MB
    ALLOWED_FORMATS = {'JPEG', 'JPG', 'PNG', 'WEBP', 'AVIF', 'MPO'}

    @classmethod
    def check_image_quality(cls, pil_img: Image.Image) -> dict:
        """
        Calculates sharpness and exposure quality metrics to assist farmers
        in uploading clear, well-lit produce photos.
        """
        # Convert to grayscale for metrics
        gray = pil_img.convert('L')
        stat = ImageStat.Stat(gray)
        mean_brightness = stat.mean[0]  # 0 (pitch black) to 255 (blown out)

        # Edge sharpness detection via Laplacian approximation filter
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        sharpness_score = edge_stat.var[0]  # Higher variance = sharper edges

        is_too_dark = mean_brightness < 40
        is_too_bright = mean_brightness > 235
        is_blurry = sharpness_score < 40
        is_low_res = pil_img.width < 400 or pil_img.height < 400

        issues = []
        if is_too_dark:
            issues.append("Photo appears too dark. Consider taking photo in natural daylight.")
        if is_too_bright:
            issues.append("Photo appears overexposed. Reduce direct harsh glare.")
        if is_blurry:
            issues.append("Photo may be slightly out of focus. Hold phone steady.")
        if is_low_res:
            issues.append("Resolution is lower than recommended (minimum 600x600 px).")

        return {
            'is_good_quality': len(issues) == 0,
            'brightness_score': round(mean_brightness, 1),
            'sharpness_score': round(sharpness_score, 1),
            'dimensions': {'width': pil_img.width, 'height': pil_img.height},
            'issues': issues
        }

    @classmethod
    def generate_blur_placeholder(cls, pil_img: Image.Image) -> str:
        """
        Generates a lightweight 16x16 base64 PNG data URI for instant skeleton blur-up.
        """
        thumb = pil_img.copy()
        thumb.thumbnail((16, 16), Image.Resampling.BILINEAR)
        thumb = thumb.filter(ImageFilter.GaussianBlur(radius=1.5))
        
        buffer = io.BytesIO()
        thumb.save(buffer, format='PNG', optimize=True)
        b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{b64}"

    @classmethod
    def _compress_to_webp(cls, pil_img: Image.Image, max_dim: int, quality: int) -> ContentFile:
        img_copy = pil_img.copy()
        # Scale proportionally within max_dim x max_dim
        img_copy.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        
        # Convert RGBA to RGB with white background if saving as WebP
        if img_copy.mode in ('RGBA', 'LA'):
            bg = Image.new('RGB', img_copy.size, (255, 255, 255))
            bg.paste(img_copy, mask=img_copy.split()[-1])
            img_copy = bg
        elif img_copy.mode != 'RGB':
            img_copy = img_copy.convert('RGB')

        buf = io.BytesIO()
        img_copy.save(buf, format='WEBP', quality=quality, method=6)
        return ContentFile(buf.getvalue())

    @classmethod
    def create_pending_image(
        cls,
        product: Product,
        uploaded_file,
        is_primary: bool = False,
        alt_text: str = ''
    ) -> ProductImage:
        """
        Saves the raw uploaded image file synchronously with processing_status=PENDING
        without blocking on heavy Pillow compression and analysis.
        """
        if uploaded_file.size > cls.MAX_FILE_SIZE_BYTES:
            raise ValidationError(f"File size exceeds limit of {cls.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.")

        # Quick validation of format header
        try:
            pil_img = Image.open(uploaded_file)
            orig_format = (pil_img.format or 'JPEG').upper()
            if orig_format not in cls.ALLOWED_FORMATS:
                raise ValidationError(f"Unsupported image format: {orig_format}. Please upload JPEG, PNG, or WebP.")
            # Rewind file pointer for saving
            if hasattr(uploaded_file, 'seek'):
                uploaded_file.seek(0)
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError(f"Invalid or corrupted image file: {str(e)}")

        filename = uploaded_file.name
        prod_img = ProductImage(
            product=product,
            is_primary=is_primary,
            alt_text=alt_text or f"Fresh harvest {product.name}",
            processing_status=ProductImage.ProcessingStatus.PENDING,
        )
        prod_img.image.save(filename, uploaded_file, save=True)
        return prod_img

    @classmethod
    def process_existing_image(cls, prod_img: ProductImage) -> tuple[ProductImage, dict]:
        """
        Executes the heavy Pillow pipeline on an existing ProductImage row:
        - Auto-orient EXIF
        - Generate blur placeholder data URI
        - Responsive WebP compression (1400px, 700px, 300px)
        - Sharpness and exposure quality metrics
        - Sets processing_status=READY
        """
        try:
            prod_img.image.open()
            pil_img = Image.open(prod_img.image)
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception as e:
            prod_img.processing_status = ProductImage.ProcessingStatus.FAILED
            prod_img.save(update_fields=['processing_status'])
            raise ValidationError(f"Could not open image file: {str(e)}")

        quality_info = cls.check_image_quality(pil_img)
        blur_placeholder = cls.generate_blur_placeholder(pil_img)
        full_content = cls._compress_to_webp(pil_img, max_dim=1400, quality=88)
        medium_content = cls._compress_to_webp(pil_img, max_dim=700, quality=85)
        thumb_content = cls._compress_to_webp(pil_img, max_dim=300, quality=80)

        filename_base = f"{prod_img.product.slug[:30]}_{str(prod_img.id)[:8]}"

        prod_img.width = pil_img.width
        prod_img.height = pil_img.height
        prod_img.blur_placeholder = blur_placeholder
        prod_img.processing_status = ProductImage.ProcessingStatus.READY

        prod_img.image.save(f"{filename_base}_full.webp", full_content, save=False)
        prod_img.medium.save(f"{filename_base}_med.webp", medium_content, save=False)
        prod_img.thumbnail.save(f"{filename_base}_thumb.webp", thumb_content, save=False)
        prod_img.save()

        return prod_img, quality_info

    @classmethod
    def process_and_create_image(
        cls,
        product: Product,
        uploaded_file,
        is_primary: bool = False,
        alt_text: str = ''
    ) -> tuple[ProductImage, dict]:
        """
        Synchronous wrapper that creates the pending image and immediately processes it.
        """
        prod_img = cls.create_pending_image(
            product=product,
            uploaded_file=uploaded_file,
            is_primary=is_primary,
            alt_text=alt_text
        )
        return cls.process_existing_image(prod_img)


