from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    SeasonalCalendarView,
    FarmerProductViewSet,
    FarmerInventoryUpdateView,
    AdminCategoryViewSet,
    ProductImageUploadView,
    ProductImageDetailView,
    ProductImageSetPrimaryView,
)

farmer_router = DefaultRouter()
farmer_router.register(r'farmer/products', FarmerProductViewSet, basename='farmer-product')

admin_router = DefaultRouter()
admin_router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')

urlpatterns = [
    # Public endpoints
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/seasonal-calendar/', SeasonalCalendarView.as_view(), name='seasonal-calendar'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),

    # Farmer portal image & inventory management
    path('farmer/products/<uuid:product_id>/images/', ProductImageUploadView.as_view(), name='farmer-product-image-upload'),
    path('farmer/products/<uuid:product_id>/images/<uuid:image_id>/', ProductImageDetailView.as_view(), name='farmer-product-image-delete'),
    path('farmer/products/<uuid:product_id>/images/<uuid:image_id>/set-primary/', ProductImageSetPrimaryView.as_view(), name='farmer-product-image-set-primary'),
    path('farmer/inventory/<uuid:product_id>/', FarmerInventoryUpdateView.as_view(), name='farmer-inventory-update'),
    path('', include(farmer_router.urls)),
    path('', include(admin_router.urls)),
]

