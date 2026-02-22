# teletext-web

Browser-based RSS news reader styled after classic Teletext/Ceefax pages. Built with FastAPI, vanilla JS, and the [Rich](https://github.com/Textualize/rich)-inspired aesthetic.

![screenshot](screenshot.png)

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

## Themes

5 built-in themes, switchable via Settings (`S` key):

- **Dark** -- classic Teletext (black, cyan, yellow)
- **Light** -- inverted for readability
- **System** -- follows OS dark/light preference
- **Amber** -- warm CRT phosphor with scanline overlay
- **Green** -- terminal CRT with scanline overlay

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next page |
| `P` | Previous page |
| `1-9` | View article by number |
| `R` | Refresh feeds |
| `B` | Toggle bookmark |
| `S` | Settings |
| `F` | Feed manager |
| `ESC` | Back / close modal |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/articles | Fetch all articles |
| GET | /api/feeds | List feeds |
| POST | /api/feeds | Add feed |
| DELETE | /api/feeds | Remove feed |
| GET | /api/bookmarks | List bookmarks |
| POST | /api/bookmarks | Add bookmark |
| DELETE | /api/bookmarks | Remove bookmark |
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |

## Data Persistence

All user data lives in `./data/` (bind-mounted in Docker):

```
data/
  feeds.json        # RSS feed URLs
  bookmarks.json    # Saved article URLs
  settings.json     # Theme, page size, refresh interval
```

## Tests

```bash
source .venv/bin/activate
pytest tests/ -v
```

## Project Structure

```
app/
  main.py           FastAPI app, mounts routers + static files
  config.py         DATA_DIR, defaults
  feeds.py          Feed URL storage
  fetcher.py        RSS parsing via feedparser
  bookmarks.py      Bookmark storage
  settings.py       Settings storage with validation
  routers/          API endpoint handlers
static/
  index.html        SPA shell
  css/teletext.css  5 themes, CRT effects, responsive
  js/               Vanilla ES modules (state, render, api, keyboard, themes)
tests/              pytest + FastAPI TestClient
Dockerfile          Python 3.12 slim
docker-compose.yml  Bind mounts ./data for persistence
```
