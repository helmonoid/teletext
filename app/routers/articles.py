from fastapi import APIRouter

from app import bookmarks, fetcher

router = APIRouter()


@router.get("/articles")
def get_articles():
    articles = fetcher.fetch_articles()
    bookmarked_urls = set(bookmarks.list_bookmarks())
    for a in articles:
        a["bookmarked"] = a.get("url", "") in bookmarked_urls
    return {"articles": articles, "count": len(articles)}
