
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

    try:
        phone = User.objects.normalize_phone_number(phone)
    except ValueError as e:
        raise ValidationError(str(e), status.HTTP_400_BAD_REQUEST)

    # Check length after normalization
    if len(phone) != 11:
        raise ValidationError("شماره تلفن باید ۱۱ رقم باشد. مثال: ۰۹۱۲۳۴۵۶۷۸۹", status.HTTP_400_BAD_REQUEST)

    data['phone'] = phone

    user = User.objects.filter(phone=phone).first()

    if not user:
        raise AuthenticationFailed("شماره تلفن یا رمز غلط است!", )

    if not user.check_password(password):
        raise AuthenticationFailed("شماره تلفن یا رمز غلط است!")

    return {'user' : user, 'phone' : phone}



