#!/usr/bin/env python3
"""Fetch one random dad joke from icanhazdadjoke.com (no API key)."""
import json
import random
import urllib.error
import urllib.request

URL = "https://icanhazdadjoke.com/"
FALLBACK = [
    "I'm afraid for the calendar. Its days are numbered.",
    "Why do skeletons fight each other? They don't have the guts.",
    "What do you call a factory that makes okay products? A satisfactory.",
]

req = urllib.request.Request(
    URL,
    headers={
        "Accept": "application/json",
        "User-Agent": "cursor-workshop-dad-joke-skill",
    },
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.load(resp)
    print(data["joke"])
except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError, json.JSONDecodeError):
    print(random.choice(FALLBACK))
