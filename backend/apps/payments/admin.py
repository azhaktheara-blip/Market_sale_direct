from django.contrib import admin
from .models import Payment, PaymentTransaction, ProcessedWebhook


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'payment_method', 'amount', 'status', 'transaction_id', 'paid_at')
    list_filter = ('payment_method', 'status', 'paid_at')
    search_fields = ('order__order_number', 'transaction_id')


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'order', 'gross_amount', 'platform_commission', 'farmer_net_payout', 'bank_name', 'status', 'settled_at')
    list_filter = ('status', 'payment_method', 'bank_name', 'created_at')
    search_fields = ('transaction_id', 'order__order_number', 'customer__email', 'farmer__farm_name')
    readonly_fields = ('transaction_id', 'order', 'payment', 'customer', 'farmer', 'gross_amount', 'subtotal', 'delivery_fee', 'commission_rate_percentage', 'platform_commission', 'farmer_net_payout', 'settled_at', 'created_at', 'updated_at')


@admin.register(ProcessedWebhook)
class ProcessedWebhookAdmin(admin.ModelAdmin):
    list_display = ('provider', 'event_id', 'processed_at')
    search_fields = ('provider', 'event_id')


