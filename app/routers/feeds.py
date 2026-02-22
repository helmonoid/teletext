from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import feeds

router = APIRouter()


class FeedRequest(BaseModel):
    url: str


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
