
from rest_framework import serializers
from .conversations_serializer import ConversationSerializer

####################################################

class MessageSerializer(serializers.Serializer):
    conversation = ConversationSerializer(read_only=True)
    message_text = serializers.CharField(write_only=True, max_length=10000, required=True, trim_whitespace=True)
    is_read      = serializers.BooleanField(default=False)


