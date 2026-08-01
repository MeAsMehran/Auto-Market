
from rest_framework import serializers
from ..serializers.car_serializer import ListCarAdSerializer

##########################################################

class AddFavoriteAdSerializer(serializers.Serializer):
    pass


class ListFavoriteAdSerializer(serializers.Serializer):
    id         = serializers.IntegerField(read_only=True)
    car        = ListCarAdSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)



