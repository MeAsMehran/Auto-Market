
from rest_framework import serializers
from .models import User
from .verification.utils import generate_otp, get_otp_key, get_rate_limit_key, store_otp_data, check_rate_limit, get_otp_data, delete_otp_data
from .managers import CustomUserManager
from .tasks import send_otp_email_task


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


# Serializer for requesting to change phone number
class ChangePhoneRequestSerializer(serializers.Serializer):
    new_phone = serializers.CharField(max_length=15, write_only=True)

    # Only validate the new phone field
    def validate_new_phone(self, value):
        normalized = CustomUserManager().normalize_phone_number(value)
        user = self.context['request'].user

        # new phone same as current phone
        if user.phone == normalized:
            raise serializers.ValidationError(
            "شماره تلفن جدید نمیتواند همان شماره فعلی باشد."
        )

        # Check if new phone is registered already or not
        if User.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError(
            "این شماره تلفن قبلاً ثبت شده است."
        )

        # returns the new phone
        return normalized


    def save(self):
        user = self.context['request'].user
        email = user.email

        if not email:
            raise serializers.ValidationError(
                "برای این حساب کاربری ایمیل ثبت نشده است."
            )

        # Rate Limiting
        allowed, message = check_rate_limit(email)
        if not allowed:
            raise serializers.ValidationError(message)

        new_phone = self.validated_data['new_phone']
        otp = generate_otp()

        # Store in Redis
        store_otp_data(email, otp, new_phone)

        # Queue Email
        send_otp_email_task.delay(email, otp)

        send_otp(phone, code)
        return new_otp


# Serializer for verifying the phone number change
class ChangePhoneVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user = self.context['request'].user
        otp_data = get_otp_data(user.email)

        if not otp_data:
            raise serializers.ValidationError(
                "کد تأیید منقضی شده یا درخواست نشده است."
            )

        if otp_data['otp'] != attrs['code']:
            # Implement failed attempt limit here if needed
            raise serializers.ValidationError(
                "کد تأیید نادرست است."
            )

        attrs['new_phone'] = otp_data['new_phone']
        return attrs


    def save(self):
        user = self.context['request'].user

        user.phone = self.validated_data['new_phone']
        user.save(update_fields=['phone'])

        # Cleanup Redis
        delete_otp_data(user.email)

        return user
        











