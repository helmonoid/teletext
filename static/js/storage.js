const BOOKMARKS_KEY = 'teletext_bookmarks';
const READ_KEY = 'teletext_read';

function loadSet(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return new Set(Array.isArray(data) ? data : []);
    } catch {
        return new Set();
    }
}

function saveSet(key, set) {
    try {
        localStorage.setItem(key, JSON.stringify([...set]));
    } catch { /* storage full or unavailable */ }
}

// Bookmarks
export function getBookmarks() {
    return loadSet(BOOKMARKS_KEY);
}

export function addBookmark(url) {
    const set = loadSet(BOOKMARKS_KEY);
    set.add(url);
    saveSet(BOOKMARKS_KEY, set);
}

export function removeBookmark(url) {
    const set = loadSet(BOOKMARKS_KEY);
    set.delete(url);
    saveSet(BOOKMARKS_KEY, set);
}

export function isBookmarked(url) {
    return loadSet(BOOKMARKS_KEY).has(url);
}

// Read status
export function getReadUrls() {
    return loadSet(READ_KEY);
}

export function markRead(url) {
    const set = loadSet(READ_KEY);
    set.add(url);
    saveSet(READ_KEY, set);
}

export function markUnread(url) {
    const set = loadSet(READ_KEY);
    set.delete(url);
    saveSet(READ_KEY, set);
}

export function isRead(url) {
    return loadSet(READ_KEY).has(url);
}

// Apply bookmarked/read status to articles from localStorage
export function enrichArticles(articles) {
    const bookmarks = loadSet(BOOKMARKS_KEY);
    const readUrls = loadSet(READ_KEY);
    for (const a of articles) {
        a.bookmarked = bookmarks.has(a.url || '');
        a.read = readUrls.has(a.url || '');
    }
    return articles;
}
