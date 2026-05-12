---
name: dad-joke
description: Fetches a random dad joke and shares it with the user. Use when the user invokes /dad-joke, asks for a dad joke, or requests corny one-liner humor.
---

# Dad joke

When this skill applies, **tell one dad joke** — setup and punchline if the joke has both, otherwise the single line.

## How to get the joke

1. Run from the repo root (or use the path relative to this skill):

   ```bash
   python3 .cursor/skills/dad-joke/scripts/fetch.py
   ```

2. **Output:** Print the script’s stdout to the user as the joke. Do not prepend “Here’s a joke:” unless the user’s tone calls for it; a short line of context is optional.

## Notes

- The script uses `icanhazdadjoke.com` (JSON API, no key). If the request fails, it falls back to a small built-in list.
- **One joke per invocation** unless the user explicitly asks for more.
