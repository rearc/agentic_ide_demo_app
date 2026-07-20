"""Tests for /api/cards.

Response-shape conventions under test (see docs/coding_standards.md): collections
return a bare list, single resources return the object, errors return
{"error": "..."}, and DELETE returns 204 with an empty body.
"""

import pytest


class TestListCards:
    def test_returns_a_bare_list_not_an_envelope(self, client, make_card):
        make_card(slug='weather')

        response = client.get('/api/cards')

        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_returns_empty_list_when_no_cards_exist(self, client):
        response = client.get('/api/cards')

        assert response.status_code == 200
        assert response.get_json() == []

    def test_orders_cards_by_position(self, client, make_card):
        make_card(slug='third', position=3)
        make_card(slug='first', position=1)
        make_card(slug='second', position=2)

        slugs = [card['slug'] for card in client.get('/api/cards').get_json()]

        assert slugs == ['first', 'second', 'third']

    def test_excludes_inactive_cards(self, client, make_card):
        make_card(slug='visible', is_active=True)
        make_card(slug='hidden', is_active=False)

        slugs = [card['slug'] for card in client.get('/api/cards').get_json()]

        assert slugs == ['visible']

    def test_serializes_the_full_card_shape(self, client, card):
        payload = client.get('/api/cards').get_json()[0]

        assert set(payload) == {
            'id', 'slug', 'title', 'description', 'icon', 'source',
            'config', 'layout', 'position', 'is_active', 'created_at',
        }


class TestGetCard:
    def test_returns_the_card(self, client, card):
        response = client.get(f'/api/cards/{card.id}')

        assert response.status_code == 200
        assert response.get_json()['slug'] == 'weather'

    def test_unknown_id_returns_404(self, client):
        assert client.get('/api/cards/999').status_code == 404


class TestCreateCard:
    def test_creates_and_returns_201(self, client):
        response = client.post(
            '/api/cards',
            json={'slug': 'stocks', 'title': 'Stocks', 'source': 'stocks'},
        )

        assert response.status_code == 201
        body = response.get_json()
        assert body['slug'] == 'stocks'
        assert body['id'] is not None

    def test_created_card_is_listed(self, client):
        client.post('/api/cards', json={'slug': 'stocks', 'title': 'Stocks', 'source': 'stocks'})

        assert len(client.get('/api/cards').get_json()) == 1

    def test_applies_defaults_for_optional_fields(self, client):
        body = client.post(
            '/api/cards',
            json={'slug': 'stocks', 'title': 'Stocks', 'source': 'stocks'},
        ).get_json()

        assert body['description'] == ''
        assert body['icon'] == ''
        assert body['config'] == {}
        assert body['position'] == 0
        assert body['is_active'] is True

    def test_missing_required_field_returns_400(self, client):
        response = client.post('/api/cards', json={'slug': 'stocks'})

        assert response.status_code == 400
        assert 'title' in response.get_json()['error']
        assert 'source' in response.get_json()['error']

    def test_duplicate_slug_returns_409(self, client, card):
        response = client.post(
            '/api/cards',
            json={'slug': 'weather', 'title': 'Another', 'source': 'weather'},
        )

        assert response.status_code == 409
        assert 'already exists' in response.get_json()['error']

    def test_empty_json_body_returns_400(self, client):
        response = client.post('/api/cards', json={})

        assert response.status_code == 400
        assert response.get_json()['error'] == 'Request body is required'

    def test_layout_is_ignored_on_create(self, client):
        """Known gap: create_card does not read `layout`, though update_card does.

        The supplied layout is silently dropped and the column takes the model's
        `default=dict`, so the card starts at `{}` and Dashboard falls back to a
        computed grid position until the first save. Asserted here to pin the
        current behavior, not to endorse it.
        """
        body = client.post(
            '/api/cards',
            json={
                'slug': 'stocks',
                'title': 'Stocks',
                'source': 'stocks',
                'layout': {'x': 1, 'y': 2, 'w': 3, 'h': 4},
            },
        ).get_json()

        assert body['layout'] == {}

    @pytest.mark.xfail(
        strict=True,
        reason='create_card does not read `layout`, though update_card does',
    )
    def test_create_should_honor_a_supplied_layout(self, client):
        """The desired behavior. Flips to a failure when the gap is closed,
        which is the signal to delete the test above."""
        layout = {'x': 1, 'y': 2, 'w': 3, 'h': 4}

        body = client.post(
            '/api/cards',
            json={
                'slug': 'stocks',
                'title': 'Stocks',
                'source': 'stocks',
                'layout': layout,
            },
        ).get_json()

        assert body['layout'] == layout


