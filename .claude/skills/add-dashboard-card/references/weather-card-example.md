# Weather Card: Complete File Reference

This shows every file involved in the "weather" card, end to end. Use as a template when building a new card.

---

## 1. Backend Service — `backend/app/services/weather.py`

```python
import logging
from functools import lru_cache

import requests

logger = logging.getLogger(__name__)

WEATHER_CODE_DESCRIPTIONS = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
}

WEATHER_CODE_ICONS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌦️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
}


def _fallback(city, description):
    return {
        'fallback': True,
        'city': city,
        'temp': '--',
        'description': description,
        'icon_emoji': '❓',
        'humidity': None,
    }


@lru_cache(maxsize=128)
def _geocode(city):
    resp = requests.get(
        'https://geocoding-api.open-meteo.com/v1/search',
        params={'name': city, 'count': 1},
        timeout=5,
    )
    resp.raise_for_status()
    results = resp.json().get('results')
    if not results:
        return None
    loc = results[0]
    return (loc['latitude'], loc['longitude'], loc.get('name', city))


def fetch(city='San Francisco', **_kwargs):
    try:
        geo = _geocode(city)
        if not geo:
            return _fallback(city, f'Could not find location: {city}')

        lat, lon, name = geo
        resp = requests.get(
            'https://api.open-meteo.com/v1/forecast',
            params={
                'latitude': lat,
                'longitude': lon,
                'current': 'temperature_2m,relative_humidity_2m,weather_code',
            },
            timeout=5,
        )
        resp.raise_for_status()
        current = resp.json()['current']
        code = current['weather_code']

        return {
            'city': name,
            'temp': current['temperature_2m'],
            'description': WEATHER_CODE_DESCRIPTIONS.get(code, 'Unknown'),
            'icon_emoji': WEATHER_CODE_ICONS.get(code, '🌡️'),
            'humidity': current['relative_humidity_2m'],
        }
    except Exception:
        logger.exception('Failed to fetch weather for %s', city)
        return _fallback(city, 'Weather data unavailable')
```

### Service pattern notes:
- Function is always called `fetch` with `**_kwargs` to absorb extra query params
- Config params (like `city`) are keyword args with defaults
- Returns a flat dict — no nested objects
- On error: returns a fallback dict with `'fallback': True` and the same keys
- Uses `logger.exception()` for error logging
- All external HTTP calls use `timeout=5`

---

## 2. Service Registration — `backend/app/routes/data.py`

The weather service is wired in via the `SERVICES` dict:

```python
from app.services import weather, quotes, space

SERVICES = {
    'weather': weather.fetch,   # <-- this line
    'quote': quotes.fetch,
    'space': space.fetch,
    'placeholder': lambda **_kw: {'message': 'Nothing here yet!'},
}
```

The key (`'weather'`) must match the card's `source` field in the database.

---

## 3. Seed Entry — `backend/seed.py`

```python
Card(
    slug='weather',
    title='Weather',
    description='Current weather conditions',
    icon='☀️',
    source='weather',
    config={'city': 'San Francisco'},
    layout={'x': 0, 'y': 0, 'w': 6, 'h': 4},
    position=1,
    is_active=True,
),
```

### Field notes:
- `slug`: URL-safe unique identifier
- `source`: must match the key in `SERVICES` dict and `CARD_REGISTRY`
- `config`: passed as query params to the service's `fetch()` function
- `layout`: `{x, y, w, h}` for react-grid-layout (12-column grid, 40px row height)
- `position`: display order (1-indexed by convention)

---

## 4. Frontend Component — `frontend/src/components/cards/WeatherCard.jsx`

```jsx
export default function WeatherCard({ data }) {
  if (data?.fallback) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-2">🌤️</p>
        <p className="text-sm text-text-muted">{data.description}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold text-text-primary tracking-tight">
            {Math.round(data.temp)}°
          </p>
          <p className="text-sm text-text-secondary capitalize mt-0.5">{data.description}</p>
        </div>
        {data.icon_emoji && (
          <span className="text-5xl opacity-90">{data.icon_emoji}</span>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted pt-1">
        <span>{data.city}</span>
        {data.humidity != null && <span>{data.humidity}% humidity</span>}
      </div>
    </div>
  )
}
```

### Component pattern notes:
- Receives `{ data, card }` props (card is the full DB record, data is from the service)
- First handles `data?.fallback` case with a simple centered message
- Uses Tailwind classes from the project theme (`text-text-primary`, `text-text-muted`, etc.)
- No local state — purely renders what it receives

---

## 5. Card Registry Entry — `frontend/src/components/Card.jsx`

```javascript
import WeatherCard from './cards/WeatherCard'

const CARD_REGISTRY = {
  weather: { component: WeatherCard, accent: 'card-weather', needsData: true },
  // ...
}
```

### Registry fields:
- `component`: the imported React component
- `accent`: suffix for the CSS variable `--color-card-{accent}` (defined in index.css)
- `needsData`: if `true`, Card.jsx fetches from `/api/data/{source}` before rendering

---

## 6. Accent Color — `frontend/src/index.css`

```css
@theme {
  --color-card-weather: #f59e0b;
}
```

This color is used for the left-edge accent bar and hover glow on the card.
