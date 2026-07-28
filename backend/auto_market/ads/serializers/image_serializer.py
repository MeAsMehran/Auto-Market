
from rest_framework import serializers
from ..models import CarImage
from ..validations.create_image_validation import validate as image_validate

###########################################################

class CreateCarImageSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True, allow_null=False, max_length=None, use_url=True,)
    order = serializers.IntegerField(required=False, default=0)
    
    def validate(self, attrs):
        return image_validate(attrs)

    def create(self, validated_data):
        car = self.context['car']
        car_image = CarImage.objects.create(car=car, **validated_data)
        return car_image 


class DetailCarImageSerializer(serializers.Serializer):
    id    = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(read_only=True, use_url=True)
    order = serializers.IntegerField(read_only=True)

