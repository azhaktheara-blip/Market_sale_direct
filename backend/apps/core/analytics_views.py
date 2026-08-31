from decimal import Decimal
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from drf_spectacular.utils import extend_schema
from apps.core.permissions import IsFarmer, IsAdminUserOnly
from apps.orders.models import Order, OrderItem
from apps.products.models import Product, Inventory
from apps.farmers.models import FarmerProfile
from django.contrib.auth import get_user_model

User = get_user_model()


@extend_schema(tags=['Farmer Portal'])
class FarmerDashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farmer = request.user.farmer_profile
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        orders = Order.objects.filter(farmer=farmer)
        active_orders = orders.exclude(status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])

        total_revenue = active_orders.aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')
        monthly_revenue = active_orders.filter(created_at__gte=thirty_days_ago).aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0.00')

        total_orders_count = orders.count()
        pending_orders_count = orders.filter(status=Order.Status.PENDING).count()
        preparing_orders_count = orders.filter(status__in=[Order.Status.CONFIRMED, Order.Status.PREPARING, Order.Status.READY]).count()
        delivered_orders_count = orders.filter(status=Order.Status.DELIVERED).count()

        # Products & Inventory stats
        farmer_products = Product.objects.filter(farmer=farmer)
        active_products_count = farmer_products.filter(status=Product.Status.ACTIVE).count()
        low_stock_count = Inventory.objects.filter(
            product__farmer=farmer,
            available_quantity__lte=F('low_stock_threshold')
        ).count()

        # Top 5 products by quantity sold
        top_products_data = OrderItem.objects.filter(
            order__farmer=farmer
        ).exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])\
         .values('product_name_snapshot', 'unit_snapshot')\
         .annotate(total_sold=Sum('quantity'), total_sales=Sum('subtotal'))\
         .order_by('-total_sold')[:5]

        # Recent 5 orders
        from apps.orders.serializers import OrderSerializer
        recent_orders = orders.select_related('customer', 'delivery').prefetch_related('items')[:5]

        return Response({
            'metrics': {
                'total_revenue': str(round(total_revenue, 2)),
                'monthly_revenue': str(round(monthly_revenue, 2)),
                'total_orders': total_orders_count,
                'pending_orders': pending_orders_count,
                'preparing_orders': preparing_orders_count,
                'delivered_orders': delivered_orders_count,
                'active_products': active_products_count,
                'low_stock_products': low_stock_count,
                'rating_avg': str(farmer.rating_avg),
                'rating_count': farmer.rating_count,
            },
            'top_products': list(top_products_data),
            'recent_orders': OrderSerializer(recent_orders, many=True).data
        })


@extend_schema(tags=['Farmer Portal'])
class FarmerCustomerListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsFarmer]

    def get(self, request):
        farmer = request.user.farmer_profile
        customers_data = Order.objects.filter(farmer=farmer)\
            .exclude(status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])\
            .values('customer__id', 'customer__username', 'customer__email', 'customer__phone_number')\
            .annotate(
                order_count=Count('id'),
                total_spent=Sum('total')
            ).order_by('-total_spent')

        return Response(list(customers_data))


@extend_schema(tags=['Admin Portal'])
class AdminDashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOnly]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Revenue & GMV
        all_orders = Order.objects.all()
        active_orders = all_orders.exclude(status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])

        gmv = active_orders.aggregate(Sum('total'))['total__sum'] or Decimal('0.00')
        monthly_gmv = active_orders.filter(created_at__gte=thirty_days_ago).aggregate(Sum('total'))['total__sum'] or Decimal('0.00')
        total_commission = active_orders.aggregate(Sum('marketplace_commission'))['marketplace_commission__sum'] or Decimal('0.00')

        # User breakdown
        total_users = User.objects.count()
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        total_farmers = User.objects.filter(role=User.Role.FARMER).count()
        pending_verifications = FarmerProfile.objects.filter(verification_status=FarmerProfile.VerificationStatus.PENDING).count()
        verified_farmers = FarmerProfile.objects.filter(is_verified=True).count()

        # Product breakdown
        total_products = Product.objects.count()
        active_products = Product.objects.filter(status=Product.Status.ACTIVE).count()

        # Top performing farmers
        top_farmers = FarmerProfile.objects.annotate(
            total_orders=Count('orders', filter=~Q(orders__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])),
            total_revenue=Sum('orders__subtotal', filter=~Q(orders__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED]))
        ).order_by('-total_revenue')[:5].values('id', 'farm_name', 'province', 'is_verified', 'rating_avg', 'total_orders', 'total_revenue')

        from apps.orders.serializers import OrderSerializer
        recent_orders = all_orders.select_related('customer', 'farmer', 'delivery')[:8]

        return Response({
            'metrics': {
                'total_gmv': str(round(gmv, 2)),
                'monthly_gmv': str(round(monthly_gmv, 2)),
                'total_commission': str(round(total_commission, 2)),
                'total_orders': all_orders.count(),
                'total_users': total_users,
                'total_customers': total_customers,
                'total_farmers': total_farmers,
                'verified_farmers': verified_farmers,
                'pending_verifications': pending_verifications,
                'total_products': total_products,
                'active_products': active_products,
            },
            'top_farmers': list(top_farmers),
            'recent_orders': OrderSerializer(recent_orders, many=True).data
        })

