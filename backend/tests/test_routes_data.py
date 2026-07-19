"""Tests for /api/data/<source> - the service dispatch seam (ADR-008).

Adding a data source means writing a `fetch(**kwargs)` and adding one entry to
`SERVICES`. These tests cover the dispatch itself, so a new source only needs
its own service test plus a dispatch case here.
"""

from app.routes.data import SERVICES

GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
QUOTES_URL = 'https://zenquotes.io/api/random'
APOD_URL = 'https://api.nasa.gov/planetary/apod'


class TestDispatch:
    def test_weather_source_returns_weather_data(self, client, http_mock):
        http_mock.get(
            GEOCODE_URL,
            json={'results': [{'latitude': 37.7, 'longitude': -122.4, 'name': 'San Francisco'}]},
            status=200,
        )
        http_mock.get(
            FORECAST_URL,
            json={'current': {'temperature_2m': 18.0, 'relative_humidity_2m': 70, 'weather_code': 0}},
            status=200,
        )

        response = client.get('/api/data/weather')

        assert response.status_code == 200
        assert response.get_json()['description'] == 'Clear sky'

    def test_quote_source_returns_quote_data(self, client, http_mock):
        http_mock.get(QUOTES_URL, json=[{'q': 'A quote.', 'a': 'Someone'}], status=200)

        response = client.get('/api/data/quote')

        assert response.status_code == 200
        assert response.get_json() == {'text': 'A quote.', 'author': 'Someone'}

    def test_space_source_returns_apod_data(self, client, http_mock):
        http_mock.get(APOD_URL, json={'title': 'Pillars', 'media_type': 'image'}, status=200)

        response = client.get('/api/data/space')

        assert response.status_code == 200
        assert response.get_json()['title'] == 'Pillars'

    def test_placeholder_source_needs_no_external_call(self, client):
        response = client.get('/api/data/placeholder')

        assert response.status_code == 200
        assert response.get_json() == {'message': 'Nothing here yet!'}

    def test_every_registered_source_is_reachable(self, client, http_mock):
        """Guards against a SERVICES entry that is registered but not callable."""
        http_mock.get(GEOCODE_URL, json={'results': []}, status=200)
        http_mock.get(QUOTES_URL, status=500)
        http_mock.get(APOD_URL, status=500)

        for source in SERVICES:
            assert client.get(f'/api/data/{source}').status_code == 200, source


class TestUnknownSource:
    def test_unknown_source_returns_404(self, client):
        response = client.get('/api/data/nonexistent')

        assert response.status_code == 404

    def test_unknown_source_names_the_source_in_the_error(self, client):
        response = client.get('/api/data/nonexistent')

        assert response.get_json() == {'error': 'Unknown source: nonexistent'}

    def test_a_card_source_with_no_service_fails_closed(self, client):
        """Backend and frontend registries are coupled only by the source string.

        If they drift, the documented failure mode (ADR-008) is a 404 plus a
        frontend placeholder - not a crash.
        """
        assert client.get('/api/data/todo').status_code == 404


class TestConfigForwarding:
    def test_query_params_are_forwarded_to_the_service(self, client, http_mock):
        http_mock.get(
            GEOCODE_URL,
            json={'results': [{'latitude': 42.3, 'longitude': -71.0, 'name': 'Boston'}]},
            status=200,
        )
        http_mock.get(
            FORECAST_URL,
            json={'current': {'temperature_2m': 5.0, 'relative_humidity_2m': 60, 'weather_code': 0}},
            status=200,
        )

        response = client.get('/api/data/weather?city=Boston')

        assert 'name=Boston' in http_mock.calls[0].request.url
        assert response.get_json()['city'] == 'Boston'

    def test_unrecognized_query_params_are_absorbed(self, client, http_mock):
        """Services take **_kwargs, so a stale card config cannot 500 the route."""
        http_mock.get(QUOTES_URL, json=[{'q': 'A quote.', 'a': 'Someone'}], status=200)

        assert client.get('/api/data/quote?stale=param&another=1').status_code == 200


class TestUpstreamFailureIsAbsorbed:
    """ADR-009: the route stays 200 with fallback data when an upstream is down."""

    def test_weather_upstream_failure_still_returns_200(self, client, http_mock):
        http_mock.get(GEOCODE_URL, status=500)

        response = client.get('/api/data/weather')

        assert response.status_code == 200
        assert response.get_json()['fallback'] is True

    def test_quote_upstream_failure_still_returns_200(self, client, http_mock):
        http_mock.get(QUOTES_URL, status=500)

        response = client.get('/api/data/quote')

        assert response.status_code == 200
        assert response.get_json()['fallback'] is True

    def test_space_upstream_failure_still_returns_200(self, client, http_mock):
        http_mock.get(APOD_URL, status=500)

        response = client.get('/api/data/space')

        assert response.status_code == 200
        assert response.get_json()['fallback'] is True
