
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound

from drf_spectacular.utils import extend_schema

from core.permissions.is_owner import IsCarOwner

from ..serializers.car_serializer import CreateCarAdSerializer, DetailCarAdSerializer, ListCarAdSerializer

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


class CarListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: ListCarAdSerializer(many=True)},
    )
    def get(self, request):
        cars = Car.objects.filter(is_active=True).prefetch_related('images')

        # Apply filters
        car_filter = CarFilter(request.query_params, queryset=cars)
        filtered_qs = car_filter.qs

        # Paginate
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(filtered_qs, request)
        serializer = ListCarAdSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


'''
Still needed:
1. UpdateCarAdView — PATCH /cars/<id>/ (edit car details)
2. MyListingsView — GET /my-listings/ (list current user's cars)
These match the two remaining frontend API calls in carApi.js:
- updateCar(id, data) → PATCH /cars/${id}/
- getMyListings() → GET /my-listings/
'''









