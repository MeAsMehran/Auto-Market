"""
Chat WebSocket Consumer - Real-time messaging for car ad conversations.

Your setup:
- URL: ws://localhost:8000/ws/chat/<conversation_id>/
- Auth: via AuthMiddleware (sets self.scope['user'])
- Models: Conversation (buyer, seller, car_ad) and Message (conversation, sender, receiver, text)
"""

import json
import time
from collections import defaultdict
from django.db.models import Q
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404

from .models import Conversation, Message, MessageStatus


class RateLimiter:
    """
    Simple in-memory rate limiter for WebSocket messages.
    Tracks message counts per user within a sliding time window.
    """

    def __init__(self, max_messages=30, window_seconds=60):
        self.max_messages = max_messages
        self.window_seconds = window_seconds
        self.message_log = defaultdict(list)

    def is_allowed(self, user_id):
        now = time.time()
        cutoff = now - self.window_seconds

        self.message_log[user_id] = [
            ts for ts in self.message_log[user_id] if ts > cutoff
        ]

        if len(self.message_log[user_id]) >= self.max_messages:
            return False

        self.message_log[user_id].append(now)
        return True

    def cleanup(self, user_id):
        if user_id in self.message_log:
            del self.message_log[user_id]


rate_limiter = RateLimiter(max_messages=30, window_seconds=60)


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

        self.accept()

    def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user and hasattr(self.user, 'id'):
            rate_limiter.cleanup(self.user.id)
        if hasattr(self, 'conversation_name'):
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

        msg_type = data.get('type')

        if msg_type == 'ping':
            return

        if msg_type not in ('message_delivered', 'messages_seen', 'typing_start', 'typing_stop'):
            if not rate_limiter.is_allowed(self.user.id):
                self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Rate limit exceeded. Please slow down.'
                }))
                return

        if msg_type == 'message_delivered':
            self._handle_message_delivered(data)
            return

        if msg_type == 'messages_seen':
            self._handle_messages_seen(data)
            return

        if msg_type == 'typing_start':
            self._handle_typing(True)
            return

        if msg_type == 'typing_stop':
            self._handle_typing(False)
            return

        message_text = data.get('message_text', '').strip()
        client_message_id = data.get('client_message_id')

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
            status=MessageStatus.SENT,
            is_read=False
        )
        message.save()

        self.conversation.save()

        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'client_message_id': client_message_id,
                    'text': message.message_text,
                    'sender_id': self.user.id,
                    'sender_name': self.user.name,
                    'status': message.status,
                    'is_read': False,
                    'created_at': message.created_at.isoformat() if message.created_at else None,
                }
            }
        )

        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                'type': 'conversation_updated',
                'conversation': {
                    'id': self.conversation.id,
                    'updated_at': self.conversation.updated_at.isoformat() if self.conversation.updated_at else None,
                    'last_message': {
                        'id': message.id,
                        'message_text': message.message_text,
                        'created_at': message.created_at.isoformat() if message.created_at else None,
                    }
                }
            }
        )

    def _handle_message_delivered(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return

        try:
            message = Message.objects.get(
                id=message_id,
                receiver_user=self.user
            )
            if message.status == MessageStatus.SENT:
                message.status = MessageStatus.DELIVERED
                message.save(update_fields=['status'])

                async_to_sync(self.channel_layer.group_send)(
                    self.conversation_name,
                    {
                        'type': 'status_update',
                        'message_id': message.id,
                        'status': MessageStatus.DELIVERED,
                        'sender_id': message.sender_user_id,
                    }
                )
        except Message.DoesNotExist:
            pass

    def _handle_messages_seen(self, data):
        last_seen_id = data.get('last_seen_message_id')
        if not last_seen_id:
            return

        try:
            last_seen_message = Message.objects.get(id=last_seen_id, conversation=self.conversation)
        except Message.DoesNotExist:
            return

        updated_count = Message.objects.filter(
            conversation=self.conversation,
            receiver_user=self.user,
            status__in=[MessageStatus.SENT, MessageStatus.DELIVERED]
        ).exclude(
            id__gt=last_seen_id
        ).update(status=MessageStatus.SEEN, is_read=True)

        if updated_count > 0:
            async_to_sync(self.channel_layer.group_send)(
                self.conversation_name,
                {
                    'type': 'messages_seen_update',
                    'last_seen_id': last_seen_id,
                    'updated_count': updated_count,
                    'reader_id': self.user.id,
                }
            )

    def _handle_typing(self, is_typing):
        other_user = self.conversation.seller if self.user == self.conversation.buyer else self.conversation.buyer

        async_to_sync(self.channel_layer.group_send)(
            self.conversation_name,
            {
                'type': 'typing_update',
                'user_id': self.user.id,
                'is_typing': is_typing,
            }
        )

    def chat_message(self, event):
        self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    def status_update(self, event):
        self.send(text_data=json.dumps({
            'type': 'status_update',
            'message_id': event['message_id'],
            'status': event['status'],
            'sender_id': event['sender_id'],
        }))

    def conversation_updated(self, event):
        self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation': event['conversation'],
        }))

    def messages_seen_update(self, event):
        self.send(text_data=json.dumps({
            'type': 'messages_seen_update',
            'last_seen_id': event['last_seen_id'],
            'updated_count': event['updated_count'],
            'reader_id': event['reader_id'],
        }))

    def typing_update(self, event):
        self.send(text_data=json.dumps({
            'type': 'typing_update',
            'user_id': event['user_id'],
            'is_typing': event['is_typing'],
        }))
