
from rest_framework.exceptions import ValidationError
import datetime

from ..models import Car

###########################

def validate(data):

    title = data.get('title')
    year = data.get('year')
    price = data.get('price')
    mileage = data.get('mileage')
    description = data.get('description')
    features = data.get('features', [])
    detail_conditions = data.get('detail_conditions', {}) 

    if not title:
        raise ValidationError("عنوان آگهی الزامی است.")
    if len(title) > 200:
        raise ValidationError("عنوان آگهی نباید بیشتر از ۲۰۰ کاراکتر باشد.")

    current_year = datetime.date.today().year
    if not isinstance(year, int) or year < 1900 or year > current_year + 1:
        raise ValidationError("سال را درست وارد نمایید.")

    if price and price < 0:
        raise ValidationError("قیمت نمی‌تواند منفی باشد.")

    if mileage and mileage < 0:
        raise ValidationError("کارکرد نمی‌تواند منفی باشد.")
    if mileage and mileage > 2_000_000:
        raise ValidationError("کارکرد وارد شده غیرعادی است.")

    if description and len(description) < 10:
        raise ValidationError("توضیحات باید حداقل ۱۰ کاراکتر باشد.")

    for feat in features:
        if not isinstance(feat, str) or not feat.strip():
            raise ValidationError("هر امکان باید متن غیر خالی باشد.")   

    # detail_conditions_validation:
    for key , value in detail_conditions.items():
        if value not in dict(Car.CONDITION_CHOICES):
            raise ValidationError("Not a Valid Value!")


    return data

    



