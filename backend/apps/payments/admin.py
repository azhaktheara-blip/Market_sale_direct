from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'payment_method', 'amount', 'status', 'transaction_id', 'paid_at')
    list_filter = ('payment_method', 'status', 'paid_at')
    search_fields = ('order__order_number', 'transaction_id')

