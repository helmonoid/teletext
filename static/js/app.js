import * as api from './api.js';
import { getState, setState, subscribe } from './state.js';
import { render, renderSettings, renderFeedManager, closeModal, showToast, showNumberInput, clearNumberInput, updateFavicon } from './render.js';
import { applyTheme, applyFont, applyLayout, initThemeListener } from './themes.js';
import { initKeyboard } from './keyboard.js';
import * as notifications from './notifications.js';
import * as storage from './storage.js';

let refreshInterval = null;

const handlers = {
    nextPage, prevPage, refresh, selectArticle, toggleBookmark,
    openSettings, openFeedManager, back, selectByIndex,
    toggleBookmarkFor, toggleReadFor, closeModal: doCloseModal,
    saveSettings, deleteFeed, addFeed: doAddFeed,
    showNumberInput, clearNumberInput,
    moveHighlight, selectHighlighted,
    openFilter, closeFilter, setFilter,
    toggleFeed: doToggleFeed,
    discoverFeeds: doDiscoverFeeds,
    importOpml: doImportOpml, importOpmlContent: doImportOpmlContent,
    exportOpml: doExportOpml,
};

function nextPage() {
    const s = getState();
    if (s.settings.infinite_scroll) return;
    if (s.page < s.totalPages) setState({ page: s.page + 1, highlightIndex: -1 });
}

function prevPage() {
    const s = getState();
    if (s.settings.infinite_scroll) return;
    if (s.page > 1) setState({ page: s.page - 1, highlightIndex: -1 });
}

function getVisibleArticles(articles) {
    const disabled = storage.getDisabledFeeds();
    if (disabled.size === 0) return articles;
    return articles.filter(a => !disabled.has(a.source_url || ''));
}

async function refresh() {
    const s = getState();
    const prevUrls = s.articles.map(a => a.url);
    setState({ loading: true });
    try {
        const data = await api.fetchArticles();
        storage.enrichArticles(data.articles);
        const visible = getVisibleArticles(data.articles);
        const perPage = getState().settings.articles_per_page || 8;
        setState({
            allArticles: data.articles,
            articles: visible,
            totalPages: Math.max(1, Math.ceil(visible.length / perPage)),
            page: 1,
            loading: false,
            highlightIndex: -1,
            previousArticleUrls: prevUrls,
        });
        // Check keyword alerts for new articles
        checkAlerts(visible, prevUrls);
        // Update favicon with unread count
        const unread = visible.filter(a => !a.read).length;
        updateFavicon(unread);
    } catch (e) {
        setState({ loading: false });
        showToast('FETCH FAILED');
    }
}

function refilterArticles() {
    const s = getState();
    if (!s.allArticles) return;
    const visible = getVisibleArticles(s.allArticles);
    const perPage = s.settings.articles_per_page || 8;
    setState({
        articles: visible,
        totalPages: Math.max(1, Math.ceil(visible.length / perPage)),
        page: 1,
        highlightIndex: -1,
    });
}

function checkAlerts(articles, prevUrls) {
    const s = getState();
    if (!s.settings.notifications_enabled) return;
    if (!s.settings.keyword_alerts || s.settings.keyword_alerts.length === 0) return;
    const matches = notifications.checkKeywordAlerts(articles, s.settings.keyword_alerts, prevUrls);
    for (const m of matches) {
        notifications.notify(
            `Alert: "${m.keyword}"`,
            m.article.title || 'New article',
            m.article.url
        );
    }
}

function selectArticle(num) {
    const s = getState();
    const idx = num - 1;
    if (idx >= 0 && idx < s.articles.length) {
        viewArticle(s.articles[idx]);
    }
}

function selectByIndex(idx) {
    const s = getState();
    if (idx >= 0 && idx < s.articles.length) {
        viewArticle(s.articles[idx]);
    }
}

function viewArticle(article) {
    setState({ view: 'detail', selectedArticle: article, highlightIndex: -1 });
    // Auto-mark as read in localStorage
    if (article.url && !article.read) {
        storage.markRead(article.url);
        article.read = true;
        setState({ articles: [...getState().articles] });
        const unread = getState().articles.filter(a => !a.read).length;
        updateFavicon(unread);
    }
}

