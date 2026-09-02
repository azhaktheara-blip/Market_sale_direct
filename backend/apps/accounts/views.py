import logging
from rest_framework import generics, status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import models
from drf_spectacular.utils import extend_schema
from .models import Address, CustomerProfile
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileUpdateSerializer,
    AddressSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    GoogleAuthSerializer
)
from .utils import send_verification_email, verify_user_token
from apps.core.permissions import IsOwnerOrAdmin

logger = logging.getLogger(__name__)
User = get_user_model()


@extend_schema(tags=['Authentication'])
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(tags=['Authentication'])
class CustomTokenRefreshView(TokenRefreshView):
    pass


@extend_schema(tags=['Authentication'])
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        user_serializer = UserSerializer(user, context={'request': request})
        verification_required = getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False)

        if verification_required:
            send_verification_email(user, request=request)
            return Response({
                'status': 'success',
                'message': 'Registration successful. A verification link has been sent to your email address.',
                'requires_verification': True,
                'email': user.email,
                'user': user_serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            refresh = RefreshToken.for_user(user)
            return Response({
                'status': 'success',
                'message': 'Registration successful. Welcome to FarmerDirect!',
                'requires_verification': False,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'user': user_serializer.data
            }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Authentication'])
class VerifyEmailView(APIView):
    """
    Verifies user email using the signed token and base64 user pk.
    Upon successful verification, marks account active and issues JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']

        user = verify_user_token(uid, token)
        if not user:
            return Response({
                'status': 'error',
                'detail': 'Invalid, expired, or tampered email verification link.',
                'code': 'invalid_token'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified', 'updated_at'])

        # Auto-login upon successful verification
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user, context={'request': request})

        return Response({
            'status': 'success',
            'message': 'Email address verified successfully.',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Authentication'])
class ResendVerificationEmailView(APIView):
    """
    Resends email verification link to unverified users.
    Does not leak whether the email is registered to prevent account enumeration.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower().strip()

        try:
            user = User.objects.get(email__iexact=email)
            if not user.email_verified and user.auth_provider == User.AuthProvider.EMAIL:
                send_verification_email(user, request=request)
        except User.DoesNotExist:
            pass

        return Response({
            'status': 'success',
            'message': 'If an unverified account exists with that email address, a verification link has been sent.'
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Authentication'])
class GoogleAuthView(APIView):
    """
    Verifies Google OAuth ID Token server-side.
    Auto-creates customer accounts with email_verified=True and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        id_token_str = serializer.validated_data['id_token']

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
            id_info = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                client_id if client_id else None
            )

            email = id_info.get('email', '').lower().strip()
            sub = id_info.get('sub')
            name = id_info.get('name', '')
            email_verified = id_info.get('email_verified', True)

            if not email or not sub:
                return Response({'detail': 'Invalid Google profile payload.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error("Google token verification failed: %s", e)
            return Response({'detail': f'Google token verification failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user
        user = User.objects.filter(models.Q(email=email) | models.Q(google_sub=sub)).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                role=User.Role.CUSTOMER,
                email_verified=True,
                auth_provider=User.AuthProvider.GOOGLE,
                google_sub=sub
            )
            CustomerProfile.objects.create(
                user=user,
                business_name='',
                business_type=CustomerProfile.BusinessType.INDIVIDUAL
            )
        else:
            if not user.google_sub:
                user.google_sub = sub
            user.email_verified = True
            user.save(update_fields=['google_sub', 'email_verified', 'updated_at'])

        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user, context={'request': request})

        return Response({
            'status': 'success',
            'message': 'Google authentication successful.',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['User Profile'])
class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


@extend_schema(tags=['Addresses'])
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
