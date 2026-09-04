from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Category, Product, ProductImage, Inventory
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    InventoryUpdateSerializer,
    ProductImageSerializer
)
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .filters import ProductFilter
from apps.core.permissions import IsFarmer, IsAdminUserOnly


@extend_schema(tags=['Categories'])
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes in-memory
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)


@extend_schema(tags=['Products (Public)'])
class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ['price', 'created_at', 'rating_avg', 'harvest_date']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(status=Product.Status.ACTIVE)\
            .select_related('farmer', 'farmer__user', 'category', 'inventory')\
            .prefetch_related('images')


@extend_schema(tags=['Products (Public)'])
class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()\
        .select_related('farmer', 'farmer__user', 'category', 'inventory')\
        .prefetch_related('images', 'reviews', 'reviews__customer')
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


@extend_schema(tags=['Farmer Portal'])
class FarmerProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Product.objects.filter(farmer=self.request.user.farmer_profile)\
            .select_related('category', 'inventory')\
            .prefetch_related('images')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer


@extend_schema(tags=['Farmer Portal'])
class FarmerInventoryUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def patch(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, farmer=request.user.farmer_profile)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        inventory, _ = Inventory.objects.get_or_create(product=product)
        serializer = InventoryUpdateSerializer(inventory, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update product status automatically if stock reaches 0
        if inventory.available_quantity <= 0 and product.status == Product.Status.ACTIVE:
            product.status = Product.Status.OUT_OF_STOCK
            product.save(update_fields=['status'])
        elif inventory.available_quantity > 0 and product.status == Product.Status.OUT_OF_STOCK:
            product.status = Product.Status.ACTIVE
            product.save(update_fields=['status'])

        return Response({
            'status': 'success',
            'available_quantity': str(inventory.available_quantity),
            'low_stock_threshold': str(inventory.low_stock_threshold),
            'product_status': product.status
        })


@extend_schema(tags=['Admin Portal'])
class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]


@extend_schema(tags=['Products (Public)'])
class SeasonalCalendarView(APIView):
    """Returns 12-month Cambodian harvest crop matrix."""
    permission_classes = [permissions.AllowAny]

    CACHE_KEY = 'seasonal_calendar_v1'
    CACHE_TTL = 15 * 60  # 15 minutes

    def get(self, request):
        from django.core.cache import cache

        cached_data = cache.get(self.CACHE_KEY)
        if cached_data is not None:
            return Response(cached_data)

        months = [
            {'month': 1, 'name': 'January', 'season': 'Cool Dry Season', 'focus': 'Leafy greens, sweet oranges, morning glory, heritage rice'},
            {'month': 2, 'name': 'February', 'season': 'Cool Dry Season', 'focus': 'Watermelons, Kampot black pepper harvest, tomatoes, cucumbers'},
            {'month': 3, 'name': 'March', 'season': 'Early Hot Season', 'focus': 'Jackfruit, cashew nuts, fresh turmeric, baby corn'},
            {'month': 4, 'name': 'April', 'season': 'Hot Season (Khmer New Year)', 'focus': 'Keo Romeat mangoes, passion fruit, fresh coconuts'},
            {'month': 5, 'name': 'May', 'season': 'Early Wet Season', 'focus': 'Kampot durian, mangosteen, rambutan, lemongrass'},
            {'month': 6, 'name': 'June', 'season': 'Wet Monsoon Season', 'focus': 'Dragon fruit, sweet longan, bitter melon, yardlong beans'},
            {'month': 7, 'name': 'July', 'season': 'Wet Monsoon Season', 'focus': 'Papaya, pineapple, morning glory, fresh ginger'},
            {'month': 8, 'name': 'August', 'season': 'Mid Wet Season', 'focus': 'Sweet potatoes, taro root, organic chili, bok choy'},
            {'month': 9, 'name': 'September', 'season': 'Mid Wet Season', 'focus': 'Mondulkiri arabica coffee cherries, raw forest honey, pomelo'},
            {'month': 10, 'name': 'October', 'season': 'Late Wet Season (Pchum Ben)', 'focus': 'Kratie grapefruits/pomelo, sticky rice, palm sugar'},
            {'month': 11, 'name': 'November', 'season': 'Harvest Season (Water Festival)', 'focus': 'Phka Rumduol Jasmine Rice main harvest, Kampot red pepper'},
            {'month': 12, 'name': 'December', 'season': 'Cool Dry Season', 'focus': 'New crop fragrant rice, organic cabbage, cauliflower, baby carrots'},
        ]

        products = Product.objects.filter(status=Product.Status.ACTIVE).select_related('farmer', 'category')
        calendar_data = []

        for m in months:
            m_num = m['month']
            # Find products whose peak_season_months include this month or harvest_date falls in this month
            matching = [
                ProductListSerializer(p, context={'request': request}).data
                for p in products
                if (isinstance(p.peak_season_months, list) and m_num in p.peak_season_months)
                or (p.harvest_date and p.harvest_date.month == m_num)
            ]
            calendar_data.append({
                **m,
                'featured_products': matching[:6],
                'total_crops': len(matching)
            })

        cache.set(self.CACHE_KEY, calendar_data, self.CACHE_TTL)
        return Response(calendar_data)


@extend_schema(tags=['Product Images'])
class ProductImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, farmer=request.user.farmer_profile)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found or not owned by you.'}, status=status.HTTP_404_NOT_FOUND)

        files = request.FILES.getlist('images') or [request.FILES.get('image')]
        files = [f for f in files if f is not None]

        if not files:
            return Response({'detail': 'No image files provided in request.'}, status=status.HTTP_400_BAD_REQUEST)

        created_images = []
        quality_reports = []

        from .services import ProductImageService
        from .tasks import process_product_image_task
        is_first = not product.images.exists()

        for idx, f in enumerate(files):
            try:
                img_instance = ProductImageService.create_pending_image(
                    product=product,
                    uploaded_file=f,
                    is_primary=is_first and (idx == 0),
                    alt_text=request.data.get('alt_text', f"{product.name} produce photo")
                )
                process_product_image_task.delay(str(img_instance.id))
                created_images.append(ProductImageSerializer(img_instance).data)
            except Exception as e:
                return Response({'detail': f"Image upload error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'status': 'processing',
            'images': created_images,
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Product Images'])
class ProductImageDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def delete(self, request, product_id, image_id):
        try:
            product = Product.objects.get(id=product_id, farmer=request.user.farmer_profile)
            img = ProductImage.objects.get(id=image_id, product=product)
        except (Product.DoesNotExist, ProductImage.DoesNotExist):
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

        was_primary = img.is_primary
        img.delete()

        # If deleted image was primary, assign next available image as primary
        if was_primary:
            next_img = product.images.first()
            if next_img:
                next_img.is_primary = True
                next_img.save(update_fields=['is_primary'])

        return Response({'status': 'deleted', 'remaining_images_count': product.images.count()}, status=status.HTTP_200_OK)


@extend_schema(tags=['Product Images'])
class ProductImageSetPrimaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def post(self, request, product_id, image_id):
        try:
            product = Product.objects.get(id=product_id, farmer=request.user.farmer_profile)
            img = ProductImage.objects.get(id=image_id, product=product)
        except (Product.DoesNotExist, ProductImage.DoesNotExist):
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

        img.is_primary = True
        img.save()

        return Response({
            'status': 'success',
            'primary_image_id': str(img.id),
            'thumbnail_url': img.thumbnail_url
        })


