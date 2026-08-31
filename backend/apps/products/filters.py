import django_filters
from django.db.models import Q
from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_category')
    farmer = django_filters.CharFilter(method='filter_farmer')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    is_organic = django_filters.BooleanFilter(field_name='is_organic')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    province = django_filters.CharFilter(field_name='farmer__province', lookup_expr='icontains')
    min_rating = django_filters.NumberFilter(field_name='rating_avg', lookup_expr='gte')

    class Meta:
        model = Product
        fields = ['category', 'farmer', 'min_price', 'max_price', 'is_organic', 'is_featured', 'province', 'min_rating']

    def filter_category(self, queryset, name, value):
        return queryset.filter(Q(category__slug=value) | Q(category__id=value) if len(value) == 36 else Q(category__slug=value))

    def filter_farmer(self, queryset, name, value):
        return queryset.filter(Q(farmer__slug=value) | Q(farmer__id=value) if len(value) == 36 else Q(farmer__slug=value))

