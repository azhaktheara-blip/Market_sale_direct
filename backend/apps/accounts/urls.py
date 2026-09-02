from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CurrentUserView,
    AddressViewSet,
    VerifyEmailView,
    ResendVerificationEmailView,
    GoogleAuthView,
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('', include(router.urls)),
]

