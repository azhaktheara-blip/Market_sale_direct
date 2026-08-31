from django.contrib import admin
from .models import Order, OrderItem, Delivery


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name_snapshot', 'unit_snapshot', 'unit_price_snapshot', 'quantity', 'subtotal')


class DeliveryInline(admin.StackedInline):
    model = Delivery
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'farmer', 'status', 'total', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'customer__email', 'farmer__farm_name')
    inlines = [OrderItemInline, DeliveryInline]

