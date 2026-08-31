from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Address
from apps.farmers.models import FarmerProfile
from apps.products.models import Category, Product, Inventory
from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.orders.services import OrderService
from apps.reviews.models import Review

User = get_user_model()


class VerifiedReviewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Fruits', slug='fruits')
        
        self.farmer_user = User.objects.create_user(email='mangofarmer@example.com', password='password123', role='FARMER')
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            farm_name='Mango Hill',
            province='Koh Kong',
            is_verified=True
        )
        self.product = Product.objects.create(
            farmer=self.farmer_profile,
            category=self.category,
            name='Sweet Mangoes',
            price=Decimal('3.00'),
            unit='KG',
            minimum_order_qty=Decimal('1.00'),
            harvest_date=timezone.now().date(),
            status=Product.Status.ACTIVE
        )
        self.inventory = Inventory.objects.create(product=self.product, available_quantity=Decimal('100.00'))

        self.customer1 = User.objects.create_user(email='buyer_one@example.com', password='password123', role='CUSTOMER')
        self.customer2 = User.objects.create_user(email='buyer_two@example.com', password='password123', role='CUSTOMER')
        self.address = Address.objects.create(
            user=self.customer1,
            recipient_name='Buyer One',
            phone_number='+85512345678',
            province='Phnom Penh',
            street_address='St 51'
        )

    def test_cannot_review_unpurchased_or_undelivered_order(self):
        # Place order but leave in PENDING status
        cart, _ = Cart.objects.get_or_create(user=self.customer1)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('3.00'))
        orders = OrderService.checkout(self.customer1, self.address.id)
        order_item = orders[0].items.first()

        # Customer 1 attempts to review while status is PENDING
        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/v1/reviews/', {
            'order_item_id': str(order_item.id),
            'rating': 5,
            'title': 'Great mangoes',
            'comment': 'Loved them!'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Customer 2 attempts to review Customer 1's purchase
        self.client.force_authenticate(user=self.customer2)
        res2 = self.client.post('/api/v1/reviews/', {
            'order_item_id': str(order_item.id),
            'rating': 5,
            'title': 'Stolen review',
            'comment': 'Should fail'
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_verified_review_updates_aggregates(self):
        # Place order and deliver it
        cart, _ = Cart.objects.get_or_create(user=self.customer1)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('2.00'))
        orders = OrderService.checkout(self.customer1, self.address.id)
        order = orders[0]
        order_item = order.items.first()

        # Move to DELIVERED
        OrderService.update_order_status(order, Order.Status.CONFIRMED, self.farmer_user)
        OrderService.update_order_status(order, Order.Status.PREPARING, self.farmer_user)
        OrderService.update_order_status(order, Order.Status.READY, self.farmer_user)
        OrderService.update_order_status(order, Order.Status.OUT_FOR_DELIVERY, self.farmer_user)
        OrderService.update_order_status(order, Order.Status.DELIVERED, self.farmer_user)

        self.client.force_authenticate(user=self.customer1)
        res = self.client.post('/api/v1/reviews/', {
            'order_item_id': str(order_item.id),
            'rating': 5,
            'title': 'Sweetest mangoes in Cambodia!',
            'comment': 'Ripe and aromatic.'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Verify product and farmer rating aggregates updated
        self.product.refresh_from_db()
        self.assertEqual(self.product.rating_avg, Decimal('5.00'))
        self.assertEqual(self.product.rating_count, 1)

        self.farmer_profile.refresh_from_db()
        self.assertEqual(self.farmer_profile.rating_avg, Decimal('5.00'))
        self.assertEqual(self.farmer_profile.rating_count, 1)

