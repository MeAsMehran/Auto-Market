
from rest_framework.exceptions import ValidationError
import datetime

###########################

def validate(data):

    title = data.get('title')
    brand = data.get('brand')
    model_name = data.get('model_name')
    year = data.get('year')
    price = data.get('price')
    mileage = data.get('mileage')
    fuel_type = data.get('fuel_type')
    transmission = data.get('transmission')
    body_type = data.get('body_type')
    condition = data.get('condition')
    color = data.get('color')
    city = data.get('city')
    description = data.get('description')
    is_featured = data.get('is_featured')
    features = data.get('features', [])

    if not title:
        raise ValidationError("عنوان آگهی الزامی است.")
    if len(title) > 200:
        raise ValidationError("عنوان آگهی نباید بیشتر از ۲۰۰ کاراکتر باشد.")

    if not brand:
        raise ValidationError("برند الزامی است.")

    if not model_name:
        raise ValidationError("مدل الزامی است.")

    current_year = datetime.date.today().year
    if not isinstance(year, int) or year < 1900 or year > current_year + 1:
        raise ValidationError("سال را درست وارد نمایید.")

    if price is None or price < 0:
        raise ValidationError("قیمت نمی‌تواند منفی باشد.")

    if mileage is None or mileage < 0:
        raise ValidationError("کارکرد نمی‌تواند منفی باشد.")
    if mileage > 2_000_000:
        raise ValidationError("کارکرد وارد شده غیرعادی است.")

    if description and len(description) < 10:
        raise ValidationError("توضیحات باید حداقل ۱۰ کاراکتر باشد.")

    for feat in features:
        if not isinstance(feat, str) or not feat.strip():
            raise ValidationError("هر امکان باید متن غیر خالی باشد.")

    return data

    



