
from django.urls import path
from .views.car import CreateCarAdView, DetailCarAdView, CarListView


urlpatterns = [

    path('cars/', CarListView.as_view(), name='list-car-ad'),
    path('cars/create/', CreateCarAdView.as_view(), name='create-car-ad'),
    path('cars/<int:car_id>/', DetailCarAdView.as_view(), name='detail-car-ad'),

]
