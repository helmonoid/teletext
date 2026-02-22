def test_healthcheck(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_feed_health_empty(client):
    r = client.get("/api/feeds/health")
    assert r.status_code == 200
    assert r.json()["health"] == {}
