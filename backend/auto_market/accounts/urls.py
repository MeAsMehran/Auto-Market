
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
        RegisterView,
        LoginView,
        MeView,
    )

urlpatterns = [

    path('auth/accounts/register/', RegisterView.as_view(), name='register'),
    path('auth/accounts/login/', LoginView.as_view(), name='login'),
    path('auth/ccounts/me/', MeView.as_view(), name='me'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),       # this is for refreshing the jwt token

]



