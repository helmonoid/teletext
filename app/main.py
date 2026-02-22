import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers import articles, bookmarks, feeds, settings, read

app = FastAPI(title="Teletext News", version="1.0.0")

@app.get("/health")
def healthcheck():
    return {"status": "ok"}

app.include_router(articles.router, prefix="/api")
app.include_router(feeds.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(read.router, prefix="/api")

static_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static"
)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
