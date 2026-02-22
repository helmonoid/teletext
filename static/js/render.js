let clockInterval = null;

function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') e.className = v;
        else if (k === 'textContent') e.textContent = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
        else e.setAttribute(k, v);
    }
    for (const c of children) {
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else if (c) e.appendChild(c);
    }
    return e;
}

function formatClock() {
    const d = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = n => String(n).padStart(2, '0');
    return `${days[d.getDay()]} ${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function renderHeader(state) {
    const header = document.getElementById('header');
    header.innerHTML = '';

    const banner = el('div', { className: 'header-banner' }, [
        el('span', { className: 'hash', textContent: '####' }),
        '  TELETEXT NEWS  ',
        el('span', { className: 'hash', textContent: '####' }),
    ]);

    const info = el('div', { className: 'header-info' }, [
        el('span', { className: 'header-page', textContent: `Page ${state.page}/${state.totalPages}` }),
        el('span', { className: 'header-clock', id: 'clock', textContent: formatClock() }),
    ]);

    header.appendChild(banner);
    header.appendChild(info);

    if (!clockInterval) {
        clockInterval = setInterval(() => {
            const c = document.getElementById('clock');
            if (c) c.textContent = formatClock();
        }, 1000);
    }
}

function buildArticleTable(articles, startOffset, handlers) {
    const table = el('table', { className: 'article-table' });

    const thead = el('thead');
    const headerRow = el('tr', {}, [
        el('th', { className: 'col-num', textContent: '#' }),
        el('th', { className: 'col-star', textContent: '\u2605' }),
        el('th', { className: 'col-title', textContent: 'Title' }),
        el('th', { className: 'col-source', textContent: 'Source' }),
        el('th', { className: 'col-date', textContent: 'Date' }),
    ]);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    articles.forEach((article, i) => {
        const globalIdx = startOffset + i;
        const row = el('tr', { className: 'article-row', onClick: () => handlers.selectByIndex(globalIdx) }, [
            el('td', { className: 'cell-num', textContent: String(globalIdx + 1) }),
            el('td', {
                className: article.bookmarked ? 'cell-star bookmarked' : 'cell-star',
                textContent: article.bookmarked ? '\u2605' : '\u2606',
            }),
            el('td', { className: 'cell-title', textContent: article.title || 'Untitled' }),
            el('td', { className: 'cell-source', textContent: article.source || '' }),
            el('td', { className: 'cell-date', textContent: article.date || '' }),
        ]);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    return table;
}

export function renderArticleList(state, handlers) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    if (state.loading) {
        content.appendChild(el('div', { className: 'loading-text', textContent: 'FETCHING FEEDS...' }));
        return;
    }

    if (state.articles.length === 0) {
        const empty = el('div', { className: 'empty-state' }, [
            'No articles loaded. Press ',
            el('span', { className: 'key-hint', textContent: '[R]' }),
            ' to refresh or ',
            el('span', { className: 'key-hint', textContent: '[F]' }),
            ' to manage feeds.',
        ]);
        content.appendChild(empty);
        return;
    }

    const perPage = state.settings.articles_per_page || 8;
    const start = (state.page - 1) * perPage;
    const pageArticles = state.articles.slice(start, start + perPage);

    content.appendChild(buildArticleTable(pageArticles, start, handlers));
}

export function renderBookmarks(state, handlers) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const titleBar = el('div', { className: 'detail-title-banner', textContent: '\u2605 BOOKMARKED ARTICLES' });
    content.appendChild(titleBar);

    const bookmarkedArticles = state.articles.filter(a => a.bookmarked);

    if (bookmarkedArticles.length === 0) {
        const empty = el('div', { className: 'empty-state' }, [
            'No bookmarked articles. View an article and press ',
            el('span', { className: 'key-hint', textContent: '[B]' }),
            ' to bookmark it.',
        ]);
        content.appendChild(empty);
        return;
    }

    // Map bookmarked articles back to their global indices for selection
    const table = el('table', { className: 'article-table' });

    const thead = el('thead');
    thead.appendChild(el('tr', {}, [
        el('th', { className: 'col-num', textContent: '#' }),
        el('th', { className: 'col-star', textContent: '\u2605' }),
        el('th', { className: 'col-title', textContent: 'Title' }),
        el('th', { className: 'col-source', textContent: 'Source' }),
        el('th', { className: 'col-date', textContent: 'Date' }),
    ]));
    table.appendChild(thead);

    const tbody = el('tbody');
    bookmarkedArticles.forEach((article, i) => {
        const globalIdx = state.articles.indexOf(article);
        const row = el('tr', { className: 'article-row', onClick: () => handlers.selectByIndex(globalIdx) }, [
            el('td', { className: 'cell-num', textContent: String(i + 1) }),
            el('td', { className: 'cell-star bookmarked', textContent: '\u2605' }),
            el('td', { className: 'cell-title', textContent: article.title || 'Untitled' }),
            el('td', { className: 'cell-source', textContent: article.source || '' }),
            el('td', { className: 'cell-date', textContent: article.date || '' }),
        ]);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    content.appendChild(table);
}

export function renderArticleDetail(state, handlers) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const article = state.selectedArticle;
    if (!article) return;

    const view = el('div', { className: 'detail-view' });

    view.appendChild(el('div', { className: 'detail-title-banner', textContent: article.title || 'Untitled' }));

    const meta = el('div', { className: 'detail-meta' }, [
        el('span', { className: 'detail-meta-label', textContent: 'Source: ' }),
        el('span', { className: 'detail-meta-value', textContent: article.source || 'Unknown' }),
        '    ',
        el('span', { className: 'detail-meta-label', textContent: 'Date: ' }),
        el('span', { className: 'detail-meta-value', textContent: article.date || 'N/A' }),
    ]);
    view.appendChild(meta);

    if (article.url) {
        const urlRow = el('div', { className: 'detail-meta' }, [
            el('span', { className: 'detail-meta-label', textContent: 'URL: ' }),
            el('a', { className: 'detail-meta-link', href: article.url, target: '_blank', textContent: article.url }),
        ]);
        view.appendChild(urlRow);
    }

    view.appendChild(el('hr', { className: 'detail-separator' }));
    view.appendChild(el('div', { className: 'detail-summary', textContent: article.summary || 'No summary available.' }));

    const actions = el('div', { className: 'detail-actions' }, [
        el('button', {
            className: 'tt-btn',
            textContent: article.bookmarked ? '\u2605 UNBOOKMARK' : '\u2606 BOOKMARK',
            onClick: () => handlers.toggleBookmarkFor(article),
        }),
        el('button', { className: 'tt-btn', textContent: '\u2190 BACK', onClick: handlers.back }),
    ]);
    view.appendChild(actions);

    content.appendChild(view);
}

export function renderFooter(state) {
    const footer = document.getElementById('footer');
    footer.innerHTML = '';

    const numberIndicator = document.getElementById('number-input');
    if (!document.getElementById('number-input')) {
        const ni = el('div', { className: 'number-input hidden', id: 'number-input' });
        footer.appendChild(ni);
    }

    let shortcuts;
    if (state.view === 'list') {
        shortcuts = [
            ['N', 'Next'], ['P', 'Prev'], ['#', 'Go To'], ['R', 'Refresh'],
            ['B', 'Bookmarks'], ['S', 'Settings'], ['F', 'Feeds'],
        ];
    } else if (state.view === 'bookmarks') {
        shortcuts = [
            ['ESC', 'Back'], ['R', 'Refresh'], ['S', 'Settings'], ['F', 'Feeds'],
        ];
    } else {
        shortcuts = [
            ['ESC', 'Back'], ['B', 'Bookmark'], ['S', 'Settings'], ['F', 'Feeds'],
        ];
    }

    const container = el('div', { className: 'footer-shortcuts' });
    for (const [key, label] of shortcuts) {
        container.appendChild(el('span', { className: 'shortcut-badge' }, [
            el('span', { className: 'shortcut-key', textContent: key }),
            el('span', { className: 'shortcut-label', textContent: label }),
        ]));
    }
    footer.appendChild(container);
}

export function showNumberInput(digits) {
    let ni = document.getElementById('number-input');
    if (!ni) {
        ni = el('div', { className: 'number-input', id: 'number-input' });
        document.getElementById('footer').prepend(ni);
    }
    ni.textContent = `GO TO ARTICLE: ${digits}_`;
    ni.classList.remove('hidden');
}

export function clearNumberInput() {
    const ni = document.getElementById('number-input');
    if (ni) ni.classList.add('hidden');
}

export function renderSettings(state, handlers) {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    modal.innerHTML = '';

    modal.appendChild(el('div', { className: 'modal-title', textContent: 'SETTINGS' }));

    const form = el('div', { className: 'settings-form' });

    // Theme
    const themeSelect = el('select', { className: 'tt-select', id: 'setting-theme' });
    for (const t of ['dark', 'light', 'system', 'amber', 'green']) {
        const opt = el('option', { value: t, textContent: t.toUpperCase() });
        if (t === state.settings.theme) opt.selected = true;
        themeSelect.appendChild(opt);
    }
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Theme' }),
        themeSelect,
    ]));

    // Articles per page
    const perPageInput = el('input', {
        className: 'tt-input', type: 'number', id: 'setting-perpage',
        value: String(state.settings.articles_per_page), min: '4', max: '20',
    });
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Articles/Page' }),
        perPageInput,
    ]));

    // Auto-refresh
    const refreshSelect = el('select', { className: 'tt-select', id: 'setting-refresh' });
    const refreshOptions = [[0, 'Off'], [60, '1 min'], [120, '2 min'], [300, '5 min'], [600, '10 min']];
    for (const [val, label] of refreshOptions) {
        const opt = el('option', { value: String(val), textContent: label });
        if (val === state.settings.auto_refresh_seconds) opt.selected = true;
        refreshSelect.appendChild(opt);
    }
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Auto-Refresh' }),
        refreshSelect,
    ]));

    const actions = el('div', { className: 'settings-actions' }, [
        el('button', { className: 'tt-btn', textContent: 'SAVE', onClick: () => handlers.saveSettings({
            theme: document.getElementById('setting-theme').value,
            articles_per_page: parseInt(document.getElementById('setting-perpage').value) || 8,
            auto_refresh_seconds: parseInt(document.getElementById('setting-refresh').value) || 0,
        })}),
        el('button', { className: 'tt-btn', textContent: 'CLOSE', onClick: handlers.closeModal }),
    ]);
    form.appendChild(actions);

    modal.appendChild(form);
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

export function renderFeedManager(state, handlers) {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    modal.innerHTML = '';

    modal.appendChild(el('div', { className: 'modal-title', textContent: 'FEED MANAGER' }));

    const list = el('ul', { className: 'feed-list' });
    for (const url of state.feeds) {
        list.appendChild(el('li', { className: 'feed-item' }, [
            el('span', { className: 'feed-url', textContent: url }),
            el('button', { className: 'tt-btn danger', textContent: 'DEL', onClick: () => handlers.deleteFeed(url) }),
        ]));
    }
    modal.appendChild(list);

    const addRow = el('div', { className: 'feed-add-row' }, [
        el('input', { className: 'tt-input', id: 'new-feed-url', type: 'text', placeholder: 'https://example.com/rss.xml' }),
        el('button', { className: 'tt-btn', textContent: 'ADD', onClick: () => {
            const input = document.getElementById('new-feed-url');
            if (input.value.trim()) handlers.addFeed(input.value.trim());
        }}),
    ]);
    modal.appendChild(addRow);

    const actions = el('div', { className: 'feed-actions' }, [
        el('button', { className: 'tt-btn', textContent: 'CLOSE', onClick: handlers.closeModal }),
    ]);
    modal.appendChild(actions);

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

export function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
}

let toastTimeout = null;
export function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden', 'fade-out');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}

export function render(state, handlers) {
    renderHeader(state);
    if (state.view === 'detail') {
        renderArticleDetail(state, handlers);
    } else if (state.view === 'bookmarks') {
        renderBookmarks(state, handlers);
    } else {
        renderArticleList(state, handlers);
    }
    renderFooter(state);
}
