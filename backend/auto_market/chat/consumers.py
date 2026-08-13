"""
Chat WebSocket Consumer - Real-time messaging for car ad conversations.

Your setup:
- URL: ws://localhost:8000/ws/chat/<conversation_id>/
- Auth: via AuthMiddleware (sets self.scope['user'])
- Models: Conversation (buyer, seller, car_ad) and Message (conversation, sender, receiver, text)
"""

import json
from django.db.models import Q
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404

from .models import Conversation, Message
from core.presence import presence_service


class ConversationConsumer(WebsocketConsumer):
    """
    WebSocket consumer for real-time chat.

    How it works:
    1. Client connects to: ws://.../ws/chat/<conversation_id>/
    2. We verify user is part of the conversation (buyer or seller)
    3. When message received → save to DB → broadcast to ALL clients in that conversation
    """

    def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            self.close()
            return

        self.conversation = get_object_or_404(
            Conversation.objects.select_related('car_ad', 'buyer', 'seller'),
            Q(seller=self.user) | Q(buyer=self.user),
            pk=self.conversation_id
        )

        self.conversation_name = f"chat_{self.conversation_id}"

        async_to_sync(self.channel_layer.group_add)(
            self.conversation_name,
            self.channel_name
        )

        presence_service.set_user_online(self.user.id)

        other_user = self.conversation.seller if self.user == self.conversation.buyer else self.conversation.buyer
        is_other_online = presence_service.is_user_online(other_user.id)

        self.accept()

        self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': other_user.id,
            'is_online': is_other_online,
        }))

        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                'type': 'presence_broadcast',
                'user_id': self.user.id,
                'is_online': True,
            }
        )

    def disconnect(self, close_code):
        if hasattr(self, 'conversation') and hasattr(self, 'user') and self.user:
            presence_service.set_user_offline(self.user.id)

            if hasattr(self, 'conversation_name'):
                async_to_sync(self.channel_layer.group_send)(
                    self.conversation_name,
                    {
                        'type': 'presence_broadcast',
                        'user_id': self.user.id,
                        'is_online': False,
                    }
                )

                async_to_sync(self.channel_layer.group_discard)(
                    self.conversation_name,
                    self.channel_name
                )

    def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
            return

        if data.get('type') == 'ping':
            presence_service.refresh_user_presence(self.user.id)
            return

        message_text = data.get('message_text', '').strip()

        if not message_text:
            return

        if len(message_text) > 10000:
            self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message too long'
            }))
            return

        if self.user == self.conversation.buyer:
            receiver = self.conversation.seller
        else:
            receiver = self.conversation.buyer

        message = Message(
            conversation=self.conversation,
            sender_user=self.user,
            receiver_user=receiver,
            message_text=message_text,
            is_read=False
        )
        message.save()

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
                    'created_at': message.created_at.isoformat() if message.created_at else None,
                }
            }
        )

    def chat_message(self, event):
        self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    def presence_broadcast(self, event):
        self.send(text_data=json.dumps({
            'type': 'presence_update',
            'user_id': event['user_id'],
            'is_online': event['is_online'],
        }))
