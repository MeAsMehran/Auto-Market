
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.db.models.functions import Greatest

from ..serializers.messages_serializer import SendMessageSerializer, MessageSerializer, ReceiveMessageSerializer, ListMessageSerializer
from ..models import Message, Conversation, MessageStatus

##########################################3

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
            Conversation.objects.only('id'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        # Limit: default 50, max 50
        limit = int(request.query_params.get('limit', 50))
        limit = max(1, min(limit, 50))  # Clamp between 1 and 50

        # Cursor: message ID to fetch messages BEFORE
        cursor = request.query_params.get('cursor')

        # ── REMOVE this whole block (lines 134-143) ─────────────────────────
        # if cursor:
        #     cursor = int(cursor)
        #     # Get the cursor message's created_at for proper ordering
        #     try:
        #         cursor_msg = Message.objects.get(id=cursor, conversation=conversation)
        #         cursor_date = cursor_msg.created_at
        #     except Message.DoesNotExist:
        #         cursor_date = None
        # else:
        #     cursor_date = None

        # ── ADD this instead (safe cursor parsing → (id, created_at)) ───────
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
        # ── END ADD ─────────────────────────────────────────────────────────

        # Build query
        queryset = Message.objects.filter(conversation=conversation)

        # ── REMOVE this block (lines 148-150) ───────────────────────────────
        # if cursor_date:
        #     # Get messages OLDER than cursor
        #     queryset = queryset.filter(created_at__lt=cursor_date)

        # ── ADD this instead (compound cursor: ties broken by id) ───────────
        if cursor_date is not None and cursor_id is not None:
            queryset = queryset.filter(
                Q(created_at__lt=cursor_date) | Q(created_at=cursor_date, id__lt=cursor_id)
            )
        # ── END ADD ─────────────────────────────────────────────────────────

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

        # ── REMOVE this block (lines 163-169) ───────────────────────────────
        # # Determine next cursor
        # if messages:
        #     next_cursor = str(messages[0].id) if len(messages) == limit else None
        #     has_next = next_cursor is not None
        # else:
        #     next_cursor = None
        #     has_next = False

        # ── ADD this instead (next_cursor only when a next page exists) ─────
        if messages:
            next_cursor = str(messages[0].id) if has_next else None
        else:
            next_cursor = None
            has_next = False
        # ── END ADD ─────────────────────────────────────────────────────────

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
        conversation = get_object_or_404(
            Conversation.objects.only('id'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )

        unread_messages = list(
            Message.objects.filter(
                conversation=conversation,
                receiver_user=request.user,
                is_read=False
            ).values('id', 'sender_user_id')
        )

        updated_count = Message.objects.filter(
            conversation=conversation,
            receiver_user=request.user,
            is_read=False
        ).update(is_read=True, status=MessageStatus.SEEN)

        if updated_count > 0 and request.user == conversation.buyer:
            Conversation.objects.filter(pk=conversation.id).update(
                unread_count=Greatest(F('unread_count') - updated_count, 0)
            )

        if unread_messages:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            group_name = f"chat_{conversation_id}"
            for msg in unread_messages:
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'status_update',
                        'message_id': msg['id'],
                        'status': MessageStatus.SEEN,
                        'sender_id': msg['sender_user_id'],
                    }
                )

        return Response({'marked_read': updated_count}, status=status.HTTP_200_OK)





