
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import UserRegisterSerializer , UserLoginSerializer , UserSerializer

from drf_spectacular.utils import extend_schema

from .helper import set_refresh_cookie

#################################

class RegisterView(APIView):
    
    @extend_schema(
        request=UserRegisterSerializer,
        responses={201: UserSerializer,}
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data = request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = True
            user.save(update_fields=['is_active'])
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):

    @extend_schema(
        request=UserLoginSerializer,
        responses={200: None},  # returns { access, user }
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





