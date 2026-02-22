# teletext-web

Browser-based RSS news reader styled after classic Teletext/Ceefax pages. Built with FastAPI, vanilla JS, and Docker.

## Quick Start (Docker)

```bash
docker compose up --build
```

Open http://localhost:8000

## Quick Start (Local)

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000

## Features

- 7 color themes with CRT scanline effects
- 8 monospace fonts from Google Fonts
- Custom layout width (presets or any CSS value)
- RSS feed auto-discovery from any website URL
- Feed active/inactive toggle (disable feeds without deleting them)
- OPML import/export for feed management
- Feed health monitoring (success/error indicators)
- Bookmark and read/unread tracking (per-browser via localStorage)
- In-browser article filtering
- Keyboard-driven navigation with arrow keys and multi-digit article selection
- Desktop notifications with keyword alerts
- Configurable auto-refresh
- Infinite scroll or paginated view
- Dynamic favicon with unread count badge
- PWA manifest for home screen install
- Healthcheck endpoint at `/health`

## Themes

7 themes, switchable via Settings (`S` key):

| Theme | Description |
|-------|-------------|
| **Dark** | Classic Teletext (black bg, cyan/yellow/green text) |
| **Light** | Inverted for readability |
| **System** | Follows OS dark/light preference |
| **Amber** | Warm CRT phosphor with scanline overlay and text glow |
| **Green** | Terminal CRT with scanline overlay and text glow |
| **Blue** | Cool blue CRT with scanline overlay and text glow |
| **White** | Clean white background, minimal styling |

## Fonts

8 monospace fonts, selectable in Settings:

| Key | Font |
|-----|------|
| `default` | Courier New / Consolas |
| `vt323` | VT323 (retro pixel) |
| `ibm-plex` | IBM Plex Mono |
| `fira-code` | Fira Code |
| `space-mono` | Space Mono |
| `jetbrains` | JetBrains Mono |
| `press-start` | Press Start 2P (8-bit pixel) |
| `share-tech` | Share Tech Mono |

### Adding a new font

1. Add the font to the Google Fonts `@import` URL in `static/css/teletext.css`
2. Add an entry to `FONT_MAP` in `static/js/themes.js`
3. Add the key to `VALID_FONTS` in `app/settings.py`

## Layout

The layout width controls the max-width of the app container. You can choose a preset or enter any valid CSS value.

**Presets:**

| Name | Width |
|------|-------|
| `compact` | 720px |
| `default` | 960px |
| `wide` | 1200px |
| `full` | 100% |

**Custom values:** Type any CSS width value in the layout input field, e.g. `1400px`, `80vw`, `50em`, `100%`. The backend validates values matching the pattern `\d{2,4}(px|em|rem|vw|%)`.

Table columns use percentage-based widths so they scale proportionally with the layout.

## RSS Feed Auto-Discovery

In the Feed Manager (`F` key), paste any website URL into the "Discover" field. The backend fetches the page HTML and looks for `<link rel="alternate">` tags with `type="application/rss+xml"` or `type="application/atom+xml"`. Any discovered feeds appear as clickable "ADD" buttons.

Example: entering `https://www.nytimes.com` will discover all RSS feeds published by the New York Times.

## OPML Import/Export

OPML is a standard XML format for exchanging RSS feed lists between readers.

- **Import**: Click "IMPORT OPML" in the Feed Manager, select an `.opml` or `.xml` file. Feeds are parsed from `<outline xmlUrl="...">` elements and added (duplicates are skipped).
- **Export**: Click "EXPORT OPML" to download your current feed list as `teletext-feeds.opml`.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next page |
| `P` | Previous page |
| `0-9` | Type article number (multi-digit, fires after 800ms or Enter) |
| `Enter` | Select highlighted article |
| `Up/Down` | Navigate article list |
| `/` | Open filter |
| `R` | Refresh feeds |
| `B` | Toggle bookmark (detail view) / Show bookmarks (list view) |
| `S` | Open settings |
| `F` | Open feed manager |
| `ESC` | Back / close modal / close filter |

