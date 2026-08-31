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

User = get_user_model()


class OrderAndInventoryAtomicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Roots', slug='roots')
        
        # Farmer & Product
        self.farmer_user = User.objects.create_user(email='farm1@example.com', password='password123', role='FARMER')
        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            farm_name='Angkor Farm',
            province='Siem Reap',
            is_verified=True
        )
        self.product = Product.objects.create(
            farmer=self.farmer_profile,
            category=self.category,
            name='Sweet Carrots',
            price=Decimal('2.00'),
            unit='KG',
            minimum_order_qty=Decimal('1.00'),
            harvest_date=timezone.now().date(),
            status=Product.Status.ACTIVE
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            available_quantity=Decimal('20.00'),
            low_stock_threshold=Decimal('5.00')
        )

        # Customer & Address
        self.customer = User.objects.create_user(email='buyer1@example.com', password='password123', role='CUSTOMER')
        self.address = Address.objects.create(
            user=self.customer,
            label='Home',
            recipient_name='Buyer Dara',
            phone_number='+85512345678',
            province='Siem Reap',
            district='Siem Reap',
            street_address='St 08'
        )

    def test_atomic_checkout_deducts_inventory(self):
        self.client.force_authenticate(user=self.customer)

        # 1. Add 5 kg to cart
        cart, _ = Cart.objects.get_or_create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('5.00'))

        # 2. Perform checkout
        response = self.client.post('/api/v1/orders/checkout/', {
            'address_id': str(self.address.id),
            'payment_method': 'COD',
            'customer_notes': 'Please ring the bell'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['orders']), 1)
        
        # 3. Check inventory deduction
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_quantity, Decimal('15.00'))
        self.assertEqual(self.inventory.reserved_quantity, Decimal('5.00'))

        # 4. Check cart is cleared
        self.assertFalse(cart.items.exists())

        # 5. Check order item snapshots
        order = Order.objects.get(id=response.data['orders'][0]['id'])
        self.assertEqual(order.subtotal, Decimal('10.00'))
        self.assertEqual(order.delivery_fee, Decimal('2.00'))
        self.assertEqual(order.total, Decimal('12.00'))
        self.assertEqual(order.delivery_address_snapshot['street_address'], 'St 08')

    def test_insufficient_stock_prevents_checkout(self):
        self.client.force_authenticate(user=self.customer)

        cart, _ = Cart.objects.get_or_create(user=self.customer)
        # Attempt to order 25kg when only 20kg is available
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('25.00'))

        response = self.client.post('/api/v1/orders/checkout/', {
            'address_id': str(self.address.id),
            'payment_method': 'COD'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Inventory remains untouched
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_quantity, Decimal('20.00'))

    def test_order_status_state_machine_and_cancellation_refund(self):
        # Create order of 5kg
        cart, _ = Cart.objects.get_or_create(user=self.customer)
        CartItem.objects.create(cart=cart, product=self.product, quantity=Decimal('5.00'))
        orders = OrderService.checkout(self.customer, self.address.id)
        order = orders[0]

        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_quantity, Decimal('15.00'))

        # Customer cancels order -> stock should be immediately restored to 20kg
        OrderService.cancel_order_by_customer(order, self.customer, reason="Changed mind")
        
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_quantity, Decimal('20.00'))
        self.assertEqual(self.inventory.reserved_quantity, Decimal('0.00'))
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CANCELLED)

