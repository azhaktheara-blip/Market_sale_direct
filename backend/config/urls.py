from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
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


def health_check(request):
    """
    Minimal health check endpoint for uptime monitors, load balancers, and container probes.
    Returns status: ok only without leaking route maps or service internals.
    """
    return JsonResponse({'status': 'ok'})


def robots_txt(request):
    """
    Disallow all web crawlers from indexing API endpoints and the admin backend.
    """
    lines = [
        "User-agent: *",
        "Disallow: /",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")


urlpatterns = [
    path('', health_check, name='api-root'),
    path('health/', health_check, name='health-check'),
    path('robots.txt', robots_txt, name='robots-txt'),
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
    path('api/', include('apps.ai.urls')),

    # Analytics
    path('api/v1/farmer/dashboard/', FarmerDashboardAnalyticsView.as_view(), name='farmer-dashboard-analytics'),
    path('api/v1/farmer/customers/', FarmerCustomerListView.as_view(), name='farmer-customers'),
    path('api/v1/admin/dashboard/', AdminDashboardAnalyticsView.as_view(), name='admin-dashboard-analytics'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
