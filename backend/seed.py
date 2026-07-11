from app import create_app, db
from app.models.card import Card
from app.models.todo import Todo


def seed():
    app = create_app()
    with app.app_context():
        Todo.query.delete()
        Card.query.delete()

        cards = [
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

        db.session.add_all(cards)
        db.session.commit()

        todo_card = Card.query.filter_by(slug='todo').first()
        if todo_card:
            db.session.add(
                Todo(card_id=todo_card.id, text='Try checking this off', done=False)
            )
            db.session.commit()

        print(f'Seeded {len(cards)} cards.')


if __name__ == '__main__':
    seed()
