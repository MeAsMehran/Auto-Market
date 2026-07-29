
from django.db import models
from django.conf import settings

# Create your models here.

###############################

class Car(models.Model):

    FUEL_CHOICES = [
        ('petrol', 'بنزینی'),
        ('diesel', 'دیزلی'),
        ('hybrid', 'هیبرید'),
        ('electric', 'برقی'),
        ('plug_in_hybrid', 'پلاگین هیبرید'),
    ]
    TRANSMISSION_CHOICES = [
        ('automatic', 'اتوماتیک'),
        ('manual', 'دستی'),
        ('cvt', 'CVT'),
        ('semi_automatic', 'نیمه اتوماتیک'),
    ]
    CONDITION_CHOICES = [
        ('new', 'نو'),
        ('excellent', 'عالی'),
        ('good', 'خوب'),
        ('fair', 'مناسب'),
        ('needs_repair', 'نیاز به تعمیر'),
    ]
    BODY_CHOICES = [
        ('sedan', 'سدان'),
        ('suv', 'شاسی‌بلند'),
        ('hatchback', 'هاچ‌بک'),
        ('crossover', 'کراس‌اوور'),
        ('pickup', 'وانت'),
        ('coupe', 'کوپه'),
    ]
    COLOR_CHOICES = [
        ('white', 'سفید'),
        ('black', 'مشکی'),
        ('silver', 'نقره‌ای'),
        ('gray', 'خاکستری'),
        ('blue', 'آبی'),
        ('red', 'قرمز'),
        ('green', 'سبز'),
        ('yellow', 'زرد'),
        ('brown', 'قهوه‌ای'),
        ('orange', 'نارنجی'),
        ('other', 'سایر'),
    ]
    CITY_CHOICES = [
        ('tehran', 'تهران'),
        ('isfahan', 'اصفهان'),
        ('mashhad', 'مشهد'),
        ('tabriz', 'تبریز'),
        ('shiraz', 'شیراز'),
        ('karaj', 'کرج'),
        ('ahvaz', 'اهواز'),
        ('qom', 'قم'),
        ('kermanshah', 'کرمانشاه'),
        ('urmia', 'ارومیه'),
        ('rasht', 'رشت'),
        ('zahedan', 'زاهدان'),
        ('hamedan', 'همدان'),
        ('yazd', 'یزد'),
        ('ardabil', 'اردبیل'),
        ('bandar_abbas', 'بندرعباس'),
        ('kerman', 'کرمان'),
        ('sanandaj', 'سنندج'),
        ('bojnord', 'بجنورد'),
        ('sari', 'ساری'),
        ('bushehr', 'بوشهر'),
        ('arak', 'اراک'),
        ('zanjan', 'زنجان'),
        ('qazvin', 'قزوین'),
        ('khorramabad', 'خرم‌آباد'),
        ('birjand', 'بیرجند'),
        ('noshehr', 'نوشهر'),
        ('gorgan', 'گرگان'),
        ('ilam', 'ایلام'),
        ('semnan', 'سمنان'),
        ('kashan', 'کاشان'),
    ]

    seller        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cars')
    title         = models.CharField(max_length=200, blank=False, null=False)
    brand         = models.CharField(max_length=50, blank=False, null=False)
    model_name    = models.CharField(max_length=50, blank=False, null=False)
    year          = models.PositiveIntegerField()
    price         = models.PositiveIntegerField()       # In Tomans
    mileage       = models.PositiveIntegerField()     # In Kilometer
    fuel_type     = models.CharField(max_length=20, choices=FUEL_CHOICES, blank=False, null=False)
    transmission  = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES)
    body_type     = models.CharField(max_length=20, choices=BODY_CHOICES)
    condition     = models.CharField(max_length=20, choices=CONDITION_CHOICES)
    color         = models.CharField(max_length=20, choices=COLOR_CHOICES)
    city          = models.CharField(max_length=20, choices=CITY_CHOICES)
    description   = models.TextField()
    features      = models.JSONField(default=list, blank=True)
    is_featured   = models.BooleanField(default=False)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    # vin = 

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class CarImage(models.Model):

    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images')
    image      = models.FileField(upload_to='car_images/%Y/%m/')
    order      = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Image {self.order} for {self.car.title}"


class Favorite(models.Model):

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'car')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} → {self.car.title}"


