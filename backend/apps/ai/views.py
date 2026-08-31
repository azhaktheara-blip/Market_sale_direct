from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema
from PIL import Image
from .services import (
    NaturalLanguageSearchService,
    ProduceDescriptionGeneratorService,
    RecommendationService,
    HarvestDemandForecastService,
)
from apps.products.services import ProductImageService
from apps.products.serializers import ProductListSerializer
from apps.core.permissions import IsFarmer


@extend_schema(tags=['AI Features'])
class SmartSearchView(APIView):
    """
    Parses natural language query strings (e.g. 'cheap tomatoes near Siem Reap')
    into structured filters and returns matching produce.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'detail': 'Query parameter q is required.'}, status=status.HTTP_400_BAD_REQUEST)

        parsed, products = NaturalLanguageSearchService.execute_smart_search(query)
        serializer = ProductListSerializer(products, many=True, context={'request': request})

        return Response({
            'query': query,
            'parsed_intent': parsed,
            'count': len(serializer.data),
            'results': serializer.data
        })


@extend_schema(tags=['AI Features'])
class GenerateDescriptionView(APIView):
    """
    Assists farmers by turning rough bullet points into an agency-quality produce story.
    """
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def post(self, request):
        crop_name = request.data.get('crop_name', '').strip()
        bullet_points = request.data.get('bullet_points', '').strip()
        farming_practice = request.data.get('farming_practice', 'ORGANIC')
        province = request.data.get('province', 'Siem Reap')

        if not crop_name:
            return Response({'detail': 'crop_name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        result = ProduceDescriptionGeneratorService.generate_description(
            crop_name=crop_name,
            bullet_points=bullet_points,
            farming_practice=farming_practice,
            province=province
        )
        return Response(result)


@extend_schema(tags=['AI Features'])
class ImageQualityCheckView(APIView):
    """
    Checks uploaded image for exposure and edge clarity to ensure high catalog quality.
    """
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'detail': 'No image file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pil_img = Image.open(image_file)
            diagnostics = ProductImageService.check_image_quality(pil_img)
            return Response(diagnostics)
        except Exception as e:
            return Response({'detail': f"Unable to process image: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['AI Features'])
class ProductRecommendationsView(APIView):
    """
    Returns complementary & similar produce recommendations for a product detail page.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        products = RecommendationService.get_related_products(product_id, limit=4)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


@extend_schema(tags=['AI Features'])
class ForYouRecommendationsView(APIView):
    """
    Returns personalized & seasonal crop recommendations.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = RecommendationService.get_for_you_recommendations(limit=6)
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


from .agri_services import (
    CropDiseaseDiagnosticService,
    AgriWeatherService,
    MarketPriceIntelligenceService,
)


@extend_schema(tags=['AI Features'])
class HarvestForecastingView(APIView):
    """
    Provides weekly crop demand predictions and seedling recommendations for farmers.
    """
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farmer = getattr(request.user, 'farmer_profile', None)
        forecast = HarvestDemandForecastService.forecast_demand_trends(farmer=farmer)
        return Response({
            'period': 'Upcoming 7 Days Forecast',
            'forecast': forecast
        })


@extend_schema(tags=['Agricultural Intelligence'])
class CropDiseaseScanView(APIView):
    """
    AI Crop & Leaf Doctor: Diagnoses diseases, fungal infections, and post-harvest spoilage.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        image_file = request.FILES.get('image')
        crop_name = request.data.get('crop_name', '')
        notes = request.data.get('notes', '')

        result = CropDiseaseDiagnosticService.diagnose_crop_issue(
            image_file=image_file,
            crop_name=crop_name,
            notes=notes
        )
        return Response(result)


from django.core.cache import cache


@extend_schema(tags=['Agricultural Intelligence'])
class AgriWeatherForecastView(APIView):
    """
    7-Day Agricultural Weather & Monsoon Rain Predictor with farm action alerts.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        province = request.query_params.get('province', 'Siem Reap')
        cache_key = f"agri_weather_{province.lower().replace(' ', '_')}"
        data = cache.get(cache_key)

        if not data:
            data = AgriWeatherService.get_7day_forecast(province=province)
            cache.set(cache_key, data, timeout=60 * 15)  # Cache for 15 minutes

        return Response(data)


@extend_schema(tags=['Agricultural Intelligence'])
class MarketPriceTrendsView(APIView):
    """
    Nationwide multi-province commodity price radar with price surge/drop indicators.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category = request.query_params.get('category', 'ALL')
        province = request.query_params.get('province', 'Siem Reap')
        cache_key = f"market_prices_{category.lower().replace(' ', '_')}_{province.lower().replace(' ', '_')}"
        data = cache.get(cache_key)

        if not data:
            data = MarketPriceIntelligenceService.get_market_intelligence(
                selected_category=category,
                user_province=province
            )
            cache.set(cache_key, data, timeout=60 * 10)  # Cache for 10 minutes

        return Response(data)


