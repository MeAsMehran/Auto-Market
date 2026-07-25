
from django.urls import path
from .views import (
        RegisterView,
        LoginView,
        MeView,
        CookieTokenRefreshView,
        LogoutView,
        UpdateMeView,
        ChangePhoneRequestView,
        ChangePhoneVerifyView,
    )

#################################

urlpatterns = [

    path('auth/accounts/register/', RegisterView.as_view(), name='register'),
    path('auth/accounts/login/', LoginView.as_view(), name='login'),
    path('auth/accounts/me/', MeView.as_view(), name='me'),
    path('auth/accounts/logout/', LogoutView.as_view(), name='logout'),

    path('auth/accounts/refresh/', CookieTokenRefreshView.as_view(), name='refresh'),

    path('auth/accounts/update-me/', UpdateMeView.as_view(), name='update_me'),
    path('auth/accounts/change-phone/', ChangePhoneRequestView.as_view(), name='change_phone'),
    path('auth/accounts/change-phone/verify/', ChangePhoneVerifyView.as_view(), name='change_phone_verify'),

]



