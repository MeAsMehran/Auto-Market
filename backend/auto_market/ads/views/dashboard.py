
from django.db import models
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..models import Car, Favorite

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from ..serializers.dashboard_serializer import DashboardSerializer

###############################

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={status.HTTP_200_OK: DashboardSerializer,}
    )
    def get(self, request):
        current_user = request.user

        active_ads_number = Car.objects.filter(seller=current_user, is_active=True).count()
        liked_ads_number = Favorite.objects.filter(user=current_user).count()

        latest_ads = Car.objects.filter(seller=current_user, is_active=True).order_by('-created_at')[:4]

        data = {
            'active_ads_number': active_ads_number,
            'liked_ads_number': liked_ads_number,
            'latest_ads': latest_ads,
        }

        my_serializer = DashboardSerializer(data)
        return Response(my_serializer.data, status=status.HTTP_200_OK)



