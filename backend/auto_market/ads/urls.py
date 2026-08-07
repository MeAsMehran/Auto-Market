
from django.urls import path
from .views.car import CreateCarAdView, DetailCarAdView, ListCarAdView, DeleteCarAdView, UpdateCarAdView, ListMyCarAdView, RestoreCarAdView
from .views.image import CarImageUploadView, CarImageDeleteView, CarImageListView
from .views.favorite import AddFavoriteAdView, RemoveFavoriteAdView, ListFavoriteView
from .views.dashboard import DashboardView


urlpatterns = [

    # Ad Views:
    path('cars/', ListCarAdView.as_view(), name='list-car-ads'),
    path('cars/create/', CreateCarAdView.as_view(), name='create-car-ad'),
    path('cars/my-ads/', ListMyCarAdView.as_view(), name='list-my-car-ads'),
    path('cars/delete/<int:car_id>/', DeleteCarAdView.as_view(), name='delete-car-ad'),
    path('cars/update/<int:car_id>/', UpdateCarAdView.as_view(), name='update-car-ad'),
    path('cars/<int:car_id>/', DetailCarAdView.as_view(), name='detail-car-ad'),
    path('cars/restore-ad/<int:car_id>/', RestoreCarAdView.as_view(), name='restore-ad'),

    # Image Views:
    path('cars/<int:car_id>/images/create/', CarImageUploadView.as_view(), name='upload-car-image'),
    path('cars/<int:car_id>/images/<int:image_id>/', CarImageDeleteView.as_view(), name='delete-car-image'),
    path('cars/<int:car_id>/images/list/', CarImageListView.as_view(), name='list-car-image'),

    # Favorite Views:
    path('cars/add-favorite-ad/<int:car_ad_id>/', AddFavoriteAdView.as_view(), name='add-favorite-ad'),
    path('cars/remove-favorite-ad/<int:car_ad_id>/', RemoveFavoriteAdView.as_view(), name='remove-favorite-ad'),
    path('cars/list-favorite-ads/', ListFavoriteView.as_view(), name='list-favorite-ads'),

    # Dashboard View:
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

]

