from fastapi import APIRouter

from app import bookmarks, fetcher, read_tracker

router = APIRouter()


@router.get("/articles")
def get_articles():
    articles = fetcher.fetch_articles()
    bookmarked_urls = set(bookmarks.list_bookmarks())
    read_urls = set(read_tracker.list_read())
    for a in articles:
        a["bookmarked"] = a.get("url", "") in bookmarked_urls
        a["read"] = a.get("url", "") in read_urls
    return {"articles": articles, "count": len(articles)}
