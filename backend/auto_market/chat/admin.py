from django.contrib import admin

from .models import Conversation, Message
# Register your models here.

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'car_ad', 'buyer', 'seller', 'created_at', 'updated_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender_user', 'receiver_user', 'message_text', 'is_read', 'created_at', 'updated_at')


