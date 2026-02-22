import json
import os
from app import config

def _get_read_path():
    return os.path.join(config.DATA_DIR, "read.json")

def _load_read():
    path = _get_read_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except FileNotFoundError:
        _save_read([])
        return []
    except (json.JSONDecodeError, IOError, OSError):
        return []

def _save_read(urls):
    path = _get_read_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(urls, f, indent=2)
        return True
    except (IOError, OSError):
        return False

def mark_read(url):
    urls = _load_read()
    if url in urls:
        return False
    urls.append(url)
    return _save_read(urls)

def mark_unread(url):
    urls = _load_read()
    if url not in urls:
        return False
    urls.remove(url)
    return _save_read(urls)

def list_read():
    return _load_read()

def is_read(url):
    return url in _load_read()
