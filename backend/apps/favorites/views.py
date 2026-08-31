from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Favorite
from .serializers import FavoriteSerializer, ToggleFavoriteSerializer
from apps.products.models import Product
from apps.farmers.models import FarmerProfile


@extend_schema(tags=['Wishlist & Favorites'])
class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)\
            .select_related('product__farmer', 'farmer')\
            .prefetch_related('product__images')


@extend_schema(tags=['Wishlist & Favorites'])
class ToggleFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ToggleFavoriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data.get('product_id')
        farmer_id = serializer.validated_data.get('farmer_id')

        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

            fav, created = Favorite.objects.get_or_create(user=request.user, product=product)
            if not created:
                fav.delete()
                return Response({'status': 'removed', 'favorited': False, 'message': 'Removed product from favorites.'})
            return Response({'status': 'added', 'favorited': True, 'message': 'Added product to favorites.'}, status=status.HTTP_201_CREATED)

        elif farmer_id:
            try:
                farmer = FarmerProfile.objects.get(id=farmer_id)
            except FarmerProfile.DoesNotExist:
                return Response({'detail': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)

            fav, created = Favorite.objects.get_or_create(user=request.user, farmer=farmer)
            if not created:
                fav.delete()
                return Response({'status': 'removed', 'favorited': False, 'message': 'Unfollowed farm.'})
            return Response({'status': 'added', 'favorited': True, 'message': 'Followed farm.'}, status=status.HTTP_201_CREATED)

        return Response({'detail': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

