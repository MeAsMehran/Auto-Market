import random

from django.contrib.auth import get_user_model

from ads.models import Car

User = get_user_model()


def create_car_ad_objects():
    seller, _ = User.objects.get_or_create(
        phone='09134567656',
        defaults={
            'name': 'temp user',
            'password': 'pbkdf2_sha256$temp',
            'is_active': True,
        },
    )

    number = 10000
    for num in range(number):
        Car.objects.create(
            seller       = seller,
            title        = f"post number {num}",
            brand        = "Mersedes",
            model_name   = "X34",
            year         = 2010,
            price        = 222222,
            mileage      = 12313,
            fuel_type    = random.choice(Car.FUEL_CHOICES)[0],
            transmission = random.choice(Car.TRANSMISSION_CHOICES)[0],
            body_type    = "pickup",
            condition    = random.choice(Car.CONDITION_CHOICES)[0],
            color        = random.choice(Car.COLOR_CHOICES)[0],
            description  = "sdfasdfasfasfasfasfasfasfasf",
            city         = random.choice(Car.CITY_CHOICES)[0],
        )


create_car_ad_objects()
