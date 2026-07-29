from django.contrib import admin
from .models import Car, CarImage, Favorite

# Register your models here.

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'brand', 'model_name', 'year', 'price', 'city', 'seller', 'is_active', 'is_featured', 'created_at')

@admin.register(CarImage)
class CarImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'car', 'order', 'created_at')

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'car', 'created_at')





