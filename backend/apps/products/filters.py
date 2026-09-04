import django_filters
from django.db.models import Q
from .models import Product


class ProductFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_full_text_search')
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
        fields = ['search', 'category', 'farmer', 'min_price', 'max_price', 'is_organic', 'is_featured', 'province', 'min_rating']

    def filter_full_text_search(self, queryset, name, value):
        if not value or not value.strip():
            return queryset

        query_str = value.strip()
        from django.db import connection

        if connection.vendor == 'postgresql':
            from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
            vector = (
                SearchVector('name', weight='A') +
                SearchVector('short_description', weight='B') +
                SearchVector('description', weight='C') +
                SearchVector('farmer__farm_name', weight='B')
            )
            search_query = SearchQuery(query_str, search_type='websearch') | SearchQuery(query_str, search_type='plain')
            return queryset.annotate(
                rank=SearchRank(vector, search_query)
            ).filter(
                Q(search_vector=search_query) | Q(rank__gte=0.05) | Q(name__icontains=query_str)
            ).order_by('-rank')
        else:
            # Fallback for SQLite / non-Postgres in unit tests and local dev
            return queryset.filter(
                Q(name__icontains=query_str) |
                Q(short_description__icontains=query_str) |
                Q(description__icontains=query_str) |
                Q(farmer__farm_name__icontains=query_str)
            )

    def filter_category(self, queryset, name, value):
        return queryset.filter(Q(category__slug=value) | Q(category__id=value) if len(value) == 36 else Q(category__slug=value))

    def filter_farmer(self, queryset, name, value):
        return queryset.filter(Q(farmer__slug=value) | Q(farmer__id=value) if len(value) == 36 else Q(farmer__slug=value))


