from django.db import models, IntegrityError
from django.conf import settings
from ads.models import Car

###########################################

"""
instead of MessageStatus model we could use this with status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')

STATUS_CHOICES = [
    ('sent', 'Sent'),
    ('delivered', 'Delivered'),
    ('seen', 'Seen'),
]
"""

class MessageStatus(models.TextChoices):
    SENT = 'sent'
    DELIVERED = 'delivered'
    SEEN = 'seen'

class Conversation(models.Model):

    car_ad     = models.ForeignKey(to=Car, on_delete=models.CASCADE, related_name='conversations')

    buyer      = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_conversations')
    seller     = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_conversations')

    unread_count = models.PositiveIntegerField(default=0)

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

    STATUS_CHOICES = MessageStatus.choices

    conversation  = models.ForeignKey(to=Conversation, on_delete=models.CASCADE, related_name='conversation_messages')
    sender_user   = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender_user_messages')
    receiver_user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver_user_messages')

    message_text  = models.TextField(max_length=10000, blank=False, null=False)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=MessageStatus.SENT)
    is_read       = models.BooleanField(default=False)

    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            # ============================================
            # INDEX 1: Basic conversation filtering
            # ============================================
            # Purpose: Quick lookup of all messages in a conversation
            # Query: Message.objects.filter(conversation=conv)
            # Without index: Full table scan of millions of rows
            # With index: Direct B-tree lookup
            # models.Index(fields=['conversation'], name='idx_message_conversation'),       # Django automatically creates indexes on all ForeignKey fields

            # ============================================
            # INDEX 2: Cursor pagination (NEWEST messages first)
            # ============================================
            # Purpose: Efficient pagination when loading message history
            # Query: Message.objects.filter(conversation=conv).order_by('-created_at')[:50]
            #         Message.objects.filter(conversation=conv, created_at__lt=cursor).order_by('-created_at')[:50]
            # Why DESC (-): We want newest messages first, oldest at the end
            # The dash (-) means descending order so newest comes first
            # This is a COMPOUND index - conversation narrows it down, then created_at sorts
            models.Index(fields=['conversation', '-created_at'], name='idx_message_conv_date'),

            # ============================================
            # INDEX 3: Mark messages as read
            # ============================================
            # Purpose: Quickly find unread messages for a specific conversation & receiver
            # Query: Message.objects.filter(
            #            conversation=conv,
            #            receiver_user=user,
            #            is_read=False
            #        ).update(is_read=True)
            # Why this order: conversation filters first (narrows to ~10k msgs),
            #                  then receiver_user narrows further (~5k),
            #                  then is_read=False finds only unread (~10)
            models.Index(fields=['conversation', 'receiver_user', 'is_read'], name='idx_message_unread'),

            # ============================================
            # INDEX 4: WebSocket real-time status updates
            # ============================================
            # Purpose: Find sent/delivered messages that need to be marked as seen
            # Query: Message.objects.filter(
            #            conversation=conv,
            #            receiver_user=user,
            #            status__in=['sent', 'delivered']
            #        ).exclude(id__gt=last_seen_id).update(status='seen')
            # Why status: We filter by status (SENT or DELIVERED only)
            # The order matters: conversation -> receiver_user -> status
            # This allows efficient lookup of messages pending to be marked "seen"
            models.Index(fields=['conversation', 'receiver_user', 'status'], name='idx_message_conv_recv_status'),
            ]

    """
    Visual: How Each Query Uses Its Index
    INDEX 1: idx_message_conversation
    ┌─────────────────────────────────┐
    │ conversation = 11               │
    │   ↓                              │
    │  [msg1] [msg2] [msg3] ...       │
    └─────────────────────────────────┘

    INDEX 2: idx_message_conv_date (conversation + created_at DESC)
    ┌─────────────────────────────────┐
    │ conversation = 11               │
    │   ↓  ORDER BY created_at DESC   │
    │  [msg100] [msg99] [msg98] ...   │
    └─────────────────────────────────┘

    INDEX 3: idx_message_unread (conversation + receiver_user + is_read)
    ┌────────────────────────────────────────────────┐
    │ conversation = 11  AND  receiver_user = 7      │
    │   ↓  AND  is_read = False                     │
    │  [unread_msg1] [unread_msg2] ...              │
    └────────────────────────────────────────────────┘

    INDEX 4: idx_message_conv_recv_status (conversation + receiver_user + status)
    ┌─────────────────────────────────────────────────────┐
    │ conversation = 11  AND  receiver_user = 7          │
    │   ↓  AND  status IN ('sent', 'delivered')          │
    │  [msg_s1] [msg_d2] [msg_s3] ...                   │
    └─────────────────────────────────────────────────────┘
    """

    def __str__(self):
        return self.message_text

