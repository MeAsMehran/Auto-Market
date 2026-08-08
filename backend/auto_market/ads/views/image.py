
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound

from core.permissions.is_owner import IsCarOwner

from django.shortcuts import get_object_or_404

from ..serializers.image_serializer import CreateCarImageSerializer, DetailCarImageSerializer

from ..models import Car, CarImage

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

#########################################

'''
View	Method	Auth	Purpose
CarImageUploadView	POST	IsAuthenticated (owner)	Upload image(s) to a car via multipart
'''


class CarImageUploadView(APIView):
    permission_classes = [IsAuthenticated , IsCarOwner]

    @extend_schema(
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'image': {'type': 'string', 'format': 'binary'},
                'order': {'type': 'integer', 'default': 0},
            },
            'required': ['image'],
        }
    },
    responses={201: CreateCarImageSerializer},
    )
    def post(self, request, car_ad_id):
        car = get_object_or_404(Car, id=car_ad_id) 
        serializer = CreateCarImageSerializer(data=request.data, context={'car': car})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            

class CarImageDeleteView(APIView):
    permission_classes = [IsAuthenticated , IsCarOwner]
    
    
    @extend_schema(
    summary="Delete Car Image",
    description="Delete an image belonging to a car. Only the owner of the car can perform this action.",
    parameters=[
        OpenApiParameter(
            name="car_ad_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the car.",
        ),
        OpenApiParameter(
            name="image_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the image to delete.",
        ),
    ],
    responses={
        204: OpenApiResponse(description="Image deleted successfully."),
        401: OpenApiResponse(description="Authentication credentials were not provided."),
        403: OpenApiResponse(description="You do not have permission to delete this image."),
        404: OpenApiResponse(description="Car or image not found."),
    },
    )
    def delete(self, request, car_ad_id, image_id):
        car = get_object_or_404(Car, id=car_ad_id, seller=request.user)
        image = get_object_or_404(CarImage, id=image_id, car=car)
        image.image.delete(save=False)      # delete the actual file from storage
        image.delete()                      # delete the DB record
        return Response(status=status.HTTP_204_NO_CONTENT)


class CarImageListView(APIView):
    permission_classes = [AllowAny]
 
    @extend_schema(
        responses={200: DetailCarImageSerializer(many=True)},
        description="List all images for a specific car.",
    )
    def get(self, request, car_ad_id):
        try:
            car = Car.objects.get(id=car_ad_id, is_active=True)
        except Car.DoesNotExist:
            raise NotFound("آگهی یافت نشد.")

        images = car.images.all()
        serializer = DetailCarImageSerializer(images, many=True)
        return Response(serializer.data)





