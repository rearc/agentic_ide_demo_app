"""Tests for the weather service.

Reference for testing a two-call service: `fetch` geocodes the city, then asks
for the forecast. Both calls are registered on `http_mock`; nothing reaches the
network.
"""

from app.services import weather

GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'


def register_geocode(http_mock, results):
    http_mock.get(GEOCODE_URL, json={'results': results}, status=200)


def register_forecast(http_mock, temperature=18.3, humidity=72, weather_code=3):
    http_mock.get(
        FORECAST_URL,
        json={
            'current': {
                'temperature_2m': temperature,
                'relative_humidity_2m': humidity,
                'weather_code': weather_code,
            }
        },
        status=200,
    )


SF_RESULT = [{'latitude': 37.77, 'longitude': -122.42, 'name': 'San Francisco'}]


class TestHappyPath:
    def test_returns_current_conditions(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock, temperature=18.3, humidity=72, weather_code=3)

        result = weather.fetch(city='San Francisco')

        assert result == {
            'city': 'San Francisco',
            'temp': 18.3,
            'description': 'Overcast',
            'icon_emoji': '☁️',
            'humidity': 72,
        }

    def test_success_response_has_no_fallback_flag(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock)

        assert 'fallback' not in weather.fetch(city='San Francisco')

    def test_maps_weather_code_to_description_and_icon(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock, weather_code=95)

        result = weather.fetch(city='San Francisco')

        assert result['description'] == 'Thunderstorm'
        assert result['icon_emoji'] == '⛈️'

    def test_unrecognized_weather_code_degrades_to_generic_label(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock, weather_code=1234)

        result = weather.fetch(city='San Francisco')

        assert result['description'] == 'Unknown'
        assert result['icon_emoji'] == '🌡️'

    def test_uses_the_geocoders_canonical_city_name(self, http_mock):
        """The card is configured with 'sf'; the display name comes from the API."""
        register_geocode(http_mock, [{'latitude': 37.77, 'longitude': -122.42, 'name': 'San Francisco'}])
        register_forecast(http_mock)

        assert weather.fetch(city='sf')['city'] == 'San Francisco'

    def test_defaults_to_san_francisco_when_no_city_configured(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock)

        weather.fetch()

        assert 'name=San+Francisco' in http_mock.calls[0].request.url


class TestGracefulFallback:
    """ADR-009: a failing upstream must degrade to fallback data, never raise."""

    def test_unknown_city_returns_located_fallback(self, http_mock):
        register_geocode(http_mock, [])

        result = weather.fetch(city='Nowhereville')

        assert result['fallback'] is True
        assert result['description'] == 'Could not find location: Nowhereville'
        assert result['city'] == 'Nowhereville'
        assert result['temp'] == '--'

    def test_geocode_http_error_returns_fallback(self, http_mock):
        http_mock.get(GEOCODE_URL, status=500)

        result = weather.fetch(city='San Francisco')

        assert result['fallback'] is True
        assert result['description'] == 'Weather data unavailable'

    def test_forecast_http_error_returns_fallback(self, http_mock):
        register_geocode(http_mock, SF_RESULT)
        http_mock.get(FORECAST_URL, status=503)

        result = weather.fetch(city='San Francisco')

        assert result['fallback'] is True
        assert result['description'] == 'Weather data unavailable'

    def test_malformed_forecast_payload_returns_fallback(self, http_mock):
        """A 200 with an unexpected shape must not escape as a KeyError."""
        register_geocode(http_mock, SF_RESULT)
        http_mock.get(FORECAST_URL, json={'unexpected': 'shape'}, status=200)

        assert weather.fetch(city='San Francisco')['fallback'] is True

    def test_network_failure_returns_fallback(self, http_mock):
        """No registration at all: the request raises ConnectionError."""
        result = weather.fetch(city='San Francisco')

        assert result['fallback'] is True
        assert result['description'] == 'Weather data unavailable'

    def test_fallback_carries_the_same_keys_as_a_success(self, http_mock):
        """Convention: a fallback dict matches the success shape plus `fallback`.

        The frontend renders one component off both, so a missing key is a crash.
        """
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock)
        success = weather.fetch(city='San Francisco')

        weather._geocode.cache_clear()
        http_mock.reset()
        http_mock.get(GEOCODE_URL, status=500)
        fallback = weather.fetch(city='San Francisco')

        assert set(fallback) - {'fallback'} == set(success)


class TestGeocodeCaching:
    def test_repeated_lookups_of_one_city_hit_the_geocoder_once(self, http_mock):
        """`_geocode` is lru_cache'd, so the second fetch reuses the coordinates."""
        register_geocode(http_mock, SF_RESULT)
        register_forecast(http_mock)
        register_forecast(http_mock)

        weather.fetch(city='San Francisco')
        weather.fetch(city='San Francisco')

        geocode_calls = [c for c in http_mock.calls if 'geocoding-api' in c.request.url]
        assert len(geocode_calls) == 1