function moveHighlight(dir) {
    const s = getState();
    if (s.view === 'detail') return;

    let articles;
    if (s.view === 'bookmarks') {
        articles = s.articles.filter(a => a.bookmarked);
    } else if (s.settings.infinite_scroll) {
        articles = s.filterText ? getFilteredArticles(s) : s.articles;
    } else {
        const perPage = s.settings.articles_per_page || 8;
        const start = (s.page - 1) * perPage;
        articles = (s.filterText ? getFilteredArticles(s) : s.articles).slice(start, start + perPage);
    }

    const maxIdx = articles.length - 1;
    let newIdx = s.highlightIndex + dir;
    if (newIdx < 0) newIdx = 0;
    if (newIdx > maxIdx) newIdx = maxIdx;

    // Convert to global index for non-bookmark views
    if (s.view === 'list' && !s.settings.infinite_scroll) {
        const perPage = s.settings.articles_per_page || 8;
        const start = (s.page - 1) * perPage;
        setState({ highlightIndex: start + newIdx });
    } else if (s.view === 'bookmarks') {
        // For bookmarks, highlight is local
        setState({ highlightIndex: newIdx });
    } else {
        setState({ highlightIndex: newIdx });
    }
}

function getFilteredArticles(s) {
    if (!s.filterText) return s.articles;
    const q = s.filterText.toLowerCase();
    return s.articles.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q)
    );
}

function selectHighlighted() {
    const s = getState();
    if (s.highlightIndex < 0) return;

    if (s.view === 'bookmarks') {
        const bookmarked = s.articles.filter(a => a.bookmarked);
        if (s.highlightIndex < bookmarked.length) {
            const article = bookmarked[s.highlightIndex];
            const globalIdx = s.articles.indexOf(article);
            viewArticle(s.articles[globalIdx]);
        }
    } else {
        if (s.highlightIndex < s.articles.length) {
            viewArticle(s.articles[s.highlightIndex]);
        }
    }
}

function toggleBookmark() {
    const s = getState();
    if (s.view === 'detail' && s.selectedArticle) {
        toggleBookmarkFor(s.selectedArticle);
    } else if (s.view === 'list') {
        setState({ view: 'bookmarks', highlightIndex: -1 });
    } else if (s.view === 'bookmarks') {
        setState({ view: 'list', highlightIndex: -1 });
    }
}

function toggleBookmarkFor(article) {
    if (article.bookmarked) {
        storage.removeBookmark(article.url);
        article.bookmarked = false;
        showToast('BOOKMARK REMOVED');
    } else {
        storage.addBookmark(article.url);
        article.bookmarked = true;
        showToast('BOOKMARKED');
    }
    setState({ articles: [...getState().articles] });
}

function toggleReadFor(article) {
    if (article.read) {
        storage.markUnread(article.url);
        article.read = false;
        showToast('MARKED UNREAD');
    } else {
        storage.markRead(article.url);
        article.read = true;
        showToast('MARKED READ');
    }
    setState({ articles: [...getState().articles] });
    const unread = getState().articles.filter(a => !a.read).length;
    updateFavicon(unread);
}

function back() {
    const s = getState();
    if (s.filterMode) {
        closeFilter();
        return;
    }
    if (s.view !== 'list') {
        setState({ view: 'list', selectedArticle: null, highlightIndex: -1 });
    }
    doCloseModal();
}

function openFilter() {
    setState({ filterMode: true, filterText: '', highlightIndex: -1 });
}

function closeFilter() {
    setState({ filterMode: false, filterText: '', highlightIndex: -1 });
}

function setFilter(text) {
    const s = getState();
    const perPage = s.settings.articles_per_page || 8;
    const filtered = text ? s.articles.filter(a =>
        (a.title || '').toLowerCase().includes(text.toLowerCase()) ||
        (a.source || '').toLowerCase().includes(text.toLowerCase()) ||
        (a.summary || '').toLowerCase().includes(text.toLowerCase())
    ) : s.articles;
    setState({
        filterText: text,
        totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
        page: 1,
        highlightIndex: -1,
    });
}

function openSettings() {
    renderSettings(getState(), handlers);
}

