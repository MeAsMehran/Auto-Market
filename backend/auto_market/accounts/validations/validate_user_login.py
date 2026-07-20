
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from ..models import User


def validate(data):

    phone = data.get('phone')
    password = data.get('password')

    if not phone:
        raise ValidationError("Please Enter Your Phone Number.", status.HTTP_400_BAD_REQUEST)

    if not password:
        raise ValidationError("Please Enter Your Password.", status.HTTP_400_BAD_REQUEST)

    phone = User.objects.normalize_phone_number(phone)
    data['phone'] = phone

    user = User.objects.filter(phone=phone).first()

    if not user:
        raise AuthenticationFailed("User not found or invalid password", )

    if not user.check_password(password):
        raise AuthenticationFailed("User not found or invalid password")

    return {'user' : user, 'phone' : phone}



