"""Seed the dashboard with its default cards.

By default this is **additive**: it inserts only the default cards that are
missing, and never deletes anything. Cards you added at runtime, todos you
wrote, and layouts you dragged all survive a re-seed (ADR-017).

Pass `--reset` when you actually want the pristine starting state back. That
wipes the `cards` and `todos` tables first, and does destroy user data.
"""

import argparse

from app import create_app, db
from app.models.card import Card
from app.models.todo import Todo

STARTER_TODO_TEXT = 'Try checking this off'


def default_cards():
    """The cards a fresh dashboard starts with.

    Add a new default card here; a re-seed will insert it without touching
    anything already in the database.
    """
    return [
        Card(
            slug='weather',
            title='Weather',
            description='Current conditions at a glance',
            icon='☀️',
            source='weather',
            config={'city': 'San Francisco'},
            layout={'x': 0, 'y': 0, 'w': 4, 'h': 4},
            position=1,
            is_active=True,
        ),
        Card(
            slug='quote',
            title='Daily Quote',
            description='A little daily inspiration',
            icon='💬',
            source='quote',
            config={},
            layout={'x': 4, 'y': 0, 'w': 4, 'h': 4},
            position=2,
            is_active=True,
        ),
        Card(
            slug='placeholder',
            title='Coming Soon',
            description='Your next widget goes here',
            icon='✨',
            source='placeholder',
            config={},
            layout={'x': 8, 'y': 0, 'w': 4, 'h': 4},
            position=3,
            is_active=True,
        ),
        Card(
            slug='space',
            title='Space Photo',
            description='NASA Astronomy Picture of the Day',
            icon='🚀',
            source='space',
            config={},
            layout={'x': 0, 'y': 4, 'w': 6, 'h': 7},
            position=4,
            is_active=True,
        ),
        Card(
            slug='todo',
            title='Todos',
            description='Track what needs doing',
            icon='✅',
            source='todo',
            config={},
            layout={'x': 6, 'y': 4, 'w': 6, 'h': 5},
            position=5,
            is_active=True,
        ),
    ]


def seed(app=None, reset=False):
    """Insert any missing default cards.

    Args:
        app: the Flask app to seed. Builds the default app when given none.
        reset: wipe cards and todos first, restoring the pristine starting
            state. Destroys user-created data; off by default.

    Returns:
        The slugs of the cards this run actually created.
    """
    app = app or create_app()
    with app.app_context():
        if reset:
            Todo.query.delete()
            Card.query.delete()
            db.session.commit()

        existing = {slug for (slug,) in db.session.query(Card.slug).all()}
        created = []
        for card in default_cards():
            if card.slug in existing:
                continue
            db.session.add(card)
            created.append(card.slug)
        db.session.commit()

        # The starter todo is a hint for a first-time user, so it is written
        # only alongside a newly created todo card - never re-added to a card
        # whose todos the user has since cleared out.
        if 'todo' in created:
            todo_card = Card.query.filter_by(slug='todo').first()
            db.session.add(Todo(card_id=todo_card.id, text=STARTER_TODO_TEXT))
            db.session.commit()

        _report(created, reset)
        return created


def _report(created, reset):
    if reset:
        print(f'Reset the board and seeded {len(created)} cards.')
    elif created:
        print(f'Added {len(created)} missing card(s): {", ".join(created)}.')
    else:
        print('Nothing to do - all default cards are already present.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__.split('\n', maxsplit=1)[0])
    parser.add_argument(
        '--reset',
        action='store_true',
        help='wipe cards and todos first, restoring the pristine starting state '
        '(destroys custom cards, todos, and layout changes)',
    )
    seed(reset=parser.parse_args().reset)
