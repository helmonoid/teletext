import json
import os

from app import config


def _get_feeds_path():
    """Return the absolute path to feeds.json in the data directory."""
    return os.path.join(config.DATA_DIR, "feeds.json")


def _migrate(data):
    """Convert old format (list of URL strings) to new format (list of dicts)."""
    if not data:
        return data
    if isinstance(data[0], str):
        return [{"url": url, "active": True} for url in data]
    return data


def _load_feeds():
    """Load feeds from feeds.json. If the file doesn't exist, seed with defaults."""
    path = _get_feeds_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return _migrate(data)
            return _migrate(config.DEFAULT_FEEDS[:])
    except FileNotFoundError:
        feeds = _migrate(config.DEFAULT_FEEDS[:])
        _save_feeds(feeds)
        return feeds
    except (json.JSONDecodeError, IOError, OSError):
        return _migrate(config.DEFAULT_FEEDS[:])


def _save_feeds(feeds):
    """Save feeds list to feeds.json."""
    path = _get_feeds_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(feeds, f, indent=2)
        return True
    except (IOError, OSError):
        return False


def _find(feeds, url):
    """Find a feed dict by URL. Returns (index, feed_dict) or (-1, None)."""
    for i, f in enumerate(feeds):
        if f["url"] == url:
            return i, f
    return -1, None


def add_feed(url):
    """Add a feed URL. Returns True if added, False if already present."""
    feeds = _load_feeds()
    idx, _ = _find(feeds, url)
    if idx >= 0:
        return False
    feeds.append({"url": url, "active": True})
    return _save_feeds(feeds)


def remove_feed(url):
    """Remove a feed URL. Returns True if removed, False if not found."""
    feeds = _load_feeds()
    idx, _ = _find(feeds, url)
    if idx < 0:
        return False
    feeds.pop(idx)
    return _save_feeds(feeds)


def toggle_feed(url):
    """Toggle a feed's active status. Returns new active state, or None if not found."""
    feeds = _load_feeds()
    idx, feed = _find(feeds, url)
    if idx < 0:
        return None
    feed["active"] = not feed.get("active", True)
    _save_feeds(feeds)
    return feed["active"]


def list_feeds():
    """Return a list of feed dicts [{url, active}, ...] from feeds.json."""
    return _load_feeds()


def list_active_feed_urls():
    """Return a list of URL strings for active feeds only."""
    return [f["url"] for f in _load_feeds() if f.get("active", True)]
