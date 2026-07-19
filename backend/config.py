import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))


class Config:
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    NASA_API_KEY = os.environ.get('NASA_API_KEY', '')


class TestConfig(Config):
    """Config for the pytest suite: in-memory DB, no dependence on the ambient env.

    Every value that the real Config reads from the environment is pinned here so a
    developer's `.env` cannot change a test outcome.
    """

    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key'
    NASA_API_KEY = 'test-nasa-key'
