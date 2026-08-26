
from django.shortcuts import get_object_or_404

from rest_framework.permissions import SAFE_METHODS, BasePermission

from ads.models import Car

############################

class NotCarAdOwner(BasePermission):
    message = "شما مجاز به این عمل نیستید!"
    
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            # Check permissions for read-only request
            return True
        else:
            # Check permissions for write request
            car_id = view.kwargs.get('car_ad_id') or request.data.get('car') 
            car_obj = get_object_or_404(Car, pk=car_id)
            return request.user and request.user.is_authenticated and request.user != car_obj.seller

    def has_object_permission(self, request, view, obj):
        return (request.user and
                request.user.is_authenticated and
                request.user.is_active and
                obj.user == request.user)   # favorite object

