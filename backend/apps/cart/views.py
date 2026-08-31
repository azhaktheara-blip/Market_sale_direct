from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema
from .services import CartService
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer


@extend_schema(tags=['Cart'])
class CartDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = CartService.get_or_create_cart(request)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


@extend_schema(tags=['Cart'])
class CartItemAddView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request)
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        CartService.add_item(cart, product_id, quantity)
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'status': 'success',
            'message': 'Item added to cart.',
            'cart': cart_serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Cart'])
class CartItemUpdateDeleteView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request)
        quantity = serializer.validated_data['quantity']

        CartService.update_item(cart, item_id, quantity)
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'status': 'success',
            'message': 'Cart updated.',
            'cart': cart_serializer.data
        })

    def delete(self, request, item_id):
        cart = CartService.get_or_create_cart(request)
        CartService.remove_item(cart, item_id)
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'status': 'success',
            'message': 'Item removed from cart.',
            'cart': cart_serializer.data
        })


@extend_schema(tags=['Cart'])
class CartClearView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request):
        cart = CartService.get_or_create_cart(request)
        CartService.clear_cart(cart)
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'status': 'success',
            'message': 'Cart cleared.',
            'cart': cart_serializer.data
        })

