def test_list_feeds_default(client):
    r = client.get("/api/feeds")
    assert r.status_code == 200
    data = r.json()
    assert "feeds" in data
    assert isinstance(data["feeds"], list)
    assert len(data["feeds"]) == 4
    # Feeds are now dicts with url and active
    for feed in data["feeds"]:
        assert "url" in feed
        assert feed["active"] is True


def test_add_feed(client):
    r = client.post("/api/feeds", json={"url": "https://example.com/rss"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    feeds = client.get("/api/feeds").json()["feeds"]
    urls = [f["url"] for f in feeds]
    assert "https://example.com/rss" in urls


def test_add_feed_duplicate(client):
    client.post("/api/feeds", json={"url": "https://example.com/rss"})
    r = client.post("/api/feeds", json={"url": "https://example.com/rss"})
    assert r.status_code == 409


def test_remove_feed(client):
    r = client.post("/api/feeds/delete", json={"url": "https://feeds.bbci.co.uk/news/rss.xml"})
    assert r.status_code == 200
    feeds = client.get("/api/feeds").json()["feeds"]
    urls = [f["url"] for f in feeds]
    assert "https://feeds.bbci.co.uk/news/rss.xml" not in urls


def test_remove_feed_not_found(client):
    r = client.post("/api/feeds/delete", json={"url": "https://nonexistent.com/rss"})
    assert r.status_code == 404


def test_toggle_feed(client):
    url = "https://feeds.bbci.co.uk/news/rss.xml"
    # Initially active
    feeds = client.get("/api/feeds").json()["feeds"]
    bbc = next(f for f in feeds if f["url"] == url)
    assert bbc["active"] is True

    # Toggle off
    r = client.post("/api/feeds/toggle", json={"url": url})
    assert r.status_code == 200
    assert r.json()["active"] is False

    feeds = client.get("/api/feeds").json()["feeds"]
    bbc = next(f for f in feeds if f["url"] == url)
    assert bbc["active"] is False

    # Toggle back on
    r = client.post("/api/feeds/toggle", json={"url": url})
    assert r.status_code == 200
    assert r.json()["active"] is True


def test_toggle_feed_not_found(client):
    r = client.post("/api/feeds/toggle", json={"url": "https://nonexistent.com/rss"})
    assert r.status_code == 404
