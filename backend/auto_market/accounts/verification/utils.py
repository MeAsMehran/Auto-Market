
import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

####################################

def generate_otp(length=6):     # a parameter with default value of 6
    return ''.join(str(random.randint(0, 9)) for _ in range(length))

def get_otp_key(email, purpose="phone_change"):
    return f"otp:{purpose}:{email}"


def get_rate_limit_key(email, period="minute"):
    return f"ratelimit:{period}:{email}"


def store_otp_data(email, otp, new_phone, timeout=300):
    key = get_otp_key(email)
    data = {"otp": otp, "new_phone": new_phone}
    cache.set(key, data, timeout=timeout)


def get_otp_data(email):
    return cache.get(get_otp_key(email))


def delete_otp_data(email):
    cache.delete(get_otp_key(email))


def check_rate_limit(email):
    # Max 1 per minute
    min_key = get_rate_limit_key(email, "minute")
    if cache.get(min_key):
        return False, "لطفاً یک دقیقه صبر کنید."

    # Max 5 per hour
    hour_key = get_rate_limit_key(email, "hour")
    count = cache.get(hour_key) or 0
    if count >= 5:
        return False, "بیش از حد مجاز درخواست داده‌اید. یک ساعت بعد تلاش کنید."

    cache.set(min_key, True, timeout=60)
    cache.set(hour_key, count + 1, timeout=3600)

    return True, None

