def test_list_read_empty(client):
    r = client.get("/api/read")
    assert r.status_code == 200
    assert r.json()["read"] == []


def test_mark_read(client):
    r = client.post("/api/read", json={"url": "https://example.com/article"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    read_list = client.get("/api/read").json()["read"]
    assert "https://example.com/article" in read_list


def test_mark_read_duplicate(client):
    client.post("/api/read", json={"url": "https://example.com/article"})
    r = client.post("/api/read", json={"url": "https://example.com/article"})
    assert r.status_code == 409


def test_mark_unread(client):
    client.post("/api/read", json={"url": "https://example.com/article"})
    r = client.post("/api/read/delete", json={"url": "https://example.com/article"})
    assert r.status_code == 200
    read_list = client.get("/api/read").json()["read"]
    assert "https://example.com/article" not in read_list


def test_mark_unread_not_found(client):
    r = client.post("/api/read/delete", json={"url": "https://nonexistent.com"})
    assert r.status_code == 404
