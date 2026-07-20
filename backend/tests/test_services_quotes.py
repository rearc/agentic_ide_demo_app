"""Tests for the quotes service - the simplest service shape (one call, no config)."""

import pytest

from app.services import quotes
from app.services.quotes import QUOTES_URL



@pytest.fixture
def success_payload(http_mock):
    """The service's response when the upstream is healthy."""
    http_mock.get(QUOTES_URL, json=[{'q': 'A quote.', 'a': 'Someone'}], status=200)
    return quotes.fetch()


@pytest.fixture
def fallback_payload(http_mock):
    """The service's response when the upstream fails."""
    http_mock.get(QUOTES_URL, status=500)
    return quotes.fetch()


class TestHappyPath:
    def test_returns_quote_text_and_author(self, http_mock):
        http_mock.get(
            QUOTES_URL,
            json=[{'q': 'Simplicity is the soul of efficiency.', 'a': 'Austin Freeman'}],
            status=200,
        )

        assert quotes.fetch() == {
            'text': 'Simplicity is the soul of efficiency.',
            'author': 'Austin Freeman',
        }

    def test_success_response_has_no_fallback_flag(self, http_mock):
        http_mock.get(QUOTES_URL, json=[{'q': 'A quote.', 'a': 'Someone'}], status=200)

        assert 'fallback' not in quotes.fetch()

    def test_missing_author_becomes_unknown(self, http_mock):
        http_mock.get(QUOTES_URL, json=[{'q': 'An unattributed quote.'}], status=200)

        assert quotes.fetch()['author'] == 'Unknown'

    def test_missing_text_becomes_empty_string(self, http_mock):
        http_mock.get(QUOTES_URL, json=[{'a': 'Someone'}], status=200)

        assert quotes.fetch()['text'] == ''

    def test_ignores_extra_quotes_in_the_payload(self, http_mock):
        http_mock.get(
            QUOTES_URL,
            json=[{'q': 'First.', 'a': 'A'}, {'q': 'Second.', 'a': 'B'}],
            status=200,
        )

        assert quotes.fetch()['text'] == 'First.'


class TestGracefulFallback:
    """ADR-009: a failing upstream must degrade to the canned quote, never raise."""

    def test_http_error_returns_fallback_quote(self, http_mock):
        http_mock.get(QUOTES_URL, status=500)

        assert quotes.fetch() == quotes.FALLBACK_QUOTE

    def test_network_failure_returns_fallback_quote(self, http_mock):
        assert quotes.fetch() == quotes.FALLBACK_QUOTE

    def test_empty_list_returns_fallback_quote(self, http_mock):
        http_mock.get(QUOTES_URL, json=[], status=200)

        assert quotes.fetch() == quotes.FALLBACK_QUOTE

    def test_unexpected_payload_shape_returns_fallback_quote(self, http_mock):
        http_mock.get(QUOTES_URL, json={'not': 'a list'}, status=200)

        assert quotes.fetch() == quotes.FALLBACK_QUOTE

    def test_invalid_json_returns_fallback_quote(self, http_mock):
        http_mock.get(QUOTES_URL, body='not json at all', status=200)

        assert quotes.fetch() == quotes.FALLBACK_QUOTE

    def test_fallback_is_flagged_for_the_frontend(self, http_mock):
        """QuoteCard renders an '(offline)' marker off this flag."""
        http_mock.get(QUOTES_URL, status=500)

        assert quotes.fetch()['fallback'] is True

    def test_fallback_carries_the_same_keys_as_a_success(
        self, success_payload, fallback_payload
    ):
        assert set(fallback_payload) - {'fallback'} == set(success_payload)

    def test_only_the_fallback_is_flagged(self, success_payload, fallback_payload):
        assert 'fallback' not in success_payload
        assert fallback_payload['fallback'] is True
