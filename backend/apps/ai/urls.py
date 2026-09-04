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
    VoiceInventoryAPIView,
    VisionGradeAPIView,
    PredictionsAPIView,
    AgriChatAPIView,
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

    # Farmer AI Suite endpoints (standard & v1 prefixes)
    path('ai-voice-inventory', VoiceInventoryAPIView.as_view(), name='ai-voice-inventory'),
    path('ai-voice-inventory/', VoiceInventoryAPIView.as_view(), name='ai-voice-inventory-slash'),
    path('ai-vision-grade', VisionGradeAPIView.as_view(), name='ai-vision-grade'),
    path('ai-vision-grade/', VisionGradeAPIView.as_view(), name='ai-vision-grade-slash'),
    path('predictions', PredictionsAPIView.as_view(), name='predictions'),
    path('predictions/', PredictionsAPIView.as_view(), name='predictions-slash'),
    path('ai-agri-chat', AgriChatAPIView.as_view(), name='ai-agri-chat'),
    path('ai-agri-chat/', AgriChatAPIView.as_view(), name='ai-agri-chat-slash'),
]

