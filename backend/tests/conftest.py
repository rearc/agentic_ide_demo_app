"""Shared fixtures for the backend suite.

Two of these fixtures are autouse and exist to keep the suite deterministic:
`http_mock` makes an unmocked live HTTP call impossible, and
`clear_service_caches` stops one test's cached lookup from leaking into the next.
"""

import pytest
import responses as responses_lib

from app import create_app
from app import db as _db
from app.models.card import Card
from app.models.todo import Todo
from app.services import weather


@pytest.fixture
def app():
    """A Flask app bound to a fresh in-memory database, with an active app context.

    The schema is built and torn down per test, so no test can observe rows
    written by another.
    """
    flask_app = create_app('config.TestConfig')
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client for exercising routes."""
    return app.test_client()


@pytest.fixture
def db(app):
    """The SQLAlchemy handle, scoped to the per-test app context."""
    return _db


@pytest.fixture(autouse=True)
def http_mock():
    """Register expected HTTP payloads; block every request that is not registered.

    Autouse, so it applies even to tests that never mention it: a request to a
    URL no test registered raises ConnectionError rather than reaching the real
    Open-Meteo / ZenQuotes / NASA APIs. The suite is therefore safe to run
    offline and cannot fail because of someone else's rate limit.
    """
    with responses_lib.RequestsMock(assert_all_requests_are_fired=False) as mock:
        yield mock


@pytest.fixture(autouse=True)
def clear_service_caches():
    """Reset `weather._geocode`'s lru_cache around every test.

    Without this, a city geocoded in one test is served from the cache in the
    next, so the second test would silently not exercise the HTTP call it is
    meant to be testing.
    """
    weather._geocode.cache_clear()
    yield
    weather._geocode.cache_clear()


@pytest.fixture
def make_card(app):
    """Factory for persisted Card rows. Override any field via keyword."""

    def _make(**overrides):
        fields = {
            'slug': 'weather',
            'title': 'Weather',
            'description': 'Current conditions at a glance',
            'icon': '☀️',
            'source': 'weather',
            'config': {'city': 'San Francisco'},
            'layout': {'x': 0, 'y': 0, 'w': 4, 'h': 4},
            'position': 1,
            'is_active': True,
        }
        fields.update(overrides)
        card = Card(**fields)
        _db.session.add(card)
        _db.session.commit()
        return card

    return _make


@pytest.fixture
def card(make_card):
    """A single persisted Card, for tests that just need one to exist."""
    return make_card()


@pytest.fixture
def make_todo(app):
    """Factory for persisted Todo rows attached to a card."""

    def _make(card_id, text='Try checking this off', done=False):
        todo = Todo(card_id=card_id, text=text, done=done)
        _db.session.add(todo)
        _db.session.commit()
        return todo

    return _make
