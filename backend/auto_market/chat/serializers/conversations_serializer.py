
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from ads.serializers.car_serializer import DetailCarAdSerializer
from ads.models import Car
from ..models import Conversation
from accounts.serializers import UserSerializer
from core.presence import presence_service


#######################################################

class ConversationSerializer(serializers.Serializer):
    id     = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    sender_user   = UserSerializer(source='buyer', read_only=True)
    receiver_user = UserSerializer(source='seller', read_only=True)


class CreateConversationSerializer(serializers.Serializer):
    car_ad = serializers.PrimaryKeyRelatedField(queryset=Car.objects.all(), write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        car_ad = attrs.get('car_ad')

        if user == car_ad.seller:
            raise ValidationError("You cannot start a conversation on your own car ad.")

        if Conversation.objects.filter(car_ad=car_ad, seller=car_ad.seller, buyer=user).exists():
            raise ValidationError("Conversation for this car ad already exists.")

        return attrs


class GetConversationSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ListConversationsSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    car_ad = DetailCarAdSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    last_message = serializers.SerializerMethodField()
    other_user_online = serializers.SerializerMethodField()

    def get_last_message(self, obj):
        last_msg = obj.conversation_messages.order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'message_text': last_msg.message_text,
                'created_at': last_msg.created_at,
            }
        return None

    def get_other_user_online(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False

        if request.user.id == obj.seller.id:
            other_user_id = obj.buyer.id
        else:
            other_user_id = obj.seller.id

        return presence_service.is_user_online(other_user_id)
