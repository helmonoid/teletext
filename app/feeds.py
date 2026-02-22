import json
import os

from app import config


def _get_feeds_path():
    """Return the absolute path to feeds.json in the data directory."""
    return os.path.join(config.DATA_DIR, "feeds.json")


def _load_feeds():
    """Load feeds from feeds.json. If the file doesn't exist, seed with defaults."""
    path = _get_feeds_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return config.DEFAULT_FEEDS[:]
    except FileNotFoundError:
        _save_feeds(config.DEFAULT_FEEDS[:])
        return config.DEFAULT_FEEDS[:]
    except (json.JSONDecodeError, IOError, OSError):
        return config.DEFAULT_FEEDS[:]


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


def add_feed(url):
    """Add a feed URL. Returns True if added, False if already present."""
    feeds = _load_feeds()
    if url in feeds:
        return False
    feeds.append(url)
    return _save_feeds(feeds)


def remove_feed(url):
    """Remove a feed URL. Returns True if removed, False if not found."""
    feeds = _load_feeds()
    if url not in feeds:
        return False
    feeds.remove(url)
    return _save_feeds(feeds)


def list_feeds():
    """Return a list of feed URL strings from feeds.json."""
    return _load_feeds()
