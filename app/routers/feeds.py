from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import feeds, discovery, opml, feed_health

router = APIRouter()


class FeedRequest(BaseModel):
    url: str

class DiscoverRequest(BaseModel):
    url: str

class OpmlImportRequest(BaseModel):
    content: str


@router.get("/feeds")
def get_feeds():
    return {"feeds": feeds.list_feeds()}


@router.post("/feeds")
def add_feed(req: FeedRequest):
    added = feeds.add_feed(req.url)
    if not added:
        raise HTTPException(status_code=409, detail="Feed already exists")
    return {"ok": True}


@router.post("/feeds/delete")
def remove_feed(req: FeedRequest):
    removed = feeds.remove_feed(req.url)
    if not removed:
        raise HTTPException(status_code=404, detail="Feed not found")
    return {"ok": True}


@router.post("/feeds/toggle")
def toggle_feed(req: FeedRequest):
    active = feeds.toggle_feed(req.url)
    if active is None:
        raise HTTPException(status_code=404, detail="Feed not found")
    return {"ok": True, "active": active}


@router.post("/feeds/discover")
def discover_feeds_endpoint(req: DiscoverRequest):
    found = discovery.discover_feeds(req.url)
    return {"feeds": found}


@router.get("/feeds/health")
def get_feed_health():
    return {"health": feed_health.get_health()}


@router.post("/feeds/opml/import")
def import_opml_endpoint(req: OpmlImportRequest):
    urls = opml.import_opml(req.content)
    imported = 0
    for url in urls:
        if feeds.add_feed(url):
            imported += 1
    return {"imported": imported, "feeds": feeds.list_feeds()}


@router.get("/feeds/opml/export")
def export_opml_endpoint():
    all_urls = [f["url"] for f in feeds.list_feeds()]
    xml_content = opml.export_opml(all_urls)
    return {"opml": xml_content}
