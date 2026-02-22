import * as api from './api.js';
import { getState, setState, subscribe } from './state.js';
import { render, renderSettings, renderFeedManager, closeModal, showToast, showNumberInput, clearNumberInput } from './render.js';
import { applyTheme, initThemeListener } from './themes.js';
import { initKeyboard } from './keyboard.js';

let refreshInterval = null;

const handlers = {
    nextPage, prevPage, refresh, selectArticle, toggleBookmark,
    openSettings, openFeedManager, back, selectByIndex,
    toggleBookmarkFor, closeModal: doCloseModal,
    saveSettings, deleteFeed, addFeed: doAddFeed,
    showNumberInput, clearNumberInput,
};

function nextPage() {
    const s = getState();
    if (s.page < s.totalPages) setState({ page: s.page + 1 });
}

function prevPage() {
    const s = getState();
    if (s.page > 1) setState({ page: s.page - 1 });
}

async function refresh() {
    setState({ loading: true });
    try {
        const data = await api.fetchArticles();
        const perPage = getState().settings.articles_per_page || 8;
        setState({
            articles: data.articles,
            totalPages: Math.max(1, Math.ceil(data.count / perPage)),
            page: 1,
            loading: false,
        });
    } catch (e) {
        setState({ loading: false });
        showToast('FETCH FAILED');
    }
}

function selectArticle(num) {
    const s = getState();
    const idx = num - 1;
    if (idx >= 0 && idx < s.articles.length) {
        setState({ view: 'detail', selectedArticle: s.articles[idx] });
    }
}

function selectByIndex(idx) {
    const s = getState();
    if (idx >= 0 && idx < s.articles.length) {
        setState({ view: 'detail', selectedArticle: s.articles[idx] });
    }
}

async function toggleBookmark() {
    const s = getState();
    if (s.view === 'detail' && s.selectedArticle) {
        await toggleBookmarkFor(s.selectedArticle);
    } else if (s.view === 'list') {
        setState({ view: 'bookmarks' });
    } else if (s.view === 'bookmarks') {
        setState({ view: 'list' });
    }
}

async function toggleBookmarkFor(article) {
    try {
        if (article.bookmarked) {
            await api.removeBookmark(article.url);
            article.bookmarked = false;
            showToast('BOOKMARK REMOVED');
        } else {
            await api.addBookmark(article.url);
            article.bookmarked = true;
            showToast('BOOKMARKED');
        }
        setState({ articles: [...getState().articles] });
    } catch (e) {
        showToast('BOOKMARK ERROR');
    }
}

function back() {
    const s = getState();
    if (s.view !== 'list') {
        setState({ view: 'list', selectedArticle: null });
    }
    doCloseModal();
}

async function openSettings() {
    try {
        const settings = await api.getSettings();
        setState({ settings });
    } catch (e) { /* use cached */ }
    renderSettings(getState(), handlers);
}

async function openFeedManager() {
    try {
        const data = await api.getFeeds();
        setState({ feeds: data.feeds });
    } catch (e) { /* use cached */ }
    renderFeedManager(getState(), handlers);
}

function doCloseModal() {
    closeModal();
}

window.__closeModal = doCloseModal;

async function saveSettings(updates) {
    try {
        const result = await api.updateSettings(updates);
        setState({ settings: result });
        applyTheme(result.theme);
        setupAutoRefresh(result.auto_refresh_seconds);
        const perPage = result.articles_per_page || 8;
        setState({ totalPages: Math.max(1, Math.ceil(getState().articles.length / perPage)), page: 1 });
        doCloseModal();
        showToast('SETTINGS SAVED');
    } catch (e) {
        showToast('SAVE FAILED');
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

function setupAutoRefresh(seconds) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
    if (seconds > 0) {
        refreshInterval = setInterval(refresh, seconds * 1000);
    }
}

subscribe((state) => render(state, handlers));

async function init() {
    try {
        const settings = await api.getSettings();
        setState({ settings });
        applyTheme(settings.theme);
        setupAutoRefresh(settings.auto_refresh_seconds);
    } catch (e) { /* use defaults */ }

    initThemeListener(() => getState().settings.theme);
    initKeyboard({ nextPage, prevPage, refresh, toggleBookmark, openSettings, openFeedManager, back, selectArticle, showNumberInput, clearNumberInput });

    await refresh();
}

init();
