

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.db.models import Q

from ..serializers.messages_serializer import SendMessageSerializer, MessageSerializer, ReceiveMessageSerializer, ListMessageSerializer
from ..models import Message, Conversation

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

        updated_count = Message.objects.filter(
            conversation=conversation,
            receiver_user=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({'marked_read': updated_count}, status=status.HTTP_200_OK)






