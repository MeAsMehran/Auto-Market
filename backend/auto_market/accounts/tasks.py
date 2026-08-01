from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

######################################

@shared_task
def send_otp_email_task(email, otp):
    subject = "کد تأیید تغییر شماره تلفن"
    message = f"کد تأیید شما: {otp}\nاین کد تا ۵ دقیقه دیگر معتبر است."

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
