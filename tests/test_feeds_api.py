def test_list_feeds_default(client):
    r = client.get("/api/feeds")
    assert r.status_code == 200
    data = r.json()
    assert "feeds" in data
    assert isinstance(data["feeds"], list)
    assert len(data["feeds"]) == 4
    # Feeds are plain URL strings
    for feed in data["feeds"]:
        assert isinstance(feed, str)


def test_add_feed(client):
    r = client.post("/api/feeds", json={"url": "https://example.com/rss"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    feeds = client.get("/api/feeds").json()["feeds"]
    assert "https://example.com/rss" in feeds


def test_add_feed_duplicate(client):
    client.post("/api/feeds", json={"url": "https://example.com/rss"})
    r = client.post("/api/feeds", json={"url": "https://example.com/rss"})
    assert r.status_code == 409


def test_remove_feed(client):
    r = client.post("/api/feeds/delete", json={"url": "https://feeds.bbci.co.uk/news/rss.xml"})
    assert r.status_code == 200
    feeds = client.get("/api/feeds").json()["feeds"]
    assert "https://feeds.bbci.co.uk/news/rss.xml" not in feeds


def test_remove_feed_not_found(client):
    r = client.post("/api/feeds/delete", json={"url": "https://nonexistent.com/rss"})
    assert r.status_code == 404
