
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from drf_spectacular.utils import extend_schema

from ..models import Car, Favorite
from ..serializers.favorite_serializer import ListFavoriteAdSerializer
from ..filters import CarFilter

from core.pagination.pagination import SmallPageNumberPagination

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
        # way 1:
        # filter + select_related for performance
        # favorite_ads = Favorite.objects.filter(user=request.user, car__is_active=True).select_related('car')
        
        # way 2: (buggy because we need to get favorite objects not car -> ListFavoriteAdSerializer)
        # favorite_ids = Favorite.objects.filter(user=request.user).values_list('car_id', flat=True)
        # cars = Car.objects.filter(id__in=favorite_ids,is_active=True).select_related('seller').prefetch_related('images')

        favorites = Favorite.objects.filter(
            user=request.user,
            car__is_active=True
        ).select_related(
            'car', 'car__seller'
        ).prefetch_related(
            'car__images'
        )

        # Apply search + other filters using CarFilter
        car_filter = CarFilter(request.query_params, queryset=favorites)
        filtered_qs = car_filter.qs

        # Paginate
        paginator = SmallPageNumberPagination()
        page = paginator.paginate_queryset(filtered_qs, request)
        serializer = ListFavoriteAdSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)






