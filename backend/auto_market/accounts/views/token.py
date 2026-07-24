
from django.conf import settings

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from drf_spectacular.utils import extend_schema

from .helper import set_refresh_cookie, delete_refresh_cookie

###########################################

class CookieTokenRefreshView(APIView):
    """Refresh access token using refresh token from httpOnly cookie"""

    @extend_schema(
        responses={200: {'access': 'string'}},
    )
    def post(self, request):
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token')
        refresh_token = request.COOKIES.get(cookie_name)

        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not found in cookie'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            # Rotation happens automatically due to ROTATE_REFRESH_TOKENS=True
            new_refresh = str(refresh)
            new_access = str(refresh.access_token)

            response = Response({'access': new_access}, status=status.HTTP_200_OK)
            return set_refresh_cookie(response, new_refresh)

        except TokenError as e:
            response = Response(
                {'detail': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            return delete_refresh_cookie(response)



class LogoutView(APIView):
    """Blacklist refresh token and clear cookie"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'refresh_token')
        refresh_token = request.COOKIES.get(cookie_name)

        response = Response({'detail': 'Logged out successfully'}, status=status.HTTP_200_OK)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass  # Token already invalid/expired

        return delete_refresh_cookie(response)



