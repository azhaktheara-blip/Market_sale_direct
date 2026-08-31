from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from apps.core.analytics_views import (
    FarmerDashboardAnalyticsView,
    FarmerCustomerListView,
    AdminDashboardAnalyticsView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Endpoints
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.farmers.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.cart.urls')),
    path('api/v1/', include('apps.orders.urls')),
    path('api/v1/', include('apps.payments.urls')),
    path('api/v1/', include('apps.reviews.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.favorites.urls')),
    path('api/v1/', include('apps.inquiries.urls')),
    path('api/v1/', include('apps.ai.urls')),

    # Analytics
    path('api/v1/farmer/dashboard/', FarmerDashboardAnalyticsView.as_view(), name='farmer-dashboard-analytics'),
    path('api/v1/farmer/customers/', FarmerCustomerListView.as_view(), name='farmer-customers'),
    path('api/v1/admin/dashboard/', AdminDashboardAnalyticsView.as_view(), name='admin-dashboard-analytics'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
