from django.urls import path
from .views import (
    InitiatePaymentView,
    VerifyPaymentView,
    SimulatePaymentSuccessView,
    ABAPayWayWebhookView,
    TransactionListView,
)

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='payment-transactions'),
    path('<uuid:order_id>/initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('<uuid:order_id>/verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('<uuid:order_id>/simulate-success/', SimulatePaymentSuccessView.as_view(), name='payment-simulate'),
    path('webhooks/aba-payway/', ABAPayWayWebhookView.as_view(), name='aba-payway-webhook'),
]

