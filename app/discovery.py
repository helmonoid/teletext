import re
import urllib.request
import urllib.error
from html.parser import HTMLParser

class _LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.feeds = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() != 'link':
            return
        attr_dict = dict(attrs)
        rel = attr_dict.get('rel', '').lower()
        type_ = attr_dict.get('type', '').lower()
        href = attr_dict.get('href', '')
        if rel == 'alternate' and type_ in ('application/rss+xml', 'application/atom+xml') and href:
            title = attr_dict.get('title', href)
            self.feeds.append({'url': href, 'title': title})

def discover_feeds(url, timeout=10):
    """Fetch URL and return list of discovered feed dicts [{url, title}, ...]."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'TeletextNews/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read(500_000).decode('utf-8', errors='replace')
        parser = _LinkParser()
        parser.feed(html)
        # Resolve relative URLs
        from urllib.parse import urljoin
        for feed in parser.feeds:
            if not feed['url'].startswith(('http://', 'https://')):
                feed['url'] = urljoin(url, feed['url'])
        return parser.feeds
    except Exception:
        return []
