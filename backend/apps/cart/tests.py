from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.cart.models import Cart, CartItem
from apps.cart.tasks import cleanup_expired_guest_carts
from apps.products.models import Category, Product
from apps.farmers.models import FarmerProfile

User = get_user_model()


class GuestCartCleanupTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Vegetables', slug='vegetables')
        self.farmer_user = User.objects.create_user(email='cartfarmer@example.com', password='password123', role='FARMER')
        self.farmer = FarmerProfile.objects.create(
            user=self.farmer_user,
            farm_name='Cart Farm',
            province='Takeo'
        )
        self.product = Product.objects.create(
            farmer=self.farmer,
            category=self.category,
            name='Fresh Cucumbers',
            price=Decimal('1.50'),
            harvest_date=timezone.now().date(),
            short_description='Crunchy fresh cucumbers.',
            description='Farm fresh cucumbers.'
        )

    def test_cleanup_deletes_expired_guest_carts_and_cascades(self):
        # 1. Active guest cart (updated 5 days ago)
        active_guest_cart = Cart.objects.create(user=None, session_key='active_session')
        CartItem.objects.create(cart=active_guest_cart, product=self.product, quantity=Decimal('2.00'))

        # 2. Expired guest cart (updated 35 days ago)
        expired_guest_cart = Cart.objects.create(user=None, session_key='expired_session')
        CartItem.objects.create(cart=expired_guest_cart, product=self.product, quantity=Decimal('5.00'))
        # Manually backdate updated_at
        Cart.objects.filter(id=expired_guest_cart.id).update(updated_at=timezone.now() - timedelta(days=35))

        # 3. Expired user cart (updated 40 days ago, but has user so should NOT be deleted)
        user = User.objects.create_user(email='registered_buyer@example.com', password='password123')
        user_cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=user_cart, product=self.product, quantity=Decimal('1.00'))
        Cart.objects.filter(id=user_cart.id).update(updated_at=timezone.now() - timedelta(days=40))

        # Run the celery cleanup task
        cleanup_expired_guest_carts()

        # Check that expired guest cart was deleted
        self.assertFalse(Cart.objects.filter(id=expired_guest_cart.id).exists())
        # Check that its CartItems were cascade-deleted
        self.assertFalse(CartItem.objects.filter(cart_id=expired_guest_cart.id).exists())

        # Check that active guest cart and user cart remain
        self.assertTrue(Cart.objects.filter(id=active_guest_cart.id).exists())
        self.assertTrue(Cart.objects.filter(id=user_cart.id).exists())
