
from rest_framework import serializers

##########################################################

class AddFavoriteAdSerializer(serializers.Serializer):
    pass


'''
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    car        = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
'''

