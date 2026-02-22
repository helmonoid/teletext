from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import read_tracker

router = APIRouter()

class ReadRequest(BaseModel):
    url: str

@router.get("/read")
def get_read():
    return {"read": read_tracker.list_read()}

@router.post("/read")
def mark_read(req: ReadRequest):
    marked = read_tracker.mark_read(req.url)
    if not marked:
        raise HTTPException(status_code=409, detail="Already marked as read")
    return {"ok": True}

@router.post("/read/delete")
def mark_unread(req: ReadRequest):
    unmarked = read_tracker.mark_unread(req.url)
    if not unmarked:
        raise HTTPException(status_code=404, detail="Not in read list")
    return {"ok": True}
