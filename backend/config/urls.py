from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from apps.core.analytics_views import (
    FarmerDashboardAnalyticsView,
    FarmerCustomerListView,
    AdminDashboardAnalyticsView
)

from rest_framework import permissions

class ProtectedSpectacularAPIView(SpectacularAPIView):
    def get_permissions(self):
        if not getattr(settings, 'DEBUG', False):
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class ProtectedSpectacularSwaggerView(SpectacularSwaggerView):
    def get_permissions(self):
        if not getattr(settings, 'DEBUG', False):
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class ProtectedSpectacularRedocView(SpectacularRedocView):
    def get_permissions(self):
        if not getattr(settings, 'DEBUG', False):
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

import os

ADMIN_URL = os.getenv('ADMIN_URL', 'farmer-direct-saleadmin').strip('/')

admin.site.site_header = "FarmerDirect • Enterprise Marketplace Admin"
admin.site.site_title = "FarmerDirect Admin Console"
admin.site.index_title = "Marketplace Operations & Operations Command"

def api_root(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'FarmerDirect Marketplace API',
        'version': '1.0.0',
        'api_v1_endpoints': {
            'products': '/api/v1/products/',
            'categories': '/api/v1/categories/',
            'farmers': '/api/v1/farmers/',
            'agri_weather': '/api/v1/ai/agri-weather/',
            'market_prices': '/api/v1/ai/market-prices/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path(f'{ADMIN_URL}/', admin.site.urls),

    # OpenAPI Schema & Interactive Docs (Gated in production)
    path('api/schema/', ProtectedSpectacularAPIView.as_view(), name='schema'),
    path('swagger/', ProtectedSpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', ProtectedSpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Endpoints
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.farmers.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.cart.urls')),
    path('api/v1/', include('apps.orders.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
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
