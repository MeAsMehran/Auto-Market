from django.contrib import admin

from .models import Conversation
# Register your models here.

@admin.register(Conversation)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'car_ad', 'buyer', 'seller', 'created_at', 'updated_at')



