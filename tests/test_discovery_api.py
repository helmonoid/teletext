from unittest.mock import patch


@patch("app.discovery.urllib.request.urlopen")
def test_discover_feeds_none_found(mock_urlopen, client):
    """When page has no RSS links, return empty list."""
    from io import BytesIO

    class FakeResp:
        def read(self, n):
            return b"<html><head><title>Test</title></head><body></body></html>"
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    mock_urlopen.return_value = FakeResp()
    r = client.post("/api/feeds/discover", json={"url": "https://example.com"})
    assert r.status_code == 200
    assert r.json()["feeds"] == []


@patch("app.discovery.urllib.request.urlopen")
def test_discover_feeds_found(mock_urlopen, client):
    """When page has RSS link tags, return them."""
    html = b'''<html><head>
        <link rel="alternate" type="application/rss+xml" title="My Feed" href="/feed.xml">
    </head><body></body></html>'''

    class FakeResp:
        def read(self, n):
            return html
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    mock_urlopen.return_value = FakeResp()
    r = client.post("/api/feeds/discover", json={"url": "https://example.com"})
    assert r.status_code == 200
    feeds = r.json()["feeds"]
    assert len(feeds) == 1
    assert feeds[0]["title"] == "My Feed"
    assert "feed.xml" in feeds[0]["url"]
