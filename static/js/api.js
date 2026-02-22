const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
    const r = await fetch(path, options);
    if (!r.ok) {
        const text = await r.text();
        throw new Error(text || r.statusText);
    }
    return r.json();
}

export function fetchArticles() {
    return request('/api/articles');
}

export function getFeeds() {
    return request('/api/feeds');
}

export function addFeed(url) {
    return request('/api/feeds', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function removeFeed(url) {
    return request('/api/feeds/delete', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function getBookmarks() {
    return request('/api/bookmarks');
}

export function addBookmark(url) {
    return request('/api/bookmarks', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function removeBookmark(url) {
    return request('/api/bookmarks/delete', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function getSettings() {
    return request('/api/settings');
}

export function updateSettings(updates) {
    return request('/api/settings', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(updates) });
}

export function getReadList() {
    return request('/api/read');
}

export function markRead(url) {
    return request('/api/read', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function markUnread(url) {
    return request('/api/read/delete', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function toggleFeed(url) {
    return request('/api/feeds/toggle', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function discoverFeeds(url) {
    return request('/api/feeds/discover', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) });
}

export function getFeedHealth() {
    return request('/api/feeds/health');
}

export function importOpml(content) {
    return request('/api/feeds/opml/import', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ content }) });
}

export function exportOpml() {
    return request('/api/feeds/opml/export');
}
