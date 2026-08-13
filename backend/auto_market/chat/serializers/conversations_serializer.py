
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from ads.serializers.car_serializer import DetailCarAdSerializer
from ads.models import Car
from ..models import Conversation
from accounts.serializers import UserSerializer


#######################################################

class ConversationSerializer(serializers.Serializer):
    id     = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    sender_user   = UserSerializer(source='buyer', read_only=True)      # source is for showing which Conversation's model field we are referring to
    receiver_user = UserSerializer(source='seller', read_only=True)      # source is for showing which Conversation's model field we are referring to


class CreateConversationSerializer(serializers.Serializer):
    car_ad = serializers.PrimaryKeyRelatedField(queryset=Car.objects.all(), write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        car_ad = attrs.get('car_ad')

        if Conversation.objects.filter(car_ad=car_ad, seller=car_ad.seller, buyer=user).exists() or (user.id is car_ad.seller.id):
            raise ValidationError("Buyer and Seller are the same person or Conversation is already exists!")

        return attrs


class GetConversationSerializer(serializers.Serializer):

    id     = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    sender_user   = UserSerializer(source='buyer', read_only=True)      # source is for showing which Conversation's model field we are referring to
    receiver_user = UserSerializer(source='seller', read_only=True)      # source is for showing which Conversation's model field we are referring to
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ListConversationsSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
