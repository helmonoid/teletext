const state = {
    articles: [],
    page: 1,
    totalPages: 1,
    settings: { theme: 'dark', articles_per_page: 8, auto_refresh_seconds: 0 },
    feeds: [],
    bookmarks: [],
    view: 'list',
    selectedArticle: null,
    loading: false,
};

const listeners = new Set();

export function getState() { return state; }

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
