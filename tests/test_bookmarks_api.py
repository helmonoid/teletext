def test_list_bookmarks_empty(client):
    r = client.get("/api/bookmarks")
    assert r.status_code == 200
    assert r.json()["bookmarks"] == []


def test_add_bookmark(client):
    r = client.post("/api/bookmarks", json={"url": "https://example.com/article"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    bookmarks = client.get("/api/bookmarks").json()["bookmarks"]
    assert "https://example.com/article" in bookmarks


def test_add_bookmark_duplicate(client):
    client.post("/api/bookmarks", json={"url": "https://example.com/article"})
    r = client.post("/api/bookmarks", json={"url": "https://example.com/article"})
    assert r.status_code == 409


def test_remove_bookmark(client):
    client.post("/api/bookmarks", json={"url": "https://example.com/article"})
    r = client.post("/api/bookmarks/delete", json={"url": "https://example.com/article"})
    assert r.status_code == 200
    bookmarks = client.get("/api/bookmarks").json()["bookmarks"]
    assert "https://example.com/article" not in bookmarks


def test_remove_bookmark_not_found(client):
    r = client.post("/api/bookmarks/delete", json={"url": "https://nonexistent.com"})
    assert r.status_code == 404
