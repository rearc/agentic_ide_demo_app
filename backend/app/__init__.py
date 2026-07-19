from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_object='config.Config'):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.routes.cards import cards_bp
    from app.routes.data import data_bp
    from app.routes.todos import todos_bp

    app.register_blueprint(cards_bp, url_prefix='/api')
    app.register_blueprint(data_bp, url_prefix='/api')
    app.register_blueprint(todos_bp, url_prefix='/api')

    return app
