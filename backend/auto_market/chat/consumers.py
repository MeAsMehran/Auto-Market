#
# import json
# from channels.generic.websocket import WebsocketConsumer
# from django.shortcuts import get_object_or_404
# from django.template.loader import render_to_string
#
# from chat.models import Conversation, Message    # this WebsocketConsumer is handling our websocket connection
#
#
# class ConversationConsumer(WebsocketConsumer):
#
#     def connect(self) -> None:
#         # self.user = self.scope.get('user')
#         self.user = self.scope['user']
#         self.conversation_id = self.scope['url_route']['kwargs']['conversation_id'] # 'conversation_id' is <int:conversation_id> in routing
#         self.conversation = get_object_or_404(Conversation, pk=self.conversation_id)
#         self.accept()
#
#     def receive(self, text_data) -> None:
#         text_data_json = json.loads(text_data)
#         message_text = text_data_json.get('message_text')
#
#         message = Message.objects.create(conversation=self.conversation, message_text=message_text, sender_user=self.user)
#
#         html = render_to_string()
#         self.send(text_data=html)
#
    # sender_user   = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender_user_messages')
    # receiver_user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver_user_messages')


"""
Chat WebSocket Consumer - Real-time messaging for car ad conversations.

Your setup:
- URL: ws://localhost:8000/ws/chat/<conversation_id>/
- Auth: via AuthMiddleware (sets self.scope['user'])
- Models: Conversation (buyer, seller, car_ad) and Message (conversation, sender, receiver, text)
"""

import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404

from .models import Conversation, Message

class ConversationConsumer(WebsocketConsumer):
    """
    WebSocket consumer for real-time chat.

    How it works:
    1. Client connects to: ws://.../ws/chat/<conversation_id>/
    2. We verify user is part of the conversation (buyer or seller)
    3. When message received → save to DB → broadcast to ALL clients in that conversation
    """

    """
    Concept:	                What It Does:

    room_group_name	            Groups all connections for the same conversation
    channel_layer.group_add	    Joins the group on connect
    channel_layer.group_send	Sends message to ALL clients in the group
    chat_message handler	    Receives the broadcast and sends to WebSocket
    async_to_sync	            Converts async channel operations to sync (required for sync consumer
    """

    def connect(self):
        """
        Called when client opens WebSocket connection.

        URL routing gives us:
        - self.scope['url_route']['kwargs']['conversation_id'] → from <int:conversation_id>
        - self.scope['user'] → authenticated user (from AuthMiddleware)
        """

        # STEP 1: Get conversation ID from URL (e.g., /ws/chat/5/)
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # STEP 2: Get the logged-in user (set by AuthMiddleware in asgi.py)
        self.user = self.scope.get('user')

        # STEP 3: Reject if not logged in
        if not self.user or not self.user.is_authenticated:
            self.close()
            return

        # STEP 4: Get the conversation and check if user is part of it
        self.conversation = get_object_or_404(Conversation, pk=self.conversation_id)

        # Only buyer or seller can join this chat. If user was none of buyer user and seller user then close the connection
        if self.user != self.conversation.buyer and self.user != self.conversation.seller:
            self.close()
            return

        # STEP 5: Create a group name for this conversation
        # All clients for this conversation join the same group
        # self.room_group_name = f"chat_{self.conversation_id}"
        self.conversation_name = f"chat_{self.conversation_id}"


        # STEP 6: Join the group (so we can receive messages)
        async_to_sync(self.channel_layer.group_add)(
            self.conversation_name,
            self.channel_name       # self.channel_name -> A unique string automatically assigned by Django Channels to each WebSocket connection.
        )

        # STEP 7: Accept the WebSocket connection
        self.accept()

    def disconnect(self, close_code):
        """
        Called when WebSocket closes.
        Always leave the group to avoid memory leaks!
        """

        """
        hasattr(): A simple Python built-in function that checks if an object has a certain attribute.
        Returns:
        True → if self has an attribute called conversation_name
        False → if it doesn't
        """
        if hasattr(self, 'conversation_name'):
            async_to_sync(self.channel_layer.group_discard)(
                self.conversation_name,
                self.channel_name
            )

    def receive(self, text_data):
        """
        Called when client sends a message.

        Expected JSON from client:
        {
            "message_text": "Hello, is this car still available?"
        }
        """
        # Parse JSON message
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
            return

        message_text = data.get('message_text', '').strip()

        # Validate message
        if not message_text:
            return

        if len(message_text) > 10000:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message too long'
            }))
            return

        # Determine who receives the message (the other person)
        if self.user == self.conversation.buyer:
            receiver = self.conversation.seller
        else:
            receiver = self.conversation.buyer

        # Save message to database
        message = Message.objects.create(
            conversation=self.conversation,
            sender_user=self.user,
            receiver_user=receiver,
            message_text=message_text,
            is_read=False
        )

        # Broadcast message to ALL clients in this conversation
        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'text': message.message_text,
                    'sender_id': self.user.id,
                    'sender_name': self.user.name,
                    'is_read': False,
                    'created_at': message.created_at.isoformat(),
                }
            }
        )

    def chat_message(self, event):
        """
        Handler for broadcasted messages.
        Sends the message to the WebSocket client.
        """
        self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))






