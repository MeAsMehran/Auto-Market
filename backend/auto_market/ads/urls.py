
from django.urls import path
from .views.car import CreateCarAdView, DetailCarAdView, ListCarAdView, DeleteCarAdView, UpdateCarAdView, ListMyCarAdView
from .views.image import CarImageUploadView, CarImageDeleteView, CarImageListView


urlpatterns = [

    path('cars/', ListCarAdView.as_view(), name='list-car-ad'),
    path('cars/create/', CreateCarAdView.as_view(), name='create-car-ad'),
    path('cars/delete/<int:car_id>/', DeleteCarAdView.as_view(), name='delete-car-ad'),
    path('cars/update/<int:car_id>/', UpdateCarAdView.as_view(), name='update-car-ad'),
    path('cars/<int:car_id>/', DetailCarAdView.as_view(), name='detail-car-ad'),
    path('cars/my-ads/', ListMyCarAdView.as_view(), name='list-my-car-ad'),

    path('cars/<int:car_id>/images/create/', CarImageUploadView.as_view(), name='car-image-upload'),
    path('cars/<int:car_id>/images/<int:image_id>/', CarImageDeleteView.as_view(), name='car-image-delete'),
    path('cars/<int:car_id>/images/list/', CarImageListView.as_view(), name='car-image-list'),

]

