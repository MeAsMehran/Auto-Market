
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.db.models.functions import Greatest

from ..serializers.messages_serializer import SendMessageSerializer, MessageSerializer, ReceiveMessageSerializer, ListMessageSerializer
from ..models import Message, Conversation, MessageStatus

##########################################3

"""
Task	                    Mechanism	                Notes

Initial page load	        HTTP REST	                GET /api/conversation/list/
Click conversation	        HTTP REST	                GET /api/conversation/<id>/
Load message history	    HTTP REST	                GET /api/conversation/<id>/messages/
Mark messages read	        HTTP REST + WebSocket	    REST updates DB, WebSocket broadcasts to group
Send message in real time	rebSocket	                ConversationConsumer.receive() → save_message() → group_send()
Receive new message	        WebSocket	                Broadcast via chat_message handler
Mark message delivered	    WebSocket	                { "type": "message_delivered" }
Mark messages seen	        WebSocket	                { "type": "messages_seen" }
Typing indicator	        WebSocket	                { "type": "typing_start/stop" }
Conversation created	    HTTP REST	                POST /api/conversation/create/
Delete conversation	        HTTP REST	                DELETE /api/conversation/delete/<id>/
"""

# If the websocket failed temporarily, the frontend uses the SendMessageView (HTTP) until the websocket get fixed
class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=SendMessageSerializer,
        responses={status.HTTP_201_CREATED}
    )
    def post(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.select_related('buyer', 'seller'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            message_text = serializer.validated_data.get('message_text')

            receiver = conversation.seller if conversation.buyer.id == request.user.id else conversation.buyer

            message = Message.objects.create(
                conversation=conversation,
                sender_user=request.user,
                receiver_user=receiver,
                message_text=message_text
            )

            return Response(ListMessageSerializer(message).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReceiveMessageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={status.HTTP_200_OK, MessageSerializer}
    )
    def get(self, request, message_id):
        pass

"""
class RetrieveMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.only('id'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        page_size = min(page_size, 100)

        total_messages = conversation.conversation_messages.count()
        start = (page - 1) * page_size
        end = start + page_size

        messages = conversation.conversation_messages.select_related(
            'sender_user', 'receiver_user'
        ).order_by('created_at')[start:end]

        serializer = ListMessageSerializer(messages, many=True)

        return Response({
            'messages': serializer.data,
            'total': total_messages,
            'page': page,
            'page_size': page_size,
            'has_next': end < total_messages,
        }, status=status.HTTP_200_OK)
"""

"""
above RetrieveMessagesView:

Initial load (no cursor):
GET /api/conversation/1/messages/?limit=50

Response:
{
  "messages": [1, 2, 3, ...50],      ← Newest at end (index 49)
  "next_cursor": "1",                  ← First message ID (oldest in batch)
  "has_next": true                     ← More older messages exist
}

Down RetrieveMessagesView:

Load more (with cursor):
GET /api/conversation/1/messages/?limit=50&cursor=1

Response:
{
  "messages": [51, 52, 53, ...100],   ← Older messages
  "next_cursor": "51",
  "has_next": true
}
"""

class RetrieveMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.only('id'),        # in a query if you wanted a field or several fields you can select them by using .only(). this makes the query lighter, or if you wanted to not consider some fields user .exclude()
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        # Limit: default 50, max 50
        limit = int(request.query_params.get('limit', 50))
        limit = max(1, min(limit, 50))  # Clamp between 1 and 50

        # Cursor: message ID to fetch messages BEFORE
        cursor = request.query_params.get('cursor')

        cursor_id = None
        cursor_date = None
        if cursor:
            try:
                cursor = int(cursor)
            except (TypeError, ValueError):
                cursor = None
            if cursor:
                cursor_msg = Message.objects.filter(
                    id=cursor, conversation=conversation
                ).only('id', 'created_at').first()
                if cursor_msg:
                    cursor_id = cursor_msg.id
                    cursor_date = cursor_msg.created_at

        # Build query
        queryset = Message.objects.filter(conversation=conversation)

        if cursor_date is not None and cursor_id is not None:
            queryset = queryset.filter(
                Q(created_at__lt=cursor_date) | Q(created_at=cursor_date, id__lt=cursor_id)     # if 2 messages has the same created_at date get the messages with id less than cursor_id then
            )

        # Order by newest first, limit to get latest N
        # ── REMOVE lines 153-158 (select_related + order_by + slice) ───────
        # messages = queryset.select_related(
        # 'sender_user',
        # 'receiver_user',
        # 'conversation',
        # 'conversation__car_ad'
        # ).order_by('-created_at')[:limit]

        # ── ADD this instead (deterministic order + limit+1 for has_next) ───
        messages = queryset.select_related(
            'sender_user',
            'receiver_user',
            'conversation',
            'conversation__car_ad'
        ).order_by('-created_at', '-id')[:limit + 1]

        has_next = len(messages) > limit
        messages = messages[:limit]
        # ── END ADD ─────────────────────────────────────────────────────────

        # Reverse to get oldest first in this batch (for display order)
        messages = list(reversed(messages))

        if messages:
            next_cursor = str(messages[0].id) if has_next else None
        else:
            next_cursor = None
            has_next = False

        serializer = ListMessageSerializer(messages, many=True)

        return Response({
            'messages': serializer.data,
            'next_cursor': next_cursor,
            'has_next': has_next,
        })


class MarkMessagesAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={status.HTTP_200_OK}
    )
    def post(self, request, conversation_id):
        get_object_or_404(
            Conversation.objects.only('id'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        with transaction.atomic():
            conversation = Conversation.objects.select_for_update().only(
                'id',
                'buyer_id',
            ).get(pk=conversation_id)

            unread_ids = list(
                Message.objects
                .select_for_update()
                .filter(
                    conversation_id=conversation.id,
                    receiver_user_id=request.user.id,
                    is_read=False,
                )
                .order_by('id')
                .values_list('id', flat=True)
            )

            if not unread_ids:
                return Response({
                    'marked_read': 0,
                    'last_seen_id': None,
                }, status=status.HTTP_200_OK)

            updated_count = Message.objects.filter(
                id__in=unread_ids,
                conversation_id=conversation.id,
                receiver_user_id=request.user.id,
                is_read=False,
            ).update(
                is_read=True,
                status=MessageStatus.SEEN,
            )

            if updated_count > 0 and request.user.id == conversation.buyer_id:
                Conversation.objects.filter(pk=conversation.id).update(
                    unread_count=Greatest(F('unread_count') - updated_count, 0)
                )

            last_seen_id = unread_ids[-1]

            def broadcast_seen_messages():
                async_to_sync(get_channel_layer().group_send)(
                    f'chat_{conversation.id}',
                    {
                        'type': 'messages_seen_update',
                        'last_seen_id': last_seen_id,
                        'updated_count': updated_count,
                        'reader_id': request.user.id,
                    },
                )

            transaction.on_commit(broadcast_seen_messages)

        return Response({
            'marked_read': updated_count,
            'last_seen_id': last_seen_id,
        }, status=status.HTTP_200_OK)


