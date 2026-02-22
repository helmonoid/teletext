const BOOKMARKS_KEY = 'teletext_bookmarks';
const READ_KEY = 'teletext_read';
const DISABLED_FEEDS_KEY = 'teletext_disabled_feeds';
const SETTINGS_KEY = 'teletext_settings';

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

// Disabled feeds (per-browser feed toggling)
export function getDisabledFeeds() {
    return loadSet(DISABLED_FEEDS_KEY);
}

export function isFeedDisabled(url) {
    return loadSet(DISABLED_FEEDS_KEY).has(url);
}

export function toggleFeedDisabled(url) {
    const set = loadSet(DISABLED_FEEDS_KEY);
    if (set.has(url)) {
        set.delete(url);
    } else {
        set.add(url);
    }
    saveSet(DISABLED_FEEDS_KEY, set);
    return !set.has(url); // returns true if now active
}

// Filter out articles from disabled feeds
export function filterDisabledFeeds(articles) {
    const disabled = loadSet(DISABLED_FEEDS_KEY);
    if (disabled.size === 0) return articles;
    return articles.filter(a => {
        // Match by source name -- articles don't carry feed URL,
        // but we can't match by feed URL here. Instead we keep
        // all articles (filtering happens at display by feed URL).
        return true;
    });
}

// Local settings (per-browser)
export function getLocalSettings() {
    try {
        const data = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (data && typeof data === 'object') return data;
        return null;
    } catch {
        return null;
    }
}

export function saveLocalSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* storage full or unavailable */ }
}
