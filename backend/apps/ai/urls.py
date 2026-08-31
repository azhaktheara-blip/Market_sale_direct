from django.urls import path
from .views import (
    SmartSearchView,
    GenerateDescriptionView,
    ImageQualityCheckView,
    ProductRecommendationsView,
    ForYouRecommendationsView,
    HarvestForecastingView,
    CropDiseaseScanView,
    AgriWeatherForecastView,
    MarketPriceTrendsView,
)

urlpatterns = [
    path('ai/smart-search/', SmartSearchView.as_view(), name='ai-smart-search'),
    path('ai/generate-description/', GenerateDescriptionView.as_view(), name='ai-generate-description'),
    path('ai/check-image-quality/', ImageQualityCheckView.as_view(), name='ai-check-image-quality'),
    path('ai/recommendations/', ProductRecommendationsView.as_view(), name='ai-product-recommendations'),
    path('ai/for-you/', ForYouRecommendationsView.as_view(), name='ai-for-you'),
    path('ai/harvest-forecast/', HarvestForecastingView.as_view(), name='ai-harvest-forecast'),
    path('ai/diagnose-crop/', CropDiseaseScanView.as_view(), name='ai-diagnose-crop'),
    path('ai/agri-weather/', AgriWeatherForecastView.as_view(), name='ai-agri-weather'),
    path('ai/market-prices/', MarketPriceTrendsView.as_view(), name='ai-market-prices'),
]

