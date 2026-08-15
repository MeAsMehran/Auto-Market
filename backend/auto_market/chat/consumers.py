"""
Chat WebSocket Consumer - Real-time messaging for car ad conversations.

Your setup:
- URL: ws://localhost:8000/ws/chat/<conversation_id>/
- Auth: via AuthMiddleware (sets self.scope['user'])
- Models: Conversation (buyer, seller, car_ad) and Message (conversation, sender, receiver, text)
"""

import json
import time
import logging
import redis

from django.db.models import Q
from django.shortcuts import get_object_or_404

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Conversation, Message, MessageStatus

logger = logging.getLogger('auto_market.chat')


class RateLimiter:
    """
    Redis-backed rate limiter for WebSocket messages using redis-py directly.
    Tracks message counts per user within a sliding time window.
    """

    def __init__(self, max_messages=5, window_seconds=60):
        self.max_messages = max_messages
        self.window_seconds = window_seconds
        self.key_prefix = "ratelimit:ws"
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            db=0,
            decode_responses=True
        )

    def _get_key(self, user_id):
        return f"{self.key_prefix}:{user_id}"

    def is_allowed(self, user_id):
        now = time.time()
        cutoff = now - self.window_seconds
        key = self._get_key(user_id)

        timestamps = self.redis_client.lrange(key, 0, -1)
        timestamps = [float(ts) for ts in timestamps if float(ts) > cutoff]

        if len(timestamps) >= self.max_messages:
            oldest_timestamp = min(timestamps) if timestamps else now
            retry_after = int(oldest_timestamp + self.window_seconds - now) + 1
            return False, retry_after

        self.redis_client.rpush(key, now)
        self.redis_client.expire(key, self.window_seconds + 1)
        return True, 0

    def cleanup(self, user_id):
        self.redis_client.delete(self._get_key(user_id))

# Set the message rate limit for users which controls him/her not to send more than 70 message in a row(refresh the counter after 60 seconds)
rate_limiter = RateLimiter(max_messages=50, window_seconds=60)


