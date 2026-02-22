from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import bookmarks

router = APIRouter()


class BookmarkRequest(BaseModel):
    url: str


@router.get("/bookmarks")
def get_bookmarks():
    return {"bookmarks": bookmarks.list_bookmarks()}


@router.post("/bookmarks")
def add_bookmark(req: BookmarkRequest):
    added = bookmarks.add_bookmark(req.url)
    if not added:
        raise HTTPException(status_code=409, detail="Bookmark already exists")
    return {"ok": True}


@router.post("/bookmarks/delete")
def remove_bookmark(req: BookmarkRequest):
    removed = bookmarks.remove_bookmark(req.url)
    if not removed:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"ok": True}
