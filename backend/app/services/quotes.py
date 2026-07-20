import logging

import requests

logger = logging.getLogger(__name__)

QUOTES_URL = 'https://zenquotes.io/api/random'

FALLBACK_QUOTE = {
    'text': 'The best way to predict the future is to invent it.',
    'author': 'Alan Kay',
    'fallback': True,
}


def fetch(**_kwargs):
    try:
        resp = requests.get(QUOTES_URL, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        if data and isinstance(data, list):
            return {
                'text': data[0].get('q', ''),
                'author': data[0].get('a', 'Unknown'),
            }
    except Exception:
        logger.exception('Failed to fetch quote')

    return FALLBACK_QUOTE
