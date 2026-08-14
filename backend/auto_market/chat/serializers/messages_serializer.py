


from rest_framework import serializers
from .conversations_serializer import ConversationSerializer
from accounts.serializers import UserSerializer

####################################################

class SendMessageSerializer(serializers.Serializer):
    message_text = serializers.CharField(write_only=True, max_length=10000, required=True, trim_whitespace=True)
    is_read      = serializers.BooleanField(default=False)


class ReceiveMessageSerializer(serializers.Serializer):
    message_text = serializers.CharField(read_only=True)
    is_read      = serializers.BooleanField()


class MessageSerializer(serializers.Serializer):
    conversation = ConversationSerializer(read_only=True)
    message_text = serializers.CharField(read_only=True)
    is_read      = serializers.BooleanField()
    status       = serializers.CharField(read_only=True)


"""
   Because of the nested serializers, even if we use select_related ,for each nested serializers DRF re-queries for this 

    class ListMessageSerializer(serializers.Serializer):
    id            = serializers.IntegerField(read_only=True)
    conversation  = ConversationSerializer(read_only=True)
    sender_user   = UserSerializer(read_only=True)
    receiver_user = UserSerializer(read_only=True)
    message_text  = serializers.CharField(read_only=True)
    is_read       = serializers.BooleanField(read_only=True)
    status        = serializers.CharField(read_only=True)
    created_at    = serializers.DateTimeField(read_only=True)

"""

class ListMessageSerializer(serializers.Serializer):
    id            = serializers.IntegerField(read_only=True)
    message_text  = serializers.CharField(read_only=True)
    is_read       = serializers.BooleanField(read_only=True)
    status        = serializers.CharField(read_only=True)
    created_at    = serializers.DateTimeField(read_only=True)

    # Sender user and Receiver user Flat fields (not nested) with source= (uses select_related data directly)
    sender_id     = serializers.IntegerField(source='sender_user.id', read_only=True)
    sender_name   = serializers.CharField(source='sender_user.name', read_only=True)
    receiver_id   = serializers.IntegerField(source='receiver_user.id', read_only=True)
    receiver_name = serializers.CharField(source='receiver_user.name', read_only=True)

    # Car ad info (flat, not nested)
    car_ad_id = serializers.IntegerField(source='conversation.car_ad.id', read_only=True)
    car_ad_title = serializers.CharField(source='conversation.car_ad.title', read_only=True)
    car_ad_brand = serializers.CharField(source='conversation.car_ad.brand', read_only=True)




