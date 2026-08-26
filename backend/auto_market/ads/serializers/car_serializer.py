
from rest_framework import serializers

from accounts.serializers import UserSerializer
from ..models import Car, CarImage
from .image_serializer import CreateCarImageSerializer, DetailCarImageSerializer
from core.iran_provinces import utils   # My own package

####################################################################################

class DetailConditionsField(serializers.Serializer):

    body_condition = serializers.JSONField(write_only=True, allow_null=True)
    motor_condition = serializers.JSONField(write_only=True, allow_null=True)
    gearbox_condition = serializers.JSONField(write_only=True, allow_null=True)
    front_suspension_condition = serializers.JSONField(write_only=True, allow_null=True)
    electrical_condition = serializers.JSONField(write_only=True, allow_null=True)
    cabin_condition = serializers.JSONField(write_only=True, allow_null=True)



from ..validations.create_car_validation import validate as create_car_validate
class CreateCarAdSerializer(serializers.Serializer):

    title        = serializers.CharField(max_length=200, required=True, allow_null=False)
    brand        = serializers.CharField(max_length=50, required=True, allow_null=False)
    model_name   = serializers.CharField(max_length=50, required=True, allow_null=False)
    year         = serializers.IntegerField(required=True, allow_null=False)
    price        = serializers.IntegerField(required=True, allow_null=False)
    mileage      = serializers.IntegerField(required=True, allow_null=False)
    fuel_type    = serializers.ChoiceField(choices=Car.FUEL_CHOICES, required=True, allow_null=False)
    transmission = serializers.ChoiceField(choices=Car.TRANSMISSION_CHOICES, required=True, allow_null=False)
    body_type    = serializers.ChoiceField(choices=Car.BODY_CHOICES, required=True, allow_null=False)
    condition    = serializers.ChoiceField(choices=Car.CONDITION_CHOICES, required=True, allow_null=False)
    color        = serializers.ChoiceField(choices=Car.COLOR_CHOICES, required=True, allow_null=False)
    province     = serializers.ChoiceField(choices=list(utils.PROVINCE_CITY_MAP), required=True, allow_null=False)
    city         = serializers.ChoiceField(choices=utils.ALL_CITIES, required=True, allow_null=False)
    description  = serializers.CharField(required=True, allow_null=False)
    features     = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    detail_conditions = DetailConditionsField(default=dict, allow_null=True) # we format it in drf-spectacular (swagger)
    # images       = CreateCarImageSerializer(many=True, required=False)

    def validate(self, attrs):
        return create_car_validate(attrs)

    def create(self, validated_data):
        user = self.context['request'].user
        '''car  = Car.objects.create(
            seller       = user,
            title        = validated_data.get('title'),
            brand        = validated_data.get('brand'),
            model_name   = validated_data.get('model_name'),
            year         = validated_data.get('year'),
            price        = validated_data.get('price'),
            mileage      = validated_data.get('mileage'),
            fuel_type    = validated_data.get('fuel_type'),
            transmission = validated_data.get('transmission'),
            body_type    = validated_data.get('body_type'),
            condition    = validated_data.get('condition'),
            color        = validated_data.get('color'),
            city         = validated_data.get('city'),
            description  = validated_data.get('description'),
        )'''        
        # images_data = validated_data.pop('images', [])
        car = Car.objects.create(seller=user, **validated_data)     # the **validated_data is doing all the fields of the above
        car.features = validated_data.get('features', [])
        # for image_data in images_data:
        #     CarImage.objects.create(car=car, **image_data)
        car.save()

        return car


class DetailCarAdSerializer(serializers.Serializer):

    id           = serializers.IntegerField(read_only=True)
    seller       = UserSerializer(read_only=True)
    title        = serializers.CharField(read_only=True)
    brand        = serializers.CharField(read_only=True)
    model_name   = serializers.CharField(read_only=True)
    year         = serializers.IntegerField(read_only=True)
    price        = serializers.IntegerField(read_only=True)
    mileage      = serializers.IntegerField(read_only=True)
    fuel_type    = serializers.CharField(read_only=True)
    transmission = serializers.CharField(read_only=True)
    body_type    = serializers.CharField(read_only=True)
    condition    = serializers.CharField(read_only=True)
    color        = serializers.CharField(read_only=True)
    city         = serializers.CharField(read_only=True)
    description  = serializers.CharField(read_only=True)
    features     = serializers.ListField(child=serializers.CharField(), read_only=True)
    created_at   = serializers.DateTimeField(read_only=True)
    images       = DetailCarImageSerializer(many=True, read_only=True)
    is_featured  = serializers.BooleanField(read_only=True)
    is_active    = serializers.BooleanField(read_only=True)
    detail_conditions = serializers.JSONField(default=dict, allow_null=True, read_only=True) # we format it in drf-spectacular (swagger)


class ListCarAdSerializer(serializers.Serializer):

    id           = serializers.IntegerField(read_only=True)
    seller_id    = serializers.IntegerField(source='seller.id', read_only=True)
    title        = serializers.CharField(read_only=True)
    brand        = serializers.CharField(read_only=True)
    model_name   = serializers.CharField(read_only=True)
    year         = serializers.IntegerField(read_only=True)
    price        = serializers.IntegerField(read_only=True)
    mileage      = serializers.IntegerField(read_only=True)
    fuel_type    = serializers.CharField(read_only=True)
    transmission = serializers.CharField(read_only=True)
    body_type    = serializers.CharField(read_only=True)
    condition    = serializers.CharField(read_only=True)
    color        = serializers.CharField(read_only=True)
    city         = serializers.CharField(read_only=True)
    is_featured  = serializers.BooleanField(read_only=True)
    created_at   = serializers.DateTimeField(read_only=True)
    images       = DetailCarImageSerializer(many=True, read_only=True)
    is_active    = serializers.BooleanField(read_only=True)
    detail_conditions = serializers.JSONField(default=dict, allow_null=True, read_only=True) # we format it in drf-spectacular (swagger)


from ..validations.update_car_validation import validate as update_car_validate
class UpdateCarAdSerializer(serializers.Serializer):

    title        = serializers.CharField(max_length=200, required=True, allow_null=False)
    brand        = serializers.CharField(max_length=50, required=True, allow_null=False)
    model_name   = serializers.CharField(max_length=50, required=True, allow_null=False)
    year         = serializers.IntegerField(required=True, allow_null=False)
    price        = serializers.IntegerField(required=True, allow_null=False)
    mileage      = serializers.IntegerField(required=True, allow_null=False)
    fuel_type    = serializers.ChoiceField(choices=Car.FUEL_CHOICES, required=True, allow_null=False)
    transmission = serializers.ChoiceField(choices=Car.TRANSMISSION_CHOICES, required=True, allow_null=False)
    body_type    = serializers.ChoiceField(choices=Car.BODY_CHOICES, required=True, allow_null=False)
    condition    = serializers.ChoiceField(choices=Car.CONDITION_CHOICES, required=True, allow_null=False)
    color        = serializers.ChoiceField(choices=Car.COLOR_CHOICES, required=True, allow_null=False)
    city         = serializers.ChoiceField(choices=utils.PROVINCE_CITY_MAP, required=True, allow_null=False)
    description  = serializers.CharField(required=True, allow_null=False)
    features     = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    updated_at   = serializers.DateTimeField()
    is_active    = serializers.BooleanField()
    detail_conditions = serializers.JSONField(default=dict, allow_null=True, read_only=True) # we format it in drf-spectacular (swagger)
    # images       = CreateCarImageSerializer(many=True, required=False)

    def validate(self, attrs):
        return update_car_validate(attrs)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance






