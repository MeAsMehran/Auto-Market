
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema

from ..models import Car, Favorite

########################################

'''
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
'''

class AddFavoriteAdView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
    responses={201: None, 200: None}
    )
    def post(self, request, car_id):
        current_user = request.user
        car_ad       = get_object_or_404(Car, pk=car_id, is_active=True)  
        favorite_ad, created  = Favorite.objects.get_or_create(user=current_user, car=car_ad)   # get_or_create returns a tupple: (instance, created) where created is True if a new row was inserted, False if it already existed.
        return Response(status=201 if created else 200)


class RemoveFavoriteAdView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
    responses={204: None, 404: None}
    )
    def post(self, request, car_id):
        current_user = request.user
        favorite_ad = get_object_or_404(Favorite, user=current_user, car_id=car_id)     # queries by the FK column (Django auto-creates this)
        favorite_ad.delete()
        return Response(status=204)


# This will do the AddFavoriteAdView and RemoveFavoriteAdView
class ToggleFavoriteView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
    responses={201: None, 204: None}
    )
    def post(self, request, car_id):
        current_user = request.user
        favorite_ad, created = Favorite.objects.get_or_create(user=current_user, car_id=car_id)

        if created:
            return Response(status=status.HTTP_201_CREATED)     # Added
        else:
            favorite_ad.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)  # Removed


class ListFavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(

    )
    def get(self, request):
        pass



