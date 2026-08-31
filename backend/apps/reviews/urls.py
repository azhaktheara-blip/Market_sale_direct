from django.urls import path
from .views import (
    ProductReviewListView,
    FarmerReviewListView,
    CreateReviewView,
    AdminReviewListView,
    AdminReviewModerateView,
)

urlpatterns = [
    path('reviews/product/<uuid:product_id>/', ProductReviewListView.as_view(), name='product-review-list'),
    path('reviews/farmer/<uuid:farmer_id>/', FarmerReviewListView.as_view(), name='farmer-review-list'),
    path('reviews/', CreateReviewView.as_view(), name='create-review'),
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/reviews/<uuid:pk>/moderate/', AdminReviewModerateView.as_view(), name='admin-review-moderate'),
]

