"""
fetcher.py -- Fetch and parse RSS feed articles into structured dicts.
"""

import html
import re
import socket
from datetime import datetime
from email.utils import parsedate_to_datetime
from time import mktime

import feedparser

from app import feed_health, feeds

REQUEST_TIMEOUT = 15

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    """Remove HTML tags and unescape HTML entities."""
    if not text:
        return ""
    cleaned = _HTML_TAG_RE.sub("", text)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _parse_date(entry) -> datetime | None:
    """Try to extract a datetime from a feedparser entry."""
    for attr in ("published_parsed", "updated_parsed"):
        time_struct = getattr(entry, attr, None)
        if time_struct is not None:
            try:
                return datetime.fromtimestamp(mktime(time_struct))
            except (ValueError, OverflowError, OSError):
                continue

    for attr in ("published", "updated"):
        raw = getattr(entry, attr, None)
        if raw:
            try:
                return parsedate_to_datetime(raw)
            except (ValueError, TypeError):
                continue

    return None


def _format_date(dt: datetime | None) -> str:
    """Return a human-readable date string."""
    if dt is None:
        return "Unknown date"
    return dt.strftime("%a, %d %b %Y %H:%M")


def _fetch_single_feed(url: str) -> list[dict]:
    """Parse one RSS/Atom feed URL and return a list of article dicts."""
    articles: list[dict] = []

    try:
        old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(REQUEST_TIMEOUT)
        try:
            feed = feedparser.parse(url)
        finally:
            socket.setdefaulttimeout(old_timeout)
    except Exception:
        return articles

    feed_title = getattr(feed.feed, "title", None) or url

    for entry in feed.entries:
        title = getattr(entry, "title", None)
        if not title:
            continue

        summary_raw = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
        summary = _strip_html(summary_raw)

        link = getattr(entry, "link", "") or ""
        dt = _parse_date(entry)

        articles.append(
            {
                "title": title.strip(),
                "source": feed_title.strip(),
                "date": _format_date(dt),
                "summary": summary,
                "url": link.strip(),
                "_sort_dt": dt,
            }
        )

    return articles


def fetch_articles() -> list[dict]:
    """Fetch articles from every feed returned by list_feeds().

    Returns a list of dicts with keys: title, source, date, summary, url.
    Articles are sorted newest-first.
    """
    all_articles: list[dict] = []

    for feed_url in feeds.list_active_feed_urls():
        try:
            articles_from_feed = _fetch_single_feed(feed_url)
            all_articles.extend(articles_from_feed)
            try:
                feed_health.record_success(feed_url, len(articles_from_feed))
            except Exception:
                pass
        except Exception as e:
            try:
                feed_health.record_error(feed_url, str(e))
            except Exception:
                pass
            continue

    all_articles.sort(
        key=lambda a: a.get("_sort_dt") or datetime.min,
        reverse=True,
    )

    for article in all_articles:
        article.pop("_sort_dt", None)

    return all_articles
