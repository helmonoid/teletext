from types import SimpleNamespace
from unittest.mock import patch


def _make_feed_result(entries):
    feed_entries = []
    for e in entries:
        entry = SimpleNamespace(
            title=e.get("title"), link=e.get("link"),
            published=e.get("published", "Sat, 21 Feb 2026 00:00:00 GMT"),
            summary=e.get("summary", ""),
        )
        feed_entries.append(entry)
    return SimpleNamespace(bozo=0, feed=SimpleNamespace(title="Test Feed"), entries=feed_entries)


@patch("app.fetcher.feedparser.parse")
@patch("app.fetcher.feeds.list_feeds")
def test_get_articles_returns_list(mock_list, mock_parse, client):
    mock_list.return_value = ["https://example.com/rss"]
    mock_parse.return_value = _make_feed_result([
        {"title": "Test Article", "link": "https://example.com/1", "summary": "Test"},
    ])
    r = client.get("/api/articles")
    assert r.status_code == 200
    data = r.json()
    assert "articles" in data
    assert "count" in data
    assert data["count"] >= 1


@patch("app.fetcher.feedparser.parse")
@patch("app.fetcher.feeds.list_feeds")
def test_articles_have_correct_keys(mock_list, mock_parse, client):
    mock_list.return_value = ["https://example.com/rss"]
    mock_parse.return_value = _make_feed_result([
        {"title": "Headline", "link": "https://example.com/1", "summary": "Summary"},
    ])
    r = client.get("/api/articles")
    article = r.json()["articles"][0]
    for key in ("title", "source", "date", "summary", "url", "bookmarked", "read"):
        assert key in article


@patch("app.fetcher.feedparser.parse")
@patch("app.fetcher.feeds.list_feeds")
def test_articles_bookmarked_field(mock_list, mock_parse, client):
    mock_list.return_value = ["https://example.com/rss"]
    mock_parse.return_value = _make_feed_result([
        {"title": "Art1", "link": "https://example.com/1", "summary": "S1"},
    ])
    # Bookmark the article URL
    client.post("/api/bookmarks", json={"url": "https://example.com/1"})
    r = client.get("/api/articles")
    article = r.json()["articles"][0]
    assert article["bookmarked"] is True
