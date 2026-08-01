from django.contrib import admin
from .models import User 

# Register your models here.

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('phone', 'name', 'email')

# @admin.register(PhoneVerification)
# class PhoneVerificationAdmin(admin.ModelAdmin):
#     list_display = ('phone', 'code', 'purpose', 'is_used', 'created_at', 'expired_at')
#     list_filter = ('purpose', 'is_used')
#     readonly_fields = ('created_at', )

