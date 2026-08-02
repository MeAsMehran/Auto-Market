
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema

from ..models import Car, Favorite
from ..serializers.favorite_serializer import ListFavoriteAdSerializer

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
    def post(self, request, car_ad_id):
        current_user = request.user
        car_ad       = get_object_or_404(Car, pk=car_ad_id, is_active=True)  
        favorite_ad, created  = Favorite.objects.get_or_create(user=current_user, car=car_ad)   # get_or_create returns a tupple: (instance, created) where created is True if a new row was inserted, False if it already existed.
        return Response(status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class RemoveFavoriteAdView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
    responses={204: None, 404: None}
    )
    def post(self, request, car_ad_id):
        current_user = request.user
        favorite_ad = get_object_or_404(Favorite, user=current_user, car_id=car_ad_id)     # queries by the FK column (Django auto-creates this)
        favorite_ad.delete()
        return Response(status=204)


# This will do the AddFavoriteAdView and RemoveFavoriteAdView
class ToggleFavoriteView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
    responses={201: None, 204: None}
    )
    def post(self, request, car_ad_id):
        current_user = request.user
        car_ad = get_object_or_404(Car, pk=car_ad_id, is_active=True)
        favorite_ad, created = Favorite.objects.get_or_create(user=current_user, car=car_ad)

        if created:
            return Response(status=status.HTTP_201_CREATED)     # Added
        else:
            favorite_ad.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)  # Removed


class ListFavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListFavoriteAdSerializer(many=True)}
    )
    def get(self, request):
        # filter + select_related for performance
        favorite_ads = Favorite.objects.filter(user=request.user, car__is_active=True).select_related('car')

        # Actually serialize and return the data
        serializer = ListFavoriteAdSerializer(favorite_ads, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)






