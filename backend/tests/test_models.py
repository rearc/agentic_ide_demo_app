"""Tests for the Card and Todo models - column defaults, serialization, and the
JSON-column behavior that ADR-013 commits the app to.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.card import Card
from app.models.todo import Todo


class TestCardDefaults:
    def test_optional_columns_take_their_defaults(self, app):
        card = Card(slug='minimal', title='Minimal', source='placeholder')
        db.session.add(card)
        db.session.commit()

        assert card.description == ''
        assert card.icon == ''
        assert card.config == {}
        assert card.layout == {}
        assert card.position == 0
        assert card.is_active is True

    def test_created_at_is_populated(self, app):
        card = Card(slug='minimal', title='Minimal', source='placeholder')
        db.session.add(card)
        db.session.commit()

        assert card.created_at is not None

    def test_is_active_can_be_set_false(self, make_card):
        assert make_card(slug='hidden', is_active=False).is_active is False

    def test_position_is_stored(self, make_card):
        assert make_card(slug='fifth', position=5).position == 5


class TestCardConstraints:
    def test_slug_must_be_unique(self, app, make_card):
        make_card(slug='weather')

        db.session.add(Card(slug='weather', title='Duplicate', source='weather'))
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()

    def test_slug_is_required(self, app):
        db.session.add(Card(title='No slug', source='weather'))
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()

    def test_source_is_required(self, app):
        db.session.add(Card(slug='no-source', title='No source'))
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()


class TestCardJsonColumns:
    """ADR-013: config and layout are JSON columns rather than separate tables."""

    def test_config_round_trips_a_nested_structure(self, app, make_card):
        config = {'city': 'Boston', 'units': {'temp': 'F', 'wind': 'mph'}, 'tags': [1, 2]}
        card = make_card(slug='nested', config=config)

        db.session.expire(card)

        assert card.config == config

    def test_layout_round_trips(self, app, make_card):
        layout = {'x': 2, 'y': 3, 'w': 6, 'h': 5}
        card = make_card(slug='positioned', layout=layout)

        db.session.expire(card)

        assert card.layout == layout

    def test_reassigning_config_persists(self, app, make_card):
        card = make_card(slug='reassign')

        card.config = {**card.config, 'city': 'Boston'}
        db.session.commit()
        db.session.expire(card)

        assert card.config['city'] == 'Boston'

    def test_in_place_mutation_of_config_is_not_persisted(self, app, make_card):
        """Gotcha: a plain JSON column has no mutation tracking.

        Mutating the dict in place leaves the session unaware the row is dirty,
        so the write is silently lost. Always reassign (see the test above).
        """
        card = make_card(slug='mutate', config={'city': 'San Francisco'})

        card.config['city'] = 'Boston'
        db.session.commit()
        db.session.expire(card)

        assert card.config['city'] == 'San Francisco'


class TestCardSerialization:
    def test_to_dict_exposes_the_api_contract(self, make_card):
        card = make_card(slug='weather', title='Weather', position=1)

        payload = card.to_dict()

        assert payload['id'] == card.id
        assert payload['slug'] == 'weather'
        assert payload['title'] == 'Weather'
        assert payload['position'] == 1
        assert payload['is_active'] is True

    def test_to_dict_formats_created_at_as_iso8601(self, card):
        assert card.to_dict()['created_at'] == card.created_at.isoformat()

    def test_to_dict_keys_are_stable(self, card):
        assert set(card.to_dict()) == {
            'id', 'slug', 'title', 'description', 'icon', 'source',
            'config', 'layout', 'position', 'is_active', 'created_at',
        }


class TestTodoDefaults:
    def test_done_defaults_to_false(self, app, card):
        todo = Todo(card_id=card.id, text='A task')
        db.session.add(todo)
        db.session.commit()

        assert todo.done is False

    def test_timestamps_are_populated(self, app, card):
        todo = Todo(card_id=card.id, text='A task')
        db.session.add(todo)
        db.session.commit()

        assert todo.created_at is not None
        assert todo.updated_at is not None

    def test_updated_at_advances_on_change(self, app, card, make_todo):
        todo = make_todo(card.id)
        original = todo.updated_at

        todo.text = 'Edited'
        db.session.commit()

        assert todo.updated_at > original


class TestTodoConstraints:
    def test_card_id_is_required(self, app):
        db.session.add(Todo(text='Orphan'))
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()

    def test_text_is_required(self, app, card):
        db.session.add(Todo(card_id=card.id))
        with pytest.raises(IntegrityError):
            db.session.commit()

        db.session.rollback()


class TestTodoCascadeKnownDefect:
    """KNOWN DEFECT - deleting a card does not delete its todos.

    `Todo.card_id` declares `ondelete='CASCADE'`, but SQLite ships with
    `PRAGMA foreign_keys = OFF` and the app never turns it on, so the constraint
    is inert. The rows below pin the behavior as it actually is today; the
    `xfail` immediately after states the behavior we want. Fixing it changes
    runtime behavior, so it is reported rather than patched here.
    """

    def test_pragma_confirms_foreign_keys_are_not_enforced(self, app):
        assert db.session.execute(db.text('PRAGMA foreign_keys')).scalar() == 0

    def test_deleting_a_card_orphans_its_todos(self, app, card, make_todo):
        make_todo(card.id, text='orphan me')

        db.session.delete(card)
        db.session.commit()

        assert Todo.query.count() == 1
        assert db.session.get(Card, Todo.query.first().card_id) is None

    def test_orphaned_todos_resurface_on_a_card_that_reuses_the_id(self, app, card, make_todo):
        """The consequence that makes this more than untidy bookkeeping.

        SQLite reissues a freed rowid, so a later unrelated card can inherit a
        deleted card's todos.
        """
        make_todo(card.id, text='belongs to the deleted card')
        old_id = card.id
        db.session.delete(card)
        db.session.commit()

        replacement = Card(slug='stocks', title='Stocks', source='stocks')
        db.session.add(replacement)
        db.session.commit()

        assert replacement.id == old_id
        inherited = Todo.query.filter_by(card_id=replacement.id).all()
        assert [t.text for t in inherited] == ['belongs to the deleted card']

    @pytest.mark.xfail(
        strict=True,
        reason='ondelete=CASCADE is inert until PRAGMA foreign_keys=ON is set',
    )
    def test_deleting_a_card_should_delete_its_todos(self, app, card, make_todo):
        """The desired behavior. Flips to a failure the moment the bug is fixed,
        which is the signal to delete the three tests above."""
        make_todo(card.id)

        db.session.delete(card)
        db.session.commit()

        assert Todo.query.count() == 0


class TestTodoSerialization:
    def test_to_dict_exposes_the_api_contract(self, card, make_todo):
        todo = make_todo(card.id, text='A task', done=True)

        payload = todo.to_dict()

        assert payload['id'] == todo.id
        assert payload['card_id'] == card.id
        assert payload['text'] == 'A task'
        assert payload['done'] is True

    def test_to_dict_formats_timestamps_as_iso8601(self, card, make_todo):
        todo = make_todo(card.id)

        payload = todo.to_dict()

        assert payload['created_at'] == todo.created_at.isoformat()
        assert payload['updated_at'] == todo.updated_at.isoformat()

    def test_to_dict_keys_are_stable(self, card, make_todo):
        todo = make_todo(card.id)

        assert set(todo.to_dict()) == {
            'id', 'card_id', 'text', 'done', 'created_at', 'updated_at',
        }
