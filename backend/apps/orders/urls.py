from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CheckoutView,
    CustomerOrderListView,
    OrderDetailView,
    CustomerCancelOrderView,
    FarmerOrderListView,
    FarmerUpdateOrderStatusView,
    AdminOrderListView,
    OrderInvoicePDFView,
    OrderPackingSlipPDFView,
    SubscriptionViewSet
)

router = DefaultRouter()
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    # Customer endpoints
    path('orders/checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('orders/', CustomerOrderListView.as_view(), name='customer-order-list'),
    path('orders/<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<uuid:pk>/cancel/', CustomerCancelOrderView.as_view(), name='customer-order-cancel'),
    path('orders/<uuid:pk>/invoice/', OrderInvoicePDFView.as_view(), name='order-invoice-pdf'),
    path('orders/<uuid:pk>/packing-slip/', OrderPackingSlipPDFView.as_view(), name='order-packing-slip-pdf'),

    # Farmer portal endpoints
    path('farmer/orders/', FarmerOrderListView.as_view(), name='farmer-order-list'),
    path('farmer/orders/<uuid:pk>/status/', FarmerUpdateOrderStatusView.as_view(), name='farmer-order-status-update'),

    # Admin oversight
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),

    # Subscriptions router
    path('', include(router.urls)),
]

