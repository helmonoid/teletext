def test_get_settings_defaults(client):
    r = client.get("/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert data["theme"] == "dark"
    assert data["articles_per_page"] == 8
    assert data["auto_refresh_seconds"] == 0


def test_update_theme(client):
    r = client.put("/api/settings", json={"theme": "amber"})
    assert r.status_code == 200
    assert r.json()["theme"] == "amber"


def test_update_invalid_theme(client):
    r = client.put("/api/settings", json={"theme": "neon"})
    assert r.status_code == 422


def test_update_articles_per_page(client):
    r = client.put("/api/settings", json={"articles_per_page": 12})
    assert r.status_code == 200
    assert r.json()["articles_per_page"] == 12


def test_update_partial(client):
    client.put("/api/settings", json={"theme": "green"})
    r = client.put("/api/settings", json={"articles_per_page": 10})
    data = r.json()
    assert data["theme"] == "green"
    assert data["articles_per_page"] == 10
