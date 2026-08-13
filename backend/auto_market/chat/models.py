from django.db import models, IntegrityError
from django.conf import settings
from ads.models import Car

# Create your models here.

class Conversation(models.Model):

    car_ad     = models.ForeignKey(to=Car, on_delete=models.CASCADE, related_name='conversations')

    buyer      = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_conversations')
    seller     = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_conversations')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['car_ad', 'buyer', 'seller']

    def save(self, *args, **kwargs):
        if self.buyer == self.seller:
            raise IntegrityError("Buyer and Seller cannot be the same!")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Chat about {self.car_ad.title} between {self.buyer.name} and {self.seller.name}"


class Message(models.Model):

    conversation  = models.ForeignKey(to=Conversation, on_delete=models.CASCADE, related_name='conversation_messages')
    sender_user   = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender_user_messages')
    receiver_user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver_user_messages')

    message_text  = models.TextField(max_length=10000, blank=False, null=False)
    is_read       = models.BooleanField(default=False)

    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.message_text

