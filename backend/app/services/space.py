import logging

import requests
from flask import current_app

logger = logging.getLogger(__name__)

APOD_URL = 'https://api.nasa.gov/planetary/apod'


def fetch(**_kwargs):
    api_key = current_app.config.get('NASA_API_KEY', '') or 'DEMO_KEY'

    try:
        resp = requests.get(
            APOD_URL,
            params={'api_key': api_key},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        explanation = data.get('explanation', '')
        return {
            'title': data.get('title', ''),
            'url': data.get('url', ''),
            'explanation': explanation[:200] + '...' if len(explanation) > 200 else explanation,
            'date': data.get('date', ''),
            'media_type': data.get('media_type', 'image'),
        }
    except Exception:
        logger.exception('Failed to fetch NASA APOD')
        return {
            'fallback': True,
            'title': 'Space Photo Unavailable',
            'url': '',
            'explanation': 'Configure NASA_API_KEY in .env for Astronomy Picture of the Day',
            'date': '',
            'media_type': 'image',
        }
