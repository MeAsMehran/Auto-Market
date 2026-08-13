
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
        serializer = SendMessageSerializer(data=request.data, context={'request' : request})
        if serializer.is_valid():
            conversation = Conversation.objects.get(pk=conversation_id)
            
            '''check the conversation user sides:'''            
            # sender user is buyer -> receiver user is seller:
            if conversation.buyer.id == request.user.id:
                message = Message.objects.create(conversation=conversation, sender_user=request.user, receiver_user=conversation.seller)

            # sender user is seller -> receiver user is buyer: 
            elif conversation.seller.id == request.user.id:
                message = Message.objects.create(conversation=conversation, sender_user=request.user, receiver_user=conversation.buyer)
            '''end of the conversation user sides'''
            
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
        conversation = get_object_or_404(Conversation, Q(seller=request.user) | Q(buyer=request.user), pk=conversation_id) 
        conversation_messages = conversation.conversation_messages.all()
        
        serializer = ListMessageSerializer(conversation_messages, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


    # sender_user   = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender_user_messages')
    # receiver_user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver_user_messages')
    #
    # message_text  = models.TextField(max_length=10000, blank=False, null=False)
    # is_read          =






