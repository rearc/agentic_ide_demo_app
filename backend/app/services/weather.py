import logging
from functools import lru_cache

import requests

logger = logging.getLogger(__name__)

GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

WEATHER_CODE_DESCRIPTIONS = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
}

WEATHER_CODE_ICONS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌦️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
}


def _fallback(city, description):
    return {
        'fallback': True,
        'city': city,
        'temp': '--',
        'description': description,
        'icon_emoji': '❓',
        'humidity': None,
    }


@lru_cache(maxsize=128)
def _geocode(city):
    resp = requests.get(
        GEOCODE_URL,
        params={'name': city, 'count': 1},
        timeout=5,
    )
    resp.raise_for_status()
    results = resp.json().get('results')
    if not results:
        return None
    loc = results[0]
    return (loc['latitude'], loc['longitude'], loc.get('name', city))


def fetch(city='San Francisco', **_kwargs):
    try:
        geo = _geocode(city)
        if not geo:
            return _fallback(city, f'Could not find location: {city}')

        lat, lon, name = geo
        resp = requests.get(
            FORECAST_URL,
            params={
                'latitude': lat,
                'longitude': lon,
                'current': 'temperature_2m,relative_humidity_2m,weather_code',
            },
            timeout=5,
        )
        resp.raise_for_status()
        current = resp.json()['current']
        code = current['weather_code']

        return {
            'city': name,
            'temp': current['temperature_2m'],
            'description': WEATHER_CODE_DESCRIPTIONS.get(code, 'Unknown'),
            'icon_emoji': WEATHER_CODE_ICONS.get(code, '🌡️'),
            'humidity': current['relative_humidity_2m'],
        }
    except Exception:
        logger.exception('Failed to fetch weather for %s', city)
        return _fallback(city, 'Weather data unavailable')
