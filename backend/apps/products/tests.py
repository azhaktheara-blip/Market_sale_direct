from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product, Inventory
from apps.farmers.models import FarmerProfile

User = get_user_model()


class ProductsCatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Leafy Greens', slug='leafy-greens')
        self.farmer_user = User.objects.create_user(email='farmertest@example.com', password='password123', role='FARMER')
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            farm_name='Test Agri Farm',
            province='Siem Reap',
            farming_practice='ORGANIC',
            is_verified=True
        )
        self.product = Product.objects.create(
            farmer=self.farmer_profile,
            category=self.category,
            name='Crisp Organic Bok Choy',
            price=Decimal('2.50'),
            unit='KG',
            minimum_order_qty=Decimal('1.00'),
            harvest_date=timezone.now().date(),
            is_organic=True,
            status=Product.Status.ACTIVE,
            short_description='Delicious crisp bok choy.',
            description='Detailed bok choy description.'
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            available_quantity=Decimal('50.00'),
            low_stock_threshold=Decimal('5.00')
        )

    def test_public_product_list_and_filters(self):
        response = self.client.get('/api/v1/products/?is_organic=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Crisp Organic Bok Choy')

    def test_product_detail_by_slug(self):
        response = self.client.get(f'/api/v1/products/{self.product.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Crisp Organic Bok Choy')
        self.assertEqual(response.data['farmer']['farm_name'], 'Test Agri Farm')

    def test_farmer_can_create_product(self):
        self.client.force_authenticate(user=self.farmer_user)
        payload = {
            'category': str(self.category.id),
            'name': 'Red Cherry Tomatoes',
            'price': '3.20',
            'unit': 'KG',
            'minimum_order_qty': '1.00',
            'harvest_date': str(timezone.now().date()),
            'is_organic': True,
            'status': 'DRAFT',
            'initial_stock': '100.00',
            'short_description': 'Sweet cherry tomatoes.',
            'description': 'Handpicked red cherry tomatoes.'
        }
        response = self.client.post('/api/v1/farmer/products/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_p = Product.objects.get(name='Red Cherry Tomatoes')
        self.assertEqual(created_p.inventory.available_quantity, Decimal('100.00'))

    def test_product_search_by_query_param(self):
        # Search by crop name
        res = self.client.get('/api/v1/products/?search=Bok+Choy')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 1)

        # Search by farm name
        res2 = self.client.get('/api/v1/products/?search=Agri+Farm')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res2.data['count'], 1)

        # Non-matching search
        res3 = self.client.get('/api/v1/products/?search=NonExistentFruitXYZ')
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data['count'], 0)

    def test_seasonal_calendar_caching(self):
        from django.core.cache import cache
        cache.delete('seasonal_calendar_v1')

        # First request (cache miss -> rebuilds and caches)
        res1 = self.client.get('/api/v1/products/seasonal-calendar/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(cache.get('seasonal_calendar_v1'))

        # Second request (cache hit)
        res2 = self.client.get('/api/v1/products/seasonal-calendar/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res1.data), len(res2.data))

    def test_async_product_image_upload_and_task(self):
        import io
        from unittest.mock import patch
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.products.models import ProductImage
        from apps.products.tasks import process_product_image_task

        # Generate test JPEG in memory
        img_io = io.BytesIO()
        pil_img = Image.new('RGB', (600, 600), color='green')
        pil_img.save(img_io, format='JPEG')
        img_io.seek(0)
        uploaded = SimpleUploadedFile('test_bok_choy.jpg', img_io.getvalue(), content_type='image/jpeg')

        self.client.force_authenticate(user=self.farmer_user)
        with patch('apps.products.tasks.process_product_image_task.delay') as mock_task_delay:
            res = self.client.post(
                f'/api/v1/farmer/products/{self.product.id}/images/',
                {'image': uploaded},
                format='multipart'
            )

            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertEqual(res.data['status'], 'processing')
            self.assertEqual(len(res.data['images']), 1)
            self.assertEqual(res.data['images'][0]['processing_status'], 'PENDING')

            created_img_id = res.data['images'][0]['id']
            mock_task_delay.assert_called_once_with(str(created_img_id))

        img_record = ProductImage.objects.get(id=created_img_id)
        self.assertEqual(img_record.processing_status, ProductImage.ProcessingStatus.PENDING)

        # Run the celery task to complete image processing
        task_result = process_product_image_task(str(created_img_id))
        self.assertEqual(task_result['status'], 'success')

        img_record.refresh_from_db()
        self.assertEqual(img_record.processing_status, ProductImage.ProcessingStatus.READY)
        self.assertTrue(bool(img_record.blur_placeholder))
        self.assertTrue(bool(img_record.thumbnail))
        self.assertTrue(bool(img_record.medium))


