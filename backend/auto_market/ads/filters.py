
import django_filters
from .models import Car

################################################

class CarFilter(django_filters.FilterSet):
    search     = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    min_price  = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price  = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model  = Car
        fields = ['brand', 'body_type', 'fuel_type', 'transmission', 'condition', 'city', 'year']




