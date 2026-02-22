import json
import os

from app import config


def _get_bookmarks_path():
    """Return the absolute path to bookmarks.json in the data directory."""
    return os.path.join(config.DATA_DIR, "bookmarks.json")


def _load_bookmarks():
    """Load bookmarks from bookmarks.json. If the file doesn't exist, create empty."""
    path = _get_bookmarks_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except FileNotFoundError:
        _save_bookmarks([])
        return []
    except (json.JSONDecodeError, IOError, OSError):
        return []


def _save_bookmarks(bookmarks):
    """Save bookmarks list to bookmarks.json."""
    path = _get_bookmarks_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(bookmarks, f, indent=2)
        return True
    except (IOError, OSError):
        return False


def add_bookmark(url):
    """Add a bookmark URL. Returns True if added, False if duplicate."""
    bookmarks = _load_bookmarks()
    if url in bookmarks:
        return False
    bookmarks.append(url)
    return _save_bookmarks(bookmarks)


def remove_bookmark(url):
    """Remove a bookmark URL. Returns True if removed, False if not found."""
    bookmarks = _load_bookmarks()
    if url not in bookmarks:
        return False
    bookmarks.remove(url)
    return _save_bookmarks(bookmarks)


def list_bookmarks():
    """Return a list of bookmarked URL strings from bookmarks.json."""
    return _load_bookmarks()


def is_bookmarked(url):
    """Return True if the URL is bookmarked, False otherwise."""
    return url in _load_bookmarks()