## Data Persistence

**Server-side** (in `./data/`, bind-mounted in Docker):

| File | Contents |
|------|----------|
| `feeds.json` | RSS feed URLs (seeded with BBC, NYT, Sky News, SR on first run) |
| `bookmarks.json` | Bookmarked article URLs (server-side, used by API) |
| `settings.json` | Theme, font, layout, articles per page, refresh interval, etc. |
| `read.json` | Read article URLs (server-side, used by API) |
| `feed_health.json` | Per-feed success/error counts and timestamps |

**Browser-side** (localStorage, per-user):

| Key | Contents |
|-----|----------|
| `teletext_bookmarks` | Bookmarked article URLs |
| `teletext_read` | Read article URLs |

Bookmarks and read status are stored in the browser so each user gets their own state when the app is hosted for multiple people.

## API

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/articles` | -- | `{articles: [...], count: N}` |
| GET | `/api/feeds` | -- | `{feeds: [url, ...]}` |
| POST | `/api/feeds` | `{url}` | `{ok: true}` or 409 |
| POST | `/api/feeds/delete` | `{url}` | `{ok: true}` or 404 |
| POST | `/api/feeds/toggle` | `{url}` | `{ok: true, active: bool}` or 404 |
| POST | `/api/feeds/discover` | `{url}` | `{feeds: [{url, title}, ...]}` |
| GET | `/api/feeds/health` | -- | `{health: {url: {last_success, error_count, ...}}}` |
| POST | `/api/feeds/opml/import` | `{content}` | `{imported: N, feeds: [...]}` |
| GET | `/api/feeds/opml/export` | -- | `{opml: "<xml>..."}` |
| GET | `/api/bookmarks` | -- | `{bookmarks: [url, ...]}` |
| POST | `/api/bookmarks` | `{url}` | `{ok: true}` or 409 |
| POST | `/api/bookmarks/delete` | `{url}` | `{ok: true}` or 404 |
| GET | `/api/read` | -- | `{read: [url, ...]}` |
| POST | `/api/read` | `{url}` | `{ok: true}` or 409 |
| POST | `/api/read/delete` | `{url}` | `{ok: true}` or 404 |
| GET | `/api/settings` | -- | full settings dict |
| PUT | `/api/settings` | partial dict | full settings dict |
| GET | `/health` | -- | `{status: "ok"}` |

Note: DELETE operations use POST with `/delete` suffix for broader browser/proxy compatibility.

## Tests

```bash
source .venv/bin/activate
uv run pytest tests/ -v
```

41 tests covering all API endpoints, settings validation, feed discovery, OPML parsing, and edge cases.

## Project Structure

```
app/
  main.py           FastAPI app, mounts routers + static files
  config.py         DATA_DIR, default feeds, default settings
  feeds.py          Feed URL storage (JSON)
  fetcher.py        RSS parsing via feedparser + feed health recording
  bookmarks.py      Bookmark storage (JSON)
  settings.py       Settings storage with validation
  read_tracker.py   Read article URL storage (JSON)
  discovery.py      RSS feed auto-discovery from HTML pages
  opml.py           OPML XML import/export
  feed_health.py    Per-feed health stats tracking
  routers/          API endpoint handlers
static/
  index.html        SPA shell with PWA manifest
  manifest.json     PWA manifest
  favicon.svg       Retro TV icon
  css/teletext.css  7 themes, CRT effects, responsive layout
  js/
    app.js          Main entry, init, event wiring, auto-refresh
    api.js          fetch() wrappers for all API endpoints
    state.js        Simple observable state (getState/setState/subscribe)
    render.js       DOM rendering (header, table, detail, settings, feeds)
    themes.js       Theme/font/layout switching + system theme listener
    keyboard.js     Keyboard shortcuts + multi-digit number input
    storage.js      localStorage wrapper for bookmarks + read status
    notifications.js Desktop notifications + keyword alert matching
tests/              pytest + FastAPI TestClient
Dockerfile          Python 3.12 slim
docker-compose.yml  Bind mounts ./data for persistence
```
