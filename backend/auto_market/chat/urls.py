
from django.urls import path
from .views.conversation import CreateConversationView, GetConversationView, ListConversationsView, DeleteConversationView


urlpatterns = [

    # Conversation Views:
    path('conversation/create/', CreateConversationView.as_view(), name='create-conversation'),
    path('conversation/delete/<int:conversation_id>/', DeleteConversationView.as_view(), name='delete-conversation'),
    path('conversation/<int:conversation_id>/', GetConversationView.as_view(), name='get-conversation'),
    path('conversation/list/', ListConversationsView.as_view(), name='list-conversations'),

]

