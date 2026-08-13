from django.urls import path
from .consumers import ConversationConsumer

websocket_urlpatterns = [

    # ws for websocket
    # re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),     -> we used regex for pathing
    # consumers.ChatConsumer.as_asgi() -> like views.SomethingView.as_view()
    path("ws/chat/<int:conversation_id>/", ConversationConsumer.as_asgi()),
    # path("ws/online-status/", OnlineStatusConsumer.as_asgi()),
]

