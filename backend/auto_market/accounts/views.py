from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, status


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .serializers import UserRegisterSerializer, UserLoginSerializer, UserSerializer

from drf_spectacular.utils import extend_schema

# Permissions:
from rest_framework.permissions import IsAuthenticated

# Create your views here.

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
        max_age=int(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', 7 * 24 * 60 * 60).total_seconds()),
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


class RegisterView(APIView):
    
    @extend_schema(
        request=UserRegisterSerializer,
        responses={201: {'access' : 'string'}},
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = True
            user.save(update_fields=['is_active'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):

    @extend_schema(
        request=UserLoginSerializer,
        responses={201: UserLoginSerializer},
    )
    def post(self, request):
        serializer = UserLoginSerializer(data = request.data)
        if serializer.is_valid():
            # get the user from the validated data
            user = serializer.validated_data.get('user')

            # creating rew refresh token and set it in Response return
            refresh = RefreshToken.for_user(user)

            response = Response({
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
            }, status=status.HTTP_200_OK)

            # Set refresh token in httpOnly cookie
            return set_refresh_cookie(response, str(refresh))

        return Response(serializer.errors, status=400)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: UserSerializer},
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


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








