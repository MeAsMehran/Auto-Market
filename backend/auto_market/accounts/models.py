from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import CustomUserManager

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



