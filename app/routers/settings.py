from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import settings

router = APIRouter()


class SettingsUpdate(BaseModel):
    model_config = {"extra": "allow"}

    theme: str | None = None
    articles_per_page: int | None = None
    auto_refresh_seconds: int | None = None


@router.get("/settings")
def get_settings():
    return settings.get_settings()


@router.put("/settings")
def update_settings(body: dict):
    try:
        result = settings.update_settings(body)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result
