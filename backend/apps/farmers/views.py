from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import FarmerProfile, FarmerVerification
from .serializers import (
    FarmerPublicListSerializer,
    FarmerPublicDetailSerializer,
    FarmerProfileUpdateSerializer,
    FarmerVerificationSerializer
)
from apps.core.permissions import IsFarmer, IsAdminUserOnly
from apps.notifications.models import Notification


@extend_schema(tags=['Farmers (Public)'])
class FarmerListView(generics.ListAPIView):
    serializer_class = FarmerPublicListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['province', 'farming_practice', 'is_verified']
    search_fields = ['farm_name', 'bio', 'story', 'province', 'district']
    ordering_fields = ['rating_avg', 'years_of_experience', 'created_at']
    ordering = ['-is_verified', '-rating_avg']

    def get_queryset(self):
        return FarmerProfile.objects.all()\
            .select_related('user')


@extend_schema(tags=['Farmers (Public)'])
class FarmerDetailView(generics.RetrieveAPIView):
    queryset = FarmerProfile.objects.all()\
        .select_related('user')\
        .prefetch_related('products', 'products__images')
    serializer_class = FarmerPublicDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


@extend_schema(tags=['Farmer Portal'])
class FarmerMyProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FarmerProfileUpdateSerializer
        return FarmerPublicDetailSerializer

    def get_object(self):
        profile, created = FarmerProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'farm_name': f"{self.request.user.username}'s Farm",
                'province': 'Siem Reap',
                'bio': 'Locally grown fresh produce.',
                'story': 'We are passionate about sustainable agriculture.'
            }
        )
        return profile


@extend_schema(tags=['Farmer Portal'])
class FarmerVerificationSubmitView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    serializer_class = FarmerVerificationSerializer

    def perform_create(self, serializer):
        profile = self.request.user.farmer_profile
        profile.verification_status = FarmerProfile.VerificationStatus.PENDING
        profile.save(update_fields=['verification_status'])
        serializer.save(farmer=profile)


@extend_schema(tags=['Admin Portal'])
class AdminFarmerListView(generics.ListAPIView):
    queryset = FarmerProfile.objects.all().order_by('-created_at')
    serializer_class = FarmerPublicListSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_verified', 'verification_status', 'province']
    search_fields = ['farm_name', 'user__email', 'province']


@extend_schema(tags=['Admin Portal'])
class AdminFarmerVerifyActionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]

    def post(self, request, pk):
        try:
            farmer = FarmerProfile.objects.get(pk=pk)
        except FarmerProfile.DoesNotExist:
            return Response({'detail': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # 'approve' or 'reject'
        admin_notes = request.data.get('admin_notes', '')

        if action == 'approve':
            farmer.is_verified = True
            farmer.verification_status = FarmerProfile.VerificationStatus.APPROVED
            farmer.save(update_fields=['is_verified', 'verification_status'])

            # Send notification
            Notification.objects.create(
                user=farmer.user,
                title="Congratulations! Farm Verified ✓",
                message="Your farm has been officially verified by marketplace administrators. You now have the verified badge!",
                notification_type=Notification.Type.VERIFICATION,
                link_url="/farmer/profile"
            )
            return Response({'status': 'success', 'message': f'{farmer.farm_name} has been verified and approved.'})

        elif action == 'reject':
            farmer.is_verified = False
            farmer.verification_status = FarmerProfile.VerificationStatus.REJECTED
            farmer.save(update_fields=['is_verified', 'verification_status'])

import math


@extend_schema(tags=['Farmers (Public)'])
class FarmerMapView(APIView):
    """Returns all verified farms with geo-coordinates and active crop summaries for the interactive map."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        farmers = FarmerProfile.objects.filter(is_verified=True).prefetch_related('products')
        results = []
        for f in farmers:
            active_products = f.products.filter(status='ACTIVE')[:4]
            results.append({
                'id': str(f.id),
                'farm_name': f.farm_name,
                'slug': f.slug,
                'province': f.province,
                'district': f.district,
                'farming_practice': f.farming_practice,
                'rating_avg': str(f.rating_avg),
                'rating_count': f.rating_count,
                'latitude': float(f.latitude) if f.latitude else None,
                'longitude': float(f.longitude) if f.longitude else None,
                'bio': f.bio,
                'active_crop_count': f.products.filter(status='ACTIVE').count(),
                'sample_crops': [{'name': p.name, 'price': str(p.price), 'unit': p.unit} for p in active_products]
            })
        return Response(results)


@extend_schema(tags=['Farmers (Public)'])
class NearbyFarmersView(APIView):
    """Finds verified farms within a specified radius (km) of user coordinates."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            user_lat = float(request.query_params.get('lat', 11.5564)) # Default Phnom Penh
            user_lng = float(request.query_params.get('lng', 104.9282))
            radius_km = float(request.query_params.get('radius_km', 50.0))
        except ValueError:
            return Response({'detail': 'Invalid latitude, longitude, or radius.'}, status=status.HTTP_400_BAD_REQUEST)

        farmers = FarmerProfile.objects.filter(is_verified=True, latitude__isnull=False, longitude__isnull=False)
        nearby = []

        for f in farmers:
            lat = float(f.latitude)
            lng = float(f.longitude)
            # Haversine formula
            dlat = math.radians(lat - user_lat)
            dlon = math.radians(lng - user_lng)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(user_lat)) * math.cos(math.radians(lat)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist = round(6371.0 * c, 1)

            if dist <= radius_km:
                data = FarmerPublicListSerializer(f, context={'request': request}).data
                data['distance_km'] = dist
                # Dynamic delivery fee calculation: $2 base + $0.20 per km over 10km
                extra_km = max(0, dist - 10)
                data['estimated_delivery_fee'] = round(2.0 + (extra_km * 0.20), 2)
                nearby.append(data)

        nearby.sort(key=lambda x: x['distance_km'])
        return Response(nearby)

