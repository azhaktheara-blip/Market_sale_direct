from django.urls import path
from .views import ConversationListView, ConversationDetailMessagesView, StartConversationView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', StartConversationView.as_view(), name='conversation-start'),
    path('conversations/<uuid:pk>/', ConversationDetailMessagesView.as_view(), name='conversation-detail-messages'),
]

