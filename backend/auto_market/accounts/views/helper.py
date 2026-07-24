
from django.conf import settings
from datetime import timedelta

#####################################################

def set_refresh_cookie(response, refresh_token):
    """Helper to set httpOnly refresh token cookie"""
    cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token')
    response.set_cookie(
        key=cookie_name,
        value=refresh_token,
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', not settings.DEBUG),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
        domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None),
        max_age=int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7)).total_seconds()),
    )
    return response


def delete_refresh_cookie(response):
    """Helper to delete refresh token cookie on logout"""
    cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token')
    response.delete_cookie(
        key=cookie_name,
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
        domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
    )
    return response