class ConversationConsumer(AsyncWebsocketConsumer):
    """
    Async WebSocket consumer for real-time chat.

    How it works:
    1. Client connects to: ws://.../ws/chat/<conversation_id>/
    2. We verify user is part of the conversation (buyer or seller)
    3. When message received → save to DB → broadcast to ALL clients in that conversation
    """

    async def connect(self):
        logger.debug("WebSocket connect initiated")
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = self.scope.get('user')

        if not self.user or not self.user.is_authenticated:
            logger.warning(f"WebSocket auth failed: user not authenticated")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'authentication_required',
                'message': 'Authentication required.'
            }))
            await self.close()
            return

        logger.debug(f"User {self.user.id} authenticated, checking conversation access")

        try:
            self.conversation = await self.get_conversation(self.conversation_id, self.user)
            logger.debug(f"User {self.user.id} has access to conversation {self.conversation_id}")
        except Exception as e:
            logger.error(f"Conversation access denied for user {self.user.id}: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'conversation_not_found',
                'message': 'Conversation not found or access denied.'
            }))
            await self.close()
            return

        self.conversation_name = f"chat_{self.conversation_id}"

        try:
            await self.channel_layer.group_add(
                self.conversation_name,
                self.channel_name
            )
            logger.debug(f"Added to channel group: {self.conversation_name}")
        except Exception as e:
            logger.error(f"Failed to join channel group: {e}")
            await self.close()
            return

        await self.accept()
        logger.debug(f"WebSocket connection accepted for conversation {self.conversation_id}")

    async def disconnect(self, close_code):
        logger.debug(f"WebSocket disconnect: {close_code}")
        # if hasattr(self, 'user') and self.user and hasattr(self.user, 'id'):
            # rate_limiter.cleanup(self.user.id)
        if hasattr(self, 'conversation_name'):
            try:
                await self.channel_layer.group_discard(
                    self.conversation_name,
                    self.channel_name
                )
            except Exception as e:
                logger.error(f"Failed to leave channel group: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
            return

        msg_type = data.get('type')
        logger.debug(f"Received message type: {msg_type}")

        if msg_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
            return

        if msg_type not in ('message_delivered', 'messages_seen', 'typing_start', 'typing_stop'):
            allowed, retry_after = rate_limiter.is_allowed(self.user.id)
            if not allowed:
                client_msg_id = data.get('client_message_id')
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'rate_limit_exceeded',
                    'message': 'ظرفیت ارسال پیام تمام شد. لطفاً کمی صبر کنید.',
                    'retry_after': retry_after,
                    'client_message_id': client_msg_id
                }))
                return

        if msg_type == 'message_delivered':
            await self._handle_message_delivered(data)
            return

        if msg_type == 'messages_seen':
            await self._handle_messages_seen(data)
            return

        if msg_type == 'typing_start':
            await self._handle_typing(True)
            return

        if msg_type == 'typing_stop':
            await self._handle_typing(False)
            return

        message_text = data.get('message_text', '').strip()
        client_message_id = data.get('client_message_id')

        if not message_text:
            return

        if len(message_text) > 10000:
            await self.send(text_data=json.dumps({
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
        await self.save_message(message)
        await self.save_conversation(self.conversation)

        await self.channel_layer.group_send(
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

        await self.channel_layer.group_send(
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

    async def _handle_message_delivered(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return

        try:
            message = await self.get_message(message_id, self.user)
            if message.status == MessageStatus.SENT:
                message.status = MessageStatus.DELIVERED
                await self.update_message_status(message)
                await self.channel_layer.group_send(
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

    async def _handle_messages_seen(self, data):
        last_seen_id = data.get('last_seen_message_id')
        if not last_seen_id:
            return

        try:
            last_seen_message = await self.get_message_by_id(last_seen_id, self.conversation)
        except Message.DoesNotExist:
            return

        updated_count = await self.mark_messages_seen(self.conversation, self.user, last_seen_id)

        if updated_count > 0:
            await self.channel_layer.group_send(
                self.conversation_name,
                {
                    'type': 'messages_seen_update',
                    'last_seen_id': last_seen_id,
                    'updated_count': updated_count,
                    'reader_id': self.user.id,
                }
            )

    async def _handle_typing(self, is_typing):
        await self.channel_layer.group_send(
            self.conversation_name,
            {
                'type': 'typing_update',
                'user_id': self.user.id,
                'is_typing': is_typing,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'message_id': event['message_id'],
            'status': event['status'],
            'sender_id': event['sender_id'],
        }))

    async def conversation_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'conversation_updated',
            'conversation': event['conversation'],
        }))

    async def messages_seen_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'messages_seen_update',
            'last_seen_id': event['last_seen_id'],
            'updated_count': event['updated_count'],
            'reader_id': event['reader_id'],
        }))

    async def typing_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_update',
            'user_id': event['user_id'],
            'is_typing': event['is_typing'],
        }))

    @database_sync_to_async
    def get_conversation(self, conversation_id, user):
        return get_object_or_404(
            Conversation.objects.select_related('car_ad', 'buyer', 'seller'),
            Q(seller=user) | Q(buyer=user),
            pk=conversation_id
        )

    @database_sync_to_async
    def get_message(self, message_id, user):
        return Message.objects.get(id=message_id, receiver_user=user)

    @database_sync_to_async
    def get_message_by_id(self, message_id, conversation):
        return Message.objects.get(id=message_id, conversation=conversation)

    @database_sync_to_async
    def save_message(self, message):
        message.save()

    @database_sync_to_async
    def save_conversation(self, conversation):
        conversation.save()

    @database_sync_to_async
    def update_message_status(self, message):
        message.save(update_fields=['status'])

    @database_sync_to_async
    def mark_messages_seen(self, conversation, user, last_seen_id):
        return Message.objects.filter(
            conversation=conversation,
            receiver_user=user,
            status__in=[MessageStatus.SENT, MessageStatus.DELIVERED]
        ).exclude(
            id__gt=last_seen_id
        ).update(status=MessageStatus.SEEN, is_read=True)
