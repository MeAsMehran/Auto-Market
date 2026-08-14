
from django.shortcuts import get_object_or_404
from django.db.models import Q

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers.conversations_serializer import (ConversationSerializer, CreateConversationSerializer, GetConversationSerializer, ListConversationsSerializer)
from ..models import Conversation
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
        conversations = Conversation.objects.filter(
            Q(seller=request.user) | Q(buyer=request.user)
        ).select_related(
            'car_ad', 'car_ad__seller', 'buyer', 'seller'
        ).prefetch_related(
            'conversation_messages'
        ).order_by('-updated_at')

        serializer = ListConversationsSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)



