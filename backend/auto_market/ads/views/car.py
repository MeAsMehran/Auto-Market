
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound

from drf_spectacular.utils import extend_schema

from core.permissions.is_owner import IsCarOwner
from core.pagination.pagination import SmallPageNumberPagination

from ..serializers.car_serializer import CreateCarAdSerializer, DetailCarAdSerializer, ListCarAdSerializer, UpdateCarAdSerializer

from ..models import Car
from ..filters import CarFilter

###############################

'''
View	        Method	        Auth	            Purpose

CarListView	    GET	        AllowAny	        List cars with filters (CarFilter), pagination
CarDetailView	GET	        AllowAny	        Single car with nested images, seller info
CarCreateView	POST	    IsAuthenticated	    Create car from CreateCarSerializer
CarUpdateView	PATCH	    IsAuthenticated     (owner)	Update car
CarDeleteView	DELETE	    IsAuthenticated     (owner)	Soft-delete (set is_active=False)
MyListingsView	GET	        IsAuthenticated	    List current user's cars
'''


class CreateCarAdView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CreateCarAdSerializer,
        responses={201: DetailCarAdSerializer,}
    )
    def post(self, request):
        serializer = CreateCarAdSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            car = serializer.save()
            response = DetailCarAdSerializer(car, context={'request': request})
            return Response(response.data, status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCarAdView(APIView):
    permission_classes = [IsAuthenticated , IsCarOwner]
    
    @extend_schema(
    responses={204: None},
    description="Soft-delete a car ad. Sets is_active=False. Only the car owner can delete their ad.",
    )
    def delete(self, request, car_id):
        car = get_object_or_404(Car, pk=car_id, is_active=True)
        car.is_active = False
        car.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class DetailCarAdView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
    responses={200: DetailCarAdSerializer},
    )
    def get(self, request, car_id):
        try:
            car = Car.objects.select_related('seller').prefetch_related('images').get(
                id=car_id, is_active=True
            )
        except Car.DoesNotExist:
            raise NotFound("آگهی یافت نشد.")
        serializer = DetailCarAdSerializer(car, context={'request': request})
        return Response(serializer.data)


class ListCarAdView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: ListCarAdSerializer(many=True)},
    )
    def get(self, request):
        # cars = Car.objects.filter(is_active=True).prefetch_related('images')
        cars = Car.objects.filter(is_active=True).select_related('seller').prefetch_related('images')

        # Apply filters
        car_filter = CarFilter(request.query_params, queryset=cars)
        filtered_qs = car_filter.qs

        # Paginate
        paginator = SmallPageNumberPagination()     # 5 car ads per page
        page = paginator.paginate_queryset(filtered_qs, request)
        serializer = ListCarAdSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class UpdateCarAdView(APIView):
    permission_classes = [IsAuthenticated , IsCarOwner]

    @extend_schema(
        request=UpdateCarAdSerializer,
        responses={200: UpdateCarAdSerializer},
    )
    def patch(self, request, car_id):
        car_ad = get_object_or_404(Car, pk=car_id, seller=request.user)
        serializer = UpdateCarAdSerializer(car_ad, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListMyCarAdView(APIView):
    permission_classes = [IsAuthenticated]
    # pagination_class = SmallPageNumberPagination

    def get(self, request):
        current_user = request.user
        car_ads = Car.objects.filter(
            seller=current_user
        ).select_related('seller').prefetch_related('images')
        paginator = SmallPageNumberPagination()
        page = paginator.paginate_queryset(car_ads, request)
        serializer = ListCarAdSerializer(page, many=True, context={'request' : request})
        return paginator.get_paginated_response(serializer.data) 


class RestoreCarAdView(APIView):
    permission_classes = [IsAuthenticated , IsCarOwner]
    
    @extend_schema(
    responses={200: None},
    description="Restore a soft-deleted car ad. Sets is_active=True. Only the car owner can restore.",
    )
    def post(self, request, car_id):
        car_ad = get_object_or_404(Car, pk=car_id, is_active=False)
        car_ad.is_active = True
        car_ad.save(update_fields=['is_active'])
        return Response(status=status.HTTP_200_OK)


















