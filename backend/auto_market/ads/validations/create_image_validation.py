
from rest_framework.exceptions import ValidationError

##########################

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB


def validate(data):
    
    image = data.get('image')

    if image.size > MAX_IMAGE_SIZE:
        raise ValidationError("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.")

    return data
