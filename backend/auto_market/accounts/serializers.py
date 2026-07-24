
from rest_framework import serializers
from .models import User


from .validations.validate_user_register import validate as register_validate
class UserRegisterSerializer(serializers.ModelSerializer):

    phone = serializers.CharField(
        max_length=15,  # Allow longer input before normalization
        error_messages={
            'max_length': 'شماره تلفن نباید بیشتر از 13 کاراکتر باشد.'
        }
    )
    
    password = serializers.CharField(min_length=8, write_only=True, required=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True, required=True)

    class Meta:
        model = User 
        fields = ('phone', 'name', 'email', 'password', 'confirm_password')    # we don't need the is_active and is_staff and date_joined -> the model initialize it automatically.

    def validate(self, attrs):
        return register_validate(attrs)

    def create(self, validated_data):
        # we don't need the is_active and is_staff and date_joined -> the model initialize it automatically.
        return User.objects.create_user(
            phone = validated_data.get('phone'),
            name = validated_data.get('name'),
            password = validated_data.get('password'),
        )


from .validations.validate_user_login import validate as login_validate
class UserLoginSerializer(serializers.Serializer):

    phone = serializers.CharField(max_length=15, write_only=True, required=True, trim_whitespace=True)
    password = serializers.CharField(min_length=8, write_only=True, required=True)

    def validate(self, attrs):
        return login_validate(attrs) 

    
class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'name', 'phone', 'date_joined', 'email')
        read_only_fields = fields  # all fields read-only


class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, )
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)














