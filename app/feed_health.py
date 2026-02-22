import json
import os
from datetime import datetime, timezone
from app import config

def _get_health_path():
    return os.path.join(config.DATA_DIR, "feed_health.json")

def _load_health():
    path = _get_health_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
            return {}
    except (FileNotFoundError, json.JSONDecodeError, IOError, OSError):
        return {}

def _save_health(health):
    path = _get_health_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(health, f, indent=2)
    except (IOError, OSError):
        pass

def record_success(url, article_count):
    health = _load_health()
    entry = health.get(url, {"error_count": 0, "last_error": None})
    entry["last_success"] = datetime.now(timezone.utc).isoformat()
    entry["article_count"] = article_count
    entry["error_count"] = 0
    health[url] = entry
    _save_health(health)

def record_error(url, error_msg=""):
    health = _load_health()
    entry = health.get(url, {"last_success": None, "article_count": 0})
    entry["last_error"] = datetime.now(timezone.utc).isoformat()
    entry["error_count"] = entry.get("error_count", 0) + 1
    entry["error_message"] = str(error_msg)[:200]
    health[url] = entry
    _save_health(health)

def get_health():
    return _load_health()
