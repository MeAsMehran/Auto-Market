
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db.models import OuterRef, Subquery, Max, Count

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


from ..serializers.conversations_serializer import (ConversationSerializer, CreateConversationSerializer, GetConversationSerializer, ListConversationsSerializer)
from ..models import Conversation, Message
from core.permissions.conversation_owner import ConversationOwner
from core.pagination.pagination import SmallPageNumberPagination

#####################

class CreateConversationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CreateConversationSerializer,
        responses={201: ConversationSerializer}
    )
    def post(self, request):
        input_serializer = CreateConversationSerializer(data=request.data, context={'request': request})
        if input_serializer.is_valid():
            car_ad = input_serializer.validated_data.get('car_ad')
            seller = car_ad.seller
            buyer = request.user

            conversation = Conversation.objects.create(car_ad=car_ad, buyer=buyer, seller=seller)

            result_serializer = ConversationSerializer(conversation)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
        return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteConversationView(APIView):
    permission_classes = [IsAuthenticated , ConversationOwner]

    @extend_schema(
        responses={status.HTTP_204_NO_CONTENT, None}
    )
    def delete(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GetConversationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: GetConversationSerializer},
    )
    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.select_related('car_ad', 'car_ad__seller', 'buyer', 'seller'),
            Q(seller=request.user) | Q(buyer=request.user),
            pk=conversation_id
        )
        serializer = GetConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListConversationsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListConversationsSerializer(many=True)}
    )
    def get(self, request):
        """
            conversations = Conversation.objects.filter(
                Q(seller=request.user) | Q(buyer=request.user)
            ).select_related(
                'car_ad', 'car_ad__seller', 'buyer', 'seller'
            ).prefetch_related(
                'conversation_messages'
            ).order_by('-updated_at')
        """

        user = request.user
        
        # Subquery: Get last message ID per conversation
        last_msg_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-created_at').values('id')[:1]
        
        # Subquery: Get last message text (for display)
        last_msg_text_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-created_at').values('message_text')[:1]
        
        # Subquery: Get last message created_at
        last_msg_date_subquery = Message.objects.filter(
            conversation=OuterRef('pk')
        ).order_by('-created_at').values('created_at')[:1]
        
        # Subquery: Count unread messages
        unread_count_subquery = Message.objects.filter(
            conversation=OuterRef('pk'),
            receiver_user=user,
            is_read=False
        ).values('conversation').annotate(cnt=Count('id')).values('cnt')
        
        conversations = Conversation.objects.filter(
            Q(seller=user) | Q(buyer=user)
        ).select_related(
            'car_ad', 'car_ad__seller', 'buyer', 'seller'
        ).annotate(
            last_message_id=Subquery(last_msg_subquery),
            last_message_text=Subquery(last_msg_text_subquery),
            last_message_created_at=Subquery(last_msg_date_subquery),
            unread_count=Subquery(unread_count_subquery),
        ).order_by('-updated_at')
        
        serializer = ListConversationsSerializer(
            conversations, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)

        

        # serializer = ListConversationsSerializer(conversations, many=True, context={'request': request})
        # return Response(serializer.data)



