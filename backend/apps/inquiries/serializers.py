from rest_framework import serializers
from .models import Conversation, ChatMessage
from apps.farmers.serializers import FarmerSummarySerializer
from apps.products.serializers import ProductListSerializer


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_role', 'message', 'is_read', 'is_me', 'created_at']

    def get_is_me(self, obj):
        request = self.context.get('request')
        return request.user == obj.sender if request and request.user else False


class ConversationSerializer(serializers.ModelSerializer):
    farmer = FarmerSummarySerializer(read_only=True)
    product = ProductListSerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'customer', 'customer_name', 'farmer', 'product', 'subject', 'last_message', 'unread_count', 'last_message_at', 'created_at']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return ChatMessageSerializer(last, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1)
    farmer_id = serializers.UUIDField(required=False)
    product_id = serializers.UUIDField(required=False)
    subject = serializers.CharField(required=False, default='Produce Inquiry')

