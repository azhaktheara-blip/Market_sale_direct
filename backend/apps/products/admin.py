from django.contrib import admin
from .models import Category, Product, ProductImage, Inventory


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class InventoryInline(admin.StackedInline):
    model = Inventory
    can_delete = False


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'display_order', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'category', 'price', 'unit', 'status', 'is_organic', 'is_featured', 'rating_avg')
    list_filter = ('status', 'is_organic', 'is_featured', 'category')
    search_fields = ('name', 'farmer__farm_name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, InventoryInline]


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'available_quantity', 'reserved_quantity', 'low_stock_threshold', 'last_restocked_at')
    search_fields = ('product__name', 'product__farmer__farm_name')

