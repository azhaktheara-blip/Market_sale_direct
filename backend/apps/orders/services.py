from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Order, OrderItem, Delivery
from apps.accounts.models import Address
from apps.cart.models import Cart, CartItem
from apps.products.models import Inventory
from apps.payments.models import Payment
from apps.notifications.models import Notification
from django.conf import settings


class OrderService:
    @staticmethod
    @transaction.atomic
    def checkout(user, address_id, payment_method=Order.PaymentMethod.COD, customer_notes='', idempotency_key=None):
        if idempotency_key:
            existing_order = Order.objects.filter(idempotency_key=idempotency_key, customer=user).first()
            if existing_order:
                return [existing_order]

        cart = Cart.objects.filter(user=user).first()
        if not cart or not cart.items.exists():
            raise ValidationError("Your cart is empty.")

        address = get_object_or_404(Address, id=address_id, user=user)
        address_snapshot = {
            'label': address.label,
            'recipient_name': address.recipient_name,
            'phone_number': address.phone_number,
            'province': address.province,
            'district': address.district,
            'commune': address.commune,
            'street_address': address.street_address,
            'latitude': str(address.latitude) if address.latitude else None,
            'longitude': str(address.longitude) if address.longitude else None,
        }

        # Group cart items by farmer
        farmer_groups = {}
        for item in cart.items.select_related('product__farmer', 'product__category').all():
            farmer = item.product.farmer
            if farmer.id not in farmer_groups:
                farmer_groups[farmer.id] = {'farmer': farmer, 'items': []}
            farmer_groups[farmer.id]['items'].append(item)

        created_orders = []
        commission_percentage = Decimal(str(getattr(settings, 'MARKETPLACE_COMMISSION_PERCENTAGE', 5.0)))
        commission_rate = commission_percentage / Decimal('100.0')
        delivery_fee_per_farm = Decimal('2.00')

        for farm_id, group in farmer_groups.items():
            farmer = group['farmer']
            items = group['items']

            # Create Order with Idempotency Key
            order_idempotency = f"{idempotency_key}_{farm_id}" if idempotency_key else None
            order = Order.objects.create(
                customer=user,
                farmer=farmer,
                status=Order.Status.PENDING,
                delivery_address_snapshot=address_snapshot,
                customer_notes=customer_notes,
                payment_method=payment_method,
                payment_status=Order.PaymentStatus.PENDING,
                idempotency_key=order_idempotency
            )

            order_subtotal = Decimal('0.00')

            for item in items:
                product = item.product
                
                # Lock inventory row with select_for_update() to prevent race conditions
                try:
                    inventory = Inventory.objects.select_for_update().get(product=product)
                except Inventory.DoesNotExist:
                    raise ValidationError(f"Inventory record missing for product '{product.name}'.")

                if inventory.available_quantity < item.quantity:
                    raise ValidationError(
                        f"Stock conflict for '{product.name}'. Only {inventory.available_quantity} {product.unit} available."
                    )

                # Deduct available quantity and reserve it
                inventory.available_quantity -= item.quantity
                inventory.reserved_quantity += item.quantity
                inventory.save(update_fields=['available_quantity', 'reserved_quantity', 'updated_at'])

                item_subtotal = round(product.price * item.quantity, 2)
                order_subtotal += item_subtotal

                # Primary image snapshot
                primary_img = product.images.filter(is_primary=True).first() or product.images.first()
                img_url = primary_img.image.url if primary_img and primary_img.image else ''

                # Snapshot OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name_snapshot=product.name,
                    product_image_snapshot=img_url,
                    unit_snapshot=product.unit,
                    unit_price_snapshot=product.price,
                    quantity=item.quantity,
                    subtotal=item_subtotal
                )

            commission_amt = round(order_subtotal * commission_rate, 2)
            net_payout = round(order_subtotal - commission_amt, 2)

            order.subtotal = order_subtotal
            order.delivery_fee = delivery_fee_per_farm
            order.commission_rate_percentage = commission_percentage
            order.marketplace_commission = commission_amt
            order.farmer_payout = net_payout
            order.total = round(order_subtotal + delivery_fee_per_farm, 2)
            order.save()

            # Initialize Delivery tracking
            Delivery.objects.create(
                order=order,
                delivery_type=Delivery.DeliveryType.FARMER_DIRECT,
                delivery_notes=customer_notes
            )

            # Initialize Payment record
            Payment.objects.create(
                order=order,
                payment_method=payment_method,
                amount=order.total,
                status=Payment.Status.PENDING
            )

            # Send Notification to Farmer
            Notification.objects.create(
                user=farmer.user,
                title=f"New Order Received #{order.order_number}",
                message=f"You received an order for ${order.total} from {user.username or user.email}.",
                notification_type=Notification.Type.ORDER_UPDATE,
                link_url=f"/farmer/orders/{order.id}"
            )

            created_orders.append(order)

        # Clear cart after successful checkout
        cart.items.all().delete()

        # Send Notification to Customer
        Notification.objects.create(
            user=user,
            title="Order Placed Successfully",
            message=f"We have sent your orders to {len(created_orders)} farmer(s). You can track delivery progress anytime.",
            notification_type=Notification.Type.ORDER_UPDATE,
            link_url="/customer/orders"
        )

        return created_orders

    @staticmethod
    @transaction.atomic
    def update_order_status(order, new_status, actor):
        valid_transitions = {
            Order.Status.PENDING: [
                Order.Status.CONFIRMED,
                Order.Status.PREPARING,
                Order.Status.READY,
                Order.Status.OUT_FOR_DELIVERY,
                Order.Status.DELIVERED,
                Order.Status.REJECTED,
                Order.Status.CANCELLED,
            ],
            Order.Status.CONFIRMED: [
                Order.Status.PREPARING,
                Order.Status.READY,
                Order.Status.OUT_FOR_DELIVERY,
                Order.Status.DELIVERED,
                Order.Status.CANCELLED,
            ],
            Order.Status.PREPARING: [
                Order.Status.READY,
                Order.Status.OUT_FOR_DELIVERY,
                Order.Status.DELIVERED,
                Order.Status.CONFIRMED,
                Order.Status.CANCELLED,
            ],
            Order.Status.READY: [
                Order.Status.OUT_FOR_DELIVERY,
                Order.Status.DELIVERED,
                Order.Status.PREPARING,
                Order.Status.CANCELLED,
            ],
            Order.Status.OUT_FOR_DELIVERY: [
                Order.Status.DELIVERED,
                Order.Status.READY,
                Order.Status.CANCELLED,
            ],
            Order.Status.DELIVERED: [Order.Status.DELIVERED],
            Order.Status.CANCELLED: [],
            Order.Status.REJECTED: [],
        }

        if new_status not in valid_transitions.get(order.status, []):
            raise ValidationError(f"Invalid status transition from '{order.status}' to '{new_status}'.")

        old_status = order.status
        order.status = new_status

        if old_status == Order.Status.PENDING and new_status in [
            Order.Status.CONFIRMED,
            Order.Status.PREPARING,
            Order.Status.READY,
            Order.Status.OUT_FOR_DELIVERY,
            Order.Status.DELIVERED,
        ]:
            # Convert reserved quantities to permanently deducted
            for item in order.items.all():
                if item.product:
                    try:
                        inv = Inventory.objects.select_for_update().get(product=item.product)
                        inv.reserved_quantity = max(Decimal('0.00'), inv.reserved_quantity - item.quantity)
                        inv.save(update_fields=['reserved_quantity', 'updated_at'])
                    except Inventory.DoesNotExist:
                        pass

        elif new_status in [Order.Status.CANCELLED, Order.Status.REJECTED]:
            # Restore stock if cancelled or rejected
            for item in order.items.all():
                if item.product:
                    try:
                        inv = Inventory.objects.select_for_update().get(product=item.product)
                        inv.available_quantity += item.quantity
                        if old_status == Order.Status.PENDING:
                            inv.reserved_quantity = max(Decimal('0.00'), inv.reserved_quantity - item.quantity)
                        inv.save(update_fields=['available_quantity', 'reserved_quantity', 'updated_at'])
                    except Inventory.DoesNotExist:
                        pass

        elif new_status == Order.Status.DELIVERED:
            if hasattr(order, 'delivery'):
                order.delivery.actual_delivery = timezone.now()
                order.delivery.save(update_fields=['actual_delivery'])
            if order.payment_method == Order.PaymentMethod.COD and hasattr(order, 'payment'):
                order.payment.status = Payment.Status.COMPLETED
                order.payment.paid_at = timezone.now()
                order.payment.save(update_fields=['status', 'paid_at'])
                order.payment_status = Order.PaymentStatus.PAID

        order.save()

        # Notify Customer
        status_labels = dict(Order.Status.choices)
        Notification.objects.create(
            user=order.customer,
            title=f"Order #{order.order_number} Update",
            message=f"Your order from {order.farmer.farm_name} is now: {status_labels.get(new_status, new_status)}.",
            notification_type=Notification.Type.ORDER_UPDATE,
            link_url=f"/customer/orders/{order.id}"
        )

        return order

    @staticmethod
    def cancel_order_by_customer(order, user, reason=''):
        if order.customer != user:
            raise PermissionDenied("You can only cancel your own orders.")
        if order.status not in [Order.Status.PENDING, Order.Status.CONFIRMED]:
            raise ValidationError("This order cannot be cancelled as it is already being prepared or out for delivery.")

        order.cancellation_reason = reason
        return OrderService.update_order_status(order, Order.Status.CANCELLED, user)

