def test_export_opml(client):
    r = client.get("/api/feeds/opml/export")
    assert r.status_code == 200
    opml = r.json()["opml"]
    assert "<opml" in opml
    assert "xmlUrl" in opml


def test_import_opml(client):
    opml_content = '''<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head><title>Test</title></head>
      <body>
        <outline type="rss" text="New Feed" xmlUrl="https://new-feed.example.com/rss"/>
      </body>
    </opml>'''
    r = client.post("/api/feeds/opml/import", json={"content": opml_content})
    assert r.status_code == 200
    data = r.json()
    assert data["imported"] == 1
    urls = [f["url"] for f in data["feeds"]]
    assert "https://new-feed.example.com/rss" in urls


def test_import_opml_duplicate(client):
    """Importing a feed that already exists should not count as imported."""
    opml_content = '''<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <body>
        <outline type="rss" xmlUrl="https://feeds.bbci.co.uk/news/rss.xml"/>
      </body>
    </opml>'''
    r = client.post("/api/feeds/opml/import", json={"content": opml_content})
    assert r.status_code == 200
    assert r.json()["imported"] == 0
