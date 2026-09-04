from rest_framework import serializers
from .models import Payment, PaymentTransaction


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'payment_method', 'status', 'transaction_id', 'amount', 'paid_at', 'payment_gateway_response']
        read_only_fields = fields


class PaymentTransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    customer_account_id = serializers.CharField(source='customer.account_id', read_only=True)
    farmer_farm_name = serializers.CharField(source='farmer.farm_name', read_only=True)
    farmer_account_id = serializers.CharField(source='farmer.account_id', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'transaction_id', 'order', 'order_number',
            'customer_email', 'customer_account_id',
            'farmer_farm_name', 'farmer_account_id',
            'gross_amount', 'subtotal', 'delivery_fee',
            'commission_rate_percentage', 'platform_commission', 'farmer_net_payout',
            'currency', 'payment_method', 'qr_payload',
            'bank_name', 'bank_account_name', 'bank_account_number', 'bakong_account_id',
            'status', 'settled_at', 'created_at'
        ]
        read_only_fields = fields
