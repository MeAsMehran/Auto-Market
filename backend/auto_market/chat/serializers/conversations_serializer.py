
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ads.serializers.car_serializer import DetailCarAdSerializer
from ads.models import Car
from ..models import Conversation

#######################################################

class ConversationSerializer(serializers.Serializer):
    car_ad = DetailCarAdSerializer(read_only=True)


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
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ListConversationsSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
