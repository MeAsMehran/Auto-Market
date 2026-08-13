
from django.urls         import path
from .views.conversation import CreateConversationView, GetConversationView, ListConversationsView, DeleteConversationView, UserPresenceView
from .views.message      import SendMessageView, ReceiveMessageView, RetrieveMessagesView


urlpatterns = [

    path('conversation/create/', CreateConversationView.as_view(), name='create-conversation'),
    path('conversation/delete/<int:conversation_id>/', DeleteConversationView.as_view(), name='delete-conversation'),
    path('conversation/<int:conversation_id>/', GetConversationView.as_view(), name='get-conversation'),
    path('conversation/list/', ListConversationsView.as_view(), name='list-conversations'),
    path('conversation/<int:conversation_id>/messages/', RetrieveMessagesView.as_view(), name='conversation-messages'),
    path('conversation/<int:conversation_id>/message/', SendMessageView.as_view(), name='send-message'),
    path('presence/users/', UserPresenceView.as_view(), name='user-presence'),

]

