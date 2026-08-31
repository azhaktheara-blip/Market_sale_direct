from django.urls import path
from .views import FavoriteListView, ToggleFavoriteView

urlpatterns = [
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/toggle/', ToggleFavoriteView.as_view(), name='favorite-toggle'),
]

