from django.urls import path
from .views import (
    CartDetailView,
    CartItemAddView,
    CartItemUpdateDeleteView,
    CartClearView
)

urlpatterns = [
    path('cart/', CartDetailView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('cart/items/<uuid:item_id>/', CartItemUpdateDeleteView.as_view(), name='cart-item-update-delete'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
]