class TestUpdateCard:
    def test_updates_mutable_fields(self, client, card):
        response = client.put(f'/api/cards/{card.id}', json={'title': 'Renamed'})

        assert response.status_code == 200
        assert response.get_json()['title'] == 'Renamed'

    def test_persists_the_layout_written_by_the_dashboard(self, client, card):
        layout = {'x': 2, 'y': 3, 'w': 6, 'h': 5}

        client.put(f'/api/cards/{card.id}', json={'layout': layout})

        assert client.get(f'/api/cards/{card.id}').get_json()['layout'] == layout

    def test_ignores_unknown_fields(self, client, card):
        response = client.put(f'/api/cards/{card.id}', json={'bogus': 'value'})

        assert response.status_code == 200
        assert 'bogus' not in response.get_json()

    def test_slug_is_not_updatable(self, client, card):
        """slug is the frontend's registry key, so update_card deliberately omits it."""
        client.put(f'/api/cards/{card.id}', json={'slug': 'changed'})

        assert client.get(f'/api/cards/{card.id}').get_json()['slug'] == 'weather'

    def test_deactivating_removes_it_from_the_listing(self, client, card):
        client.put(f'/api/cards/{card.id}', json={'is_active': False})

        assert client.get('/api/cards').get_json() == []

    def test_updates_the_config_a_card_fetches_with(self, client, card):
        """config drives the query string sent to /api/data/<source>, so a card
        that cannot be reconfigured cannot be repointed."""
        config = {'city': 'Boston', 'units': 'metric'}

        client.put(f'/api/cards/{card.id}', json={'config': config})

        assert client.get(f'/api/cards/{card.id}').get_json()['config'] == config

    def test_updates_position(self, client, make_card):
        """position is the sort key the dashboard renders in."""
        first = make_card(slug='first', position=1)
        make_card(slug='second', position=2)

        client.put(f'/api/cards/{first.id}', json={'position': 3})

        slugs = [c['slug'] for c in client.get('/api/cards').get_json()]
        assert slugs == ['second', 'first']

    def test_updates_source(self, client, card):
        """source is the dispatch key on both registries (ADR-008)."""
        client.put(f'/api/cards/{card.id}', json={'source': 'quote'})

        assert client.get(f'/api/cards/{card.id}').get_json()['source'] == 'quote'

    def test_updates_description_and_icon(self, client, card):
        client.put(
            f'/api/cards/{card.id}', json={'description': 'Rewritten', 'icon': '🌦️'}
        )

        body = client.get(f'/api/cards/{card.id}').get_json()
        assert body['description'] == 'Rewritten'
        assert body['icon'] == '🌦️'

    def test_unknown_id_returns_404(self, client):
        assert client.put('/api/cards/999', json={'title': 'X'}).status_code == 404

    def test_empty_json_body_returns_400(self, client, card):
        response = client.put(f'/api/cards/{card.id}', json={})

        assert response.status_code == 400
        assert response.get_json()['error'] == 'Request body is required'


class TestDeleteCard:
    def test_returns_204_with_empty_body(self, client, card):
        response = client.delete(f'/api/cards/{card.id}')

        assert response.status_code == 204
        assert response.data == b''

    def test_deleted_card_is_gone(self, client, card):
        client.delete(f'/api/cards/{card.id}')

        assert client.get(f'/api/cards/{card.id}').status_code == 404

    def test_unknown_id_returns_404(self, client):
        assert client.delete('/api/cards/999').status_code == 404


class TestCreateCardRejectsBadValues:
    """Presence checks are not type checks: a null or non-string value used to
    reach the NOT NULL constraint and surface as a 500 with an HTML body."""

    def test_null_required_field_returns_400_not_500(self, client):
        response = client.post(
            '/api/cards', json={'slug': None, 'title': None, 'source': None}
        )

        assert response.status_code == 400
        assert 'non-empty strings' in response.get_json()['error']

    def test_null_field_names_the_offending_fields(self, client):
        response = client.post(
            '/api/cards', json={'slug': 'ok', 'title': None, 'source': 'weather'}
        )

        assert response.status_code == 400
        assert 'title' in response.get_json()['error']

    def test_non_string_field_returns_400(self, client):
        response = client.post(
            '/api/cards', json={'slug': 123, 'title': 'X', 'source': 'weather'}
        )

        assert response.status_code == 400

    def test_whitespace_only_field_returns_400(self, client):
        response = client.post(
            '/api/cards', json={'slug': '   ', 'title': 'X', 'source': 'weather'}
        )

        assert response.status_code == 400

    def test_a_rejected_card_is_not_persisted(self, client):
        client.post('/api/cards', json={'slug': None, 'title': None, 'source': None})

        assert client.get('/api/cards').get_json() == []


class TestWriteRoutesRequireAJsonBody:
    """A request with no JSON content type must still get our JSON 400, not
    werkzeug's 415 with an HTML body (API-4, SEC-4)."""

    def test_post_without_json_content_type_returns_400(self, client):
        response = client.post('/api/cards', data='slug=stocks')

        assert response.status_code == 400
        assert response.get_json() == {'error': 'Request body is required'}

    def test_post_with_malformed_json_returns_400(self, client):
        response = client.post(
            '/api/cards',
            data='{not valid json',
            content_type='application/json',
        )

        assert response.status_code == 400

    def test_error_response_is_json_not_html(self, client):
        response = client.post('/api/cards', data='slug=stocks')

        assert response.content_type.startswith('application/json')

    def test_put_without_json_content_type_returns_400(self, client, card):
        response = client.put(f'/api/cards/{card.id}', data='title=Renamed')

        assert response.status_code == 400
        assert response.get_json() == {'error': 'Request body is required'}
