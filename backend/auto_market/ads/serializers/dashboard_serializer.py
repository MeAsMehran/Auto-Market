
from rest_framework import serializers

from .car_serializer import ListCarAdSerializer

#####################################################

class DashboardSerializer(serializers.Serializer):

    active_ads_number = serializers.IntegerField(read_only=True)
    liked_ads_number  = serializers.IntegerField(read_only=True)
    latest_ads        = ListCarAdSerializer(read_only=True, many=True) 


