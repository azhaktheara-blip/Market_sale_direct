from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'farmer', 'created_at')
    search_fields = ('user__email', 'product__name', 'farmer__farm_name')

