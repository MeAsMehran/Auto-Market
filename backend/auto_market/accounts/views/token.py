
from django.conf import settings

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from drf_spectacular.utils import extend_schema

from .helper import set_refresh_cookie, delete_refresh_cookie


###########################################

class CookieTokenRefreshView(APIView):
    """Refresh access token using refresh token from httpOnly cookie"""
    authentication_classes = []

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

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})

        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, ValidationError):
            response = Response(
                {'detail': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            return delete_refresh_cookie(response)

        # When ROTATE_REFRESH_TOKENS=True, serializer returns both access and refresh
        new_access = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh', refresh_token)

        response = Response({'access': new_access}, status=status.HTTP_200_OK)
        return set_refresh_cookie(response, new_refresh)



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



