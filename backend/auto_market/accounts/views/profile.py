
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from ..serializers import UserSerializer , UserUpdateSerializer, ChangePhoneRequestSerializer, ChangePhoneVerifySerializer

###########################

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: UserSerializer},
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateMeView(APIView):
    permission_classes = [IsAuthenticated]
    # serializer_class = UserUpdateSerializer       # does nothing in APIView
    
    @extend_schema(
        request=UserUpdateSerializer,
        responses={200: UserSerializer}
    )
    def patch(self, request):
        serializer = UserUpdateSerializer(
            instance=request.user,  # passing the current logged in user data to serializer
            data=request.data,
            partial=True,       # Optional: allows updating only some fields
        )

        if serializer.is_valid():
            user = request.user     # getting the current logged in user
            user.name = serializer.validated_data.get('name', user.name)        # the second one is default value
            user.email = serializer.validated_data.get('email', user.email)
            try:
                user.save()
            except Exception as e:
                return Response(
                    {"detail": "Could not update user.", "error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePhoneRequestView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
            request=ChangePhoneRequestSerializer,
            responses={200, None}
    )
    def post(self, request):
        serializer = ChangePhoneRequestSerializer(data=request.data, context={'request' : request})

        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'کد تأیید به شماره جدید ارسال شد.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePhoneVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
            request=ChangePhoneVerifySerializer,
            responses={200, UserSerializer}
    )
    def post(self, request):
        serializer = ChangePhoneVerifySerializer(data=request.data, context={'request' : request})
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                    'detail': 'شماره تلفن با موفقیت تغییر کرد.',
                    'user': UserSerializer(user).data,},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




