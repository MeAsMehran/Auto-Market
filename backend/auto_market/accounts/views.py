from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserRegisterSerializer, UserLoginSerializer, UserSerializer

from drf_spectacular.utils import extend_schema


# Create your views here.

class RegisterView(APIView):
    
    @extend_schema(
        request=UserRegisterSerializer,
        responses={201: UserRegisterSerializer},
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
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
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=200)

        return Response(serializer.errors, status=400)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: UserSerializer},
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)



















