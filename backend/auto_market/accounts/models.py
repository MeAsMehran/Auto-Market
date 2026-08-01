
from datetime import timezone

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

from .managers import CustomUserManager

###################################################
# Create your models here.

class User(AbstractBaseUser, PermissionsMixin):

    phone = models.CharField(max_length=13, unique=True, db_index=True) 
    name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(null=True, blank=True)
    # avatar = 
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone' 
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.name


# class PhoneVerification(models.Model):
#
#     PURPOSE_CHOICES = [
#             ('phone_change', 'Phone Change'),
#             ('password_reset', 'Password Reset'),
#     ]
#
#     phone = models.CharField(max_length=13, unique=True, db_index=True)
#     code = models.CharField(max_length=6)
#     purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
#     created_at = models.DateTimeField(auto_now_add=True)
#     expired_at = models.DateTimeField()
#     is_used = models.BooleanField(default=False)
#
#     def is_expired(self):
#         return timezone.now() > self.expired_at
#
#     def __str__(self):
#         return f"{self.phone} - {self.code} ({self.purpose})"



