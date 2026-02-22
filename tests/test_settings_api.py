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


def test_new_themes(client):
    for theme in ("blue", "white"):
        r = client.put("/api/settings", json={"theme": theme})
        assert r.status_code == 200
        assert r.json()["theme"] == theme


def test_update_font(client):
    r = client.put("/api/settings", json={"font": "vt323"})
    assert r.status_code == 200
    assert r.json()["font"] == "vt323"


def test_update_invalid_font(client):
    r = client.put("/api/settings", json={"font": "comic-sans"})
    assert r.status_code == 422


def test_update_infinite_scroll(client):
    r = client.put("/api/settings", json={"infinite_scroll": True})
    assert r.status_code == 200
    assert r.json()["infinite_scroll"] is True


def test_update_notifications(client):
    r = client.put("/api/settings", json={"notifications_enabled": True})
    assert r.status_code == 200
    assert r.json()["notifications_enabled"] is True


def test_update_keyword_alerts(client):
    r = client.put("/api/settings", json={"keyword_alerts": ["breaking", "climate"]})
    assert r.status_code == 200
    assert r.json()["keyword_alerts"] == ["breaking", "climate"]


def test_defaults_include_new_fields(client):
    r = client.get("/api/settings")
    data = r.json()
    assert data["font"] == "default"
    assert data["infinite_scroll"] is False
    assert data["notifications_enabled"] is False
    assert data["keyword_alerts"] == []
