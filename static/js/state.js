const state = {
    articles: [],
    page: 1,
    totalPages: 1,
    settings: {
        theme: 'dark', articles_per_page: 8, auto_refresh_seconds: 0,
        font: 'default', infinite_scroll: false,
        notifications_enabled: false, keyword_alerts: [],
    },
    feeds: [],
    bookmarks: [],
    view: 'list',           // 'list' | 'detail' | 'bookmarks'
    selectedArticle: null,
    loading: false,
    highlightIndex: -1,     // arrow key navigation (-1 = none)
    filterText: '',         // current filter string
    filterMode: false,      // whether filter input is active
    previousArticleUrls: [], // for detecting new articles (notifications)
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
