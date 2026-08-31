from django.urls import path
from .views import (
    FarmerListView,
    FarmerDetailView,
    FarmerMapView,
    NearbyFarmersView,
    FarmerMyProfileView,
    FarmerVerificationSubmitView,
    AdminFarmerListView,
    AdminFarmerVerifyActionView,
)

urlpatterns = [
    # Public endpoints
    path('farmers/map/', FarmerMapView.as_view(), name='farmer-map'),
    path('farmers/nearby/', NearbyFarmersView.as_view(), name='farmer-nearby'),
    path('farmers/', FarmerListView.as_view(), name='farmer-list'),
    path('farmers/<slug:slug>/', FarmerDetailView.as_view(), name='farmer-detail'),

    # Farmer portal endpoints
    path('farmer/profile/', FarmerMyProfileView.as_view(), name='farmer-my-profile'),
    path('farmer/verification/', FarmerVerificationSubmitView.as_view(), name='farmer-verification-submit'),

    # Admin verification endpoints
    path('admin/farmers/', AdminFarmerListView.as_view(), name='admin-farmer-list'),
    path('admin/farmers/<uuid:pk>/verify/', AdminFarmerVerifyActionView.as_view(), name='admin-farmer-verify'),
]

