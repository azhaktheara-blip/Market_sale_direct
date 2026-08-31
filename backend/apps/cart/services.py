from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from .models import Cart, CartItem
from apps.products.models import Product


class CartService:
    @staticmethod
    def get_or_create_cart(request):
        guest_key = request.headers.get('X-Session-Key') or request.session.session_key
        if not guest_key and not request.user.is_authenticated:
            if not request.session.session_key:
                request.session.create()
            guest_key = request.session.session_key

        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            # If guest cart exists, merge into authenticated user cart
            if guest_key:
                guest_cart = Cart.objects.filter(session_key=guest_key, user__isnull=True).first()
                if guest_cart and guest_cart.id != cart.id:
                    for item in guest_cart.items.all():
                        existing, created = CartItem.objects.get_or_create(
                            cart=cart,
                            product=item.product,
                            defaults={'quantity': item.quantity}
                        )
                        if not created:
                            existing.quantity += item.quantity
                            existing.save()
                    guest_cart.delete()
            return cart
        else:
            cart, _ = Cart.objects.get_or_create(session_key=guest_key, user__isnull=True)
            return cart

    @staticmethod
    def add_item(cart, product_id, quantity):
        product = get_object_or_404(Product.objects.select_related('inventory', 'farmer'), id=product_id)

        if product.status != Product.Status.ACTIVE:
            raise ValidationError("This product is currently unavailable.")

        qty = Decimal(str(quantity))
        if qty < product.minimum_order_qty:
            raise ValidationError(f"Minimum order quantity for this item is {product.minimum_order_qty} {product.unit}.")

        available = product.inventory.available_quantity if hasattr(product, 'inventory') else Decimal('0')

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': qty}
        )

        if not created:
            new_qty = item.quantity + qty
            if new_qty > available:
                raise ValidationError(f"Cannot add {qty} more. Only {available} {product.unit} available in stock.")
            item.quantity = new_qty
            item.save()
        else:
            if qty > available:
                raise ValidationError(f"Requested quantity exceeds available stock of {available} {product.unit}.")

        return item

    @staticmethod
    def update_item(cart, item_id, quantity):
        item = get_object_or_404(CartItem.objects.select_related('product__inventory'), id=item_id, cart=cart)
        qty = Decimal(str(quantity))

        if qty <= 0:
            item.delete()
            return None

        if qty < item.product.minimum_order_qty:
            raise ValidationError(f"Minimum order quantity for this item is {item.product.minimum_order_qty} {item.product.unit}.")

        available = item.product.inventory.available_quantity if hasattr(item.product, 'inventory') else Decimal('0')
        if qty > available:
            raise ValidationError(f"Only {available} {item.product.unit} available in stock.")

        item.quantity = qty
        item.save()
        return item

    @staticmethod
    def remove_item(cart, item_id):
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()

    @staticmethod
    def clear_cart(cart):
        cart.items.all().delete()

