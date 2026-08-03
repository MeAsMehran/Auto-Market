
import django_filters
from django.db.models import Q  

from .models import Car

################################################

class CarFilter(django_filters.FilterSet):
    # search     = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    search = django_filters.CharFilter(method='search_all_fields')

    min_price  = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price  = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    min_year = django_filters.NumberFilter(field_name='year', lookup_expr='gte')
    max_year = django_filters.NumberFilter(field_name='year', lookup_expr='lte')


    def search_all_fields(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(title__icontains=value) |
                Q(brand__icontains=value) |
                Q(model_name__icontains=value)
            )
        return queryset

    class Meta:
        model  = Car
        fields = ['brand', 'body_type', 'fuel_type', 'transmission', 'condition', 'city', 'year']




