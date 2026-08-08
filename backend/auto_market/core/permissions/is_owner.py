
from rest_framework.permissions import BasePermission
from ads.models import Car


class IsCarOwner(BasePermission):
    """
        Allows the Car Ad owner to have access.
    """
    message = 'شما مجاز به این عملیات نیستید.'

    def has_permission(self, request, view):
        """
            The car ID comes from the URL (/cars/<car_id>/images/), which is in view.kwargs, not in request.data. Should be:
            car_id = view.kwargs.get('car_id')
        """
        car_ad_id = view.kwargs.get('car_ad_id') or request.data.get('car')
        if not car_ad_id:
            return False
        return True 
    
    def has_object_permission(self, request, view, obj):
        return (request.user and
                request.user.is_authenticated and
                request.user.is_active and
                obj.car.seller == request.user)



