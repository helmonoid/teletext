import json
import os

from app import config

VALID_THEMES = ["dark", "light", "system", "amber", "green"]


def _get_settings_path():
    """Return the absolute path to settings.json in the data directory."""
    return os.path.join(config.DATA_DIR, "settings.json")


def _load_settings():
    """Load settings from settings.json. If the file doesn't exist, save and return defaults."""
    path = _get_settings_path()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                return data
            return config.DEFAULT_SETTINGS.copy()
    except FileNotFoundError:
        _save_settings(config.DEFAULT_SETTINGS.copy())
        return config.DEFAULT_SETTINGS.copy()
    except (json.JSONDecodeError, IOError, OSError):
        return config.DEFAULT_SETTINGS.copy()


def _save_settings(settings):
    """Save settings dict to settings.json."""
    path = _get_settings_path()
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        return True
    except (IOError, OSError):
        return False


def get_settings():
    """Return the current settings dict."""
    return _load_settings()


def update_settings(updates: dict) -> dict:
    """Merge updates into current settings, validate, save, and return full settings.

    Raises ValueError with a descriptive message for invalid values.
    """
    current = _load_settings()

    if "theme" in updates:
        theme = updates["theme"]
        if theme not in VALID_THEMES:
            raise ValueError(
                f"Invalid theme '{theme}'. Must be one of: {', '.join(VALID_THEMES)}"
            )
        current["theme"] = theme

    if "articles_per_page" in updates:
        try:
            articles_per_page = int(updates["articles_per_page"])
        except (TypeError, ValueError):
            raise ValueError(
                f"articles_per_page must be an integer, got '{updates['articles_per_page']}'"
            )
        if articles_per_page < 4 or articles_per_page > 20:
            raise ValueError(
                f"articles_per_page must be between 4 and 20, got {articles_per_page}"
            )
        current["articles_per_page"] = articles_per_page

    if "auto_refresh_seconds" in updates:
        try:
            auto_refresh_seconds = int(updates["auto_refresh_seconds"])
        except (TypeError, ValueError):
            raise ValueError(
                f"auto_refresh_seconds must be an integer, got '{updates['auto_refresh_seconds']}'"
            )
        if auto_refresh_seconds < 0:
            raise ValueError(
                f"auto_refresh_seconds must be >= 0, got {auto_refresh_seconds}"
            )
        current["auto_refresh_seconds"] = auto_refresh_seconds

    _save_settings(current)
    return current
