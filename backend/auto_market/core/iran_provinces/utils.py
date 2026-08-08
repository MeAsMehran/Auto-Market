
from .data import PROVINCE_CITY_MAP, ALL_CITIES

# Cache for O(1) city → province lookup
_CITY_TO_PROVINCE = {city: province for province, cities in PROVINCE_CITY_MAP.items() for city in cities}


def get_cities_for_province(province: str) -> list:
    """Return list of cities for a given province."""
    return PROVINCE_CITY_MAP.get(province, [])

def get_province_for_city(city: str) -> str | None:
    """Find which province a city belongs to — O(1) lookup."""
    return _CITY_TO_PROVINCE.get(city)

def validate_province_city(province: str, city: str) -> tuple:
    """Validate that city belongs to the province. Returns (is_valid, error)."""
    if province not in PROVINCE_CITY_MAP:
        return False, f"استان '{province}' یافت نشد"
    if city not in PROVINCE_CITY_MAP[province]:
        return False, f"شهر '{city}' در استان '{province}' وجود ندارد"
    return True, None

def is_valid_city(city: str) -> bool:
    """Check if city is a valid Iranian city."""
    return city in _CITY_TO_PROVINCE
