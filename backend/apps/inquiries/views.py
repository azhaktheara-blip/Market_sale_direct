from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Conversation, ChatMessage
from .serializers import ConversationSerializer, ChatMessageSerializer, SendMessageSerializer
from apps.farmers.models import FarmerProfile
from apps.products.models import Product


@extend_schema(tags=['Inquiries & Chat'])
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
            return Conversation.objects.filter(farmer=user.farmer_profile).select_related('customer', 'farmer', 'product').prefetch_related('messages')
        return Conversation.objects.filter(customer=user).select_related('customer', 'farmer', 'product').prefetch_related('messages')


@extend_schema(tags=['Inquiries & Chat'])
class ConversationDetailMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        try:
            if user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
                conv = Conversation.objects.select_related('customer', 'farmer', 'product').get(pk=pk, farmer=user.farmer_profile)
            else:
                conv = Conversation.objects.select_related('customer', 'farmer', 'product').get(pk=pk, customer=user)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Mark messages as read
        conv.messages.filter(is_read=False).exclude(sender=user).update(is_read=True)

        messages = conv.messages.select_related('sender').order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'conversation': ConversationSerializer(conv, context={'request': request}).data,
            'messages': serializer.data
        })

    def post(self, request, pk):
        user = request.user
        try:
            if user.role == 'FARMER' and hasattr(user, 'farmer_profile'):
                conv = Conversation.objects.get(pk=pk, farmer=user.farmer_profile)
            else:
                conv = Conversation.objects.get(pk=pk, customer=user)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('message', '').strip()
        if not text:
            return Response({'detail': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            conversation=conv,
            sender=user,
            message=text
        )
        conv.save() # Update last_message_at

        return Response(ChatMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Inquiries & Chat'])
class StartConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        farmer_id = data.get('farmer_id')
        product_id = data.get('product_id')
        product = None

        if product_id:
            try:
                product = Product.objects.select_related('farmer').get(id=product_id)
                farmer = product.farmer
            except Product.DoesNotExist:
                return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        elif farmer_id:
            try:
                farmer = FarmerProfile.objects.get(id=farmer_id)
            except FarmerProfile.DoesNotExist:
                return Response({'detail': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'detail': 'Either farmer_id or product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        conv, _ = Conversation.objects.get_or_create(
            customer=request.user,
            farmer=farmer,
            product=product,
            defaults={'subject': data.get('subject', f"Inquiry about {product.name if product else farmer.farm_name}")}
        )

        msg = ChatMessage.objects.create(
            conversation=conv,
            sender=request.user,
            message=data['message']
        )
        conv.save()

        return Response({
            'status': 'success',
            'conversation_id': str(conv.id),
            'message': ChatMessageSerializer(msg, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

