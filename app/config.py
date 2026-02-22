import os

DATA_DIR = os.environ.get("TELETEXT_DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"))

DEFAULT_FEEDS = [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.skynews.com/feeds/rss/home.xml",
    "https://api.sr.se/api/rss/program/2054",
]

DEFAULT_SETTINGS = {
    "theme": "dark",
    "articles_per_page": 8,
    "auto_refresh_seconds": 0,
    "font": "default",
    "layout": "default",
    "infinite_scroll": False,
    "notifications_enabled": False,
    "keyword_alerts": [],
}