async function openFeedManager() {
    try {
        const [feedData, healthData] = await Promise.all([
            api.getFeeds(),
            api.getFeedHealth(),
        ]);
        setState({ feeds: feedData.feeds, feedHealth: healthData.health, discoveredFeeds: [] });
    } catch (e) { /* use cached */ }
    renderFeedManager(getState(), handlers);
}

function doCloseModal() {
    closeModal();
}

window.__closeModal = doCloseModal;

function saveSettings(updates) {
    // Save to localStorage (per-browser)
    storage.saveLocalSettings(updates);
    setState({ settings: updates });
    applyTheme(updates.theme);
    applyFont(updates.font || 'default');
    applyLayout(updates.layout || 'default');
    setupAutoRefresh(updates.auto_refresh_seconds);
    const perPage = updates.articles_per_page || 8;
    setState({ totalPages: Math.max(1, Math.ceil(getState().articles.length / perPage)), page: 1 });
    doCloseModal();
    showToast('SETTINGS SAVED');
    // Request notification permission if enabled
    if (updates.notifications_enabled) {
        notifications.requestPermission();
    }
}

async function deleteFeed(url) {
    try {
        await api.removeFeed(url);
        const data = await api.getFeeds();
        setState({ feeds: data.feeds });
        renderFeedManager(getState(), handlers);
        showToast('FEED REMOVED');
    } catch (e) {
        showToast('REMOVE FAILED');
    }
}

function doToggleFeed(url) {
    const active = storage.toggleFeedDisabled(url);
    showToast(active ? 'FEED ENABLED' : 'FEED DISABLED');
    refilterArticles();
    renderFeedManager(getState(), handlers);
}

async function doAddFeed(url) {
    try {
        await api.addFeed(url);
        const data = await api.getFeeds();
        setState({ feeds: data.feeds });
        renderFeedManager(getState(), handlers);
        showToast('FEED ADDED');
    } catch (e) {
        showToast('ADD FAILED');
    }
}

async function doDiscoverFeeds(url) {
    showToast('DISCOVERING FEEDS...');
    try {
        const data = await api.discoverFeeds(url);
        if (data.feeds.length === 0) {
            showToast('NO FEEDS FOUND');
        } else {
            showToast(`FOUND ${data.feeds.length} FEED(S)`);
            setState({ discoveredFeeds: data.feeds });
            renderFeedManager(getState(), handlers);
        }
    } catch (e) {
        showToast('DISCOVERY FAILED');
    }
}

function doImportOpml() {
    const fileInput = document.getElementById('opml-file-input');
    if (fileInput) fileInput.click();
}

async function doImportOpmlContent(content) {
    try {
        const data = await api.importOpml(content);
        setState({ feeds: data.feeds });
        renderFeedManager(getState(), handlers);
        showToast(`IMPORTED ${data.imported} FEED(S)`);
    } catch (e) {
        showToast('IMPORT FAILED');
    }
}

async function doExportOpml() {
    try {
        const data = await api.exportOpml();
        const blob = new Blob([data.opml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'teletext-feeds.opml';
        a.click();
        URL.revokeObjectURL(url);
        showToast('OPML EXPORTED');
    } catch (e) {
        showToast('EXPORT FAILED');
    }
}

function setupAutoRefresh(seconds) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
    if (seconds > 0) {
        refreshInterval = setInterval(refresh, seconds * 1000);
    }
}

subscribe((state) => render(state, handlers));

async function init() {
    // Load settings: localStorage first, then API defaults as fallback
    let settings;
    const localSettings = storage.getLocalSettings();
    if (localSettings) {
        settings = localSettings;
    } else {
        try {
            settings = await api.getSettings();
        } catch (e) {
            settings = getState().settings;
        }
    }
    setState({ settings });
    applyTheme(settings.theme);
    applyFont(settings.font || 'default');
    applyLayout(settings.layout || 'default');
    setupAutoRefresh(settings.auto_refresh_seconds);
    if (settings.notifications_enabled) {
        notifications.requestPermission();
    }

    initThemeListener(() => getState().settings.theme);
    initKeyboard({
        nextPage, prevPage, refresh, toggleBookmark, openSettings, openFeedManager,
        back, selectArticle, showNumberInput, clearNumberInput,
        moveHighlight, selectHighlighted, openFilter, closeFilter,
    });

    await refresh();
}

init();
