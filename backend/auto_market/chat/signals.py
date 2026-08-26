
from django.db.models import F
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Message


@receiver(post_save, sender=Message)
def update_unread_on_message_save(sender, instance, created, **kwargs):
    if created and not instance.is_read:
        if instance.receiver_user == instance.conversation.buyer:
            from .models import Conversation
            Conversation.objects.filter(pk=instance.conversation_id).update(
                unread_count=F('unread_count') + 1
            )


@receiver(post_delete, sender=Message)
def update_unread_on_message_delete(sender, instance, **kwargs):
    if not instance.is_read and instance.receiver_user == instance.conversation.buyer:
        from .models import Conversation
        Conversation.objects.filter(
            pk=instance.conversation_id,
            unread_count__gte=1
        ).update(unread_count=F('unread_count') - 1)
