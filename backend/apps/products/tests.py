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

