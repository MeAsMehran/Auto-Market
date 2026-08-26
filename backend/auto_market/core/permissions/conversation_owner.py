
from rest_framework.permissions import BasePermission

##############################

class ConversationOwner(BasePermission):

    def has_object_permission(self, request, view, obj):
        return (request.user and
                request.user.is_authenticated and 
                (obj.seller == request.user or obj.buyer == request.user))
                
