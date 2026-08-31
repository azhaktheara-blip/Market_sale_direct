from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Review
from .serializers import ReviewSerializer, CreateReviewSerializer
from apps.orders.models import OrderItem
from apps.core.permissions import IsAdminUserOnly


@extend_schema(tags=['Reviews'])
class ProductReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return Review.objects.filter(product_id=product_id, is_approved=True)\
            .select_related('customer', 'product', 'farmer')


@extend_schema(tags=['Reviews'])
class FarmerReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        farmer_id = self.kwargs['farmer_id']
        return Review.objects.filter(farmer_id=farmer_id, is_approved=True)\
            .select_related('customer', 'product', 'farmer')


@extend_schema(tags=['Reviews'])
class CreateReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateReviewSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        order_item = OrderItem.objects.select_related('order__farmer', 'product').get(
            id=serializer.validated_data['order_item_id']
        )

        review = Review.objects.create(
            product=order_item.product,
            farmer=order_item.order.farmer,
            customer=request.user,
            order_item=order_item,
            rating=serializer.validated_data['rating'],
            title=serializer.validated_data['title'],
            comment=serializer.validated_data['comment'],
            image=serializer.validated_data.get('image', None),
            is_approved=True
        )

        return Response({
            'status': 'success',
            'message': 'Thank you! Your verified review has been published.',
            'review': ReviewSerializer(review, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin Portal'])
class AdminReviewListView(generics.ListAPIView):
    queryset = Review.objects.all().select_related('customer', 'product', 'farmer').order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_approved', 'rating']


@extend_schema(tags=['Admin Portal'])
class AdminReviewModerateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]

    def patch(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_approved = request.data.get('is_approved')
        if is_approved is not None:
            review.is_approved = bool(is_approved)
            review.save()
            return Response({'status': 'success', 'is_approved': review.is_approved})

        return Response({'detail': 'is_approved field is required.'}, status=status.HTTP_400_BAD_REQUEST)

