


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


class ListMessageSerializer(serializers.Serializer):
    id            = serializers.IntegerField(read_only=True)
    conversation  = ConversationSerializer(read_only=True)
    sender_user   = UserSerializer(read_only=True)
    receiver_user = UserSerializer(read_only=True)
    message_text  = serializers.CharField(read_only=True)
    is_read       = serializers.BooleanField(read_only=True)
    status        = serializers.CharField(read_only=True)
    created_at    = serializers.DateTimeField(read_only=True)







