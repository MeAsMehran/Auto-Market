
from rest_framework.exceptions import ValidationError
from rest_framework.views import status
from ..models import User

##########################

def validate(data):

    phone = data.get('phone')
    name = data.get('name')
    email = data.get('email')

    date_joined = data.get('date_joined')
    is_active = data.get('is_active')
    is_staff = data.get('is_staff')

    password = data.get('password')
    confirm_password = data.get('confirm_password')


    if phone is None:
        raise ValidationError("Please Enter Your Phone Number.", status.HTTP_400_BAD_REQUEST)
    
    if name is None:
        raise ValidationError("Please Enter Your Name.", status.HTTP_400_BAD_REQUEST)

    if password is None:
        raise ValidationError("Please Enter Password", status.HTTP_400_BAD_REQUEST)

    if confirm_password is None:
        raise ValidationError("Please Enter confirm password", status.HTTP_400_BAD_REQUEST)

    if password is not None and confirm_password is not None:
        if password != confirm_password:
            raise ValidationError("Password and confirm password does not match", status.HTTP_400_BAD_REQUEST)


    # Normalizing the phone format (catch ValueError)
    try:
        phone = User.objects.normalize_phone_number(phone)
    except ValueError as e:
        raise ValidationError(str(e), status.HTTP_400_BAD_REQUEST)


    # Check length after normalization (Iranian mobile = 11 digits: 09xxxxxxxxx)
    if len(phone) != 11:
        raise ValidationError("شماره تلفن باید ۱۱ رقم باشد. مثال: ۰۹۱۲۳۴۵۶۷۸۹", status.HTTP_400_BAD_REQUEST)


    # phone = User.objects.normalize_phone_number(phone)
    data['phone'] = phone
    user = User.objects.filter(phone=phone).first()
    if user:
        raise ValidationError("A user with this phone number exists")

    return data







