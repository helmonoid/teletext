let clockInterval = null;

function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') e.className = v;
        else if (k === 'textContent') e.textContent = v;
        else if (k === 'innerHTML') e.innerHTML = v;
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

    const pageInfo = state.settings.infinite_scroll
        ? `${state.articles.length} articles`
        : `Page ${state.page}/${state.totalPages}`;

    const info = el('div', { className: 'header-info' }, [
        el('span', { className: 'header-page', textContent: pageInfo }),
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

function buildArticleTable(articles, startOffset, handlers, state) {
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
        const classes = ['article-row'];
        if (globalIdx === state.highlightIndex) classes.push('highlighted');
        if (article.read) classes.push('read');

        const row = el('tr', { className: classes.join(' '), onClick: () => handlers.selectByIndex(globalIdx) }, [
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

function renderFilterBar(state, handlers) {
    if (!state.filterMode) return null;
    const bar = el('div', { className: 'filter-bar' }, [
        el('span', { className: 'filter-label', textContent: 'FILTER: ' }),
        el('input', {
            className: 'filter-input', id: 'filter-input', type: 'text',
            value: state.filterText, placeholder: 'type to filter...',
            onInput: (e) => handlers.setFilter(e.target.value),
            onKeydown: (e) => { if (e.key === 'Escape') handlers.closeFilter(); },
        }),
        el('button', { className: 'tt-btn filter-close', textContent: '\u2715', onClick: () => handlers.closeFilter() }),
    ]);
    return bar;
}

function getFilteredArticles(state) {
    if (!state.filterText) return state.articles;
    const q = state.filterText.toLowerCase();
    return state.articles.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q)
    );
}

export function renderArticleList(state, handlers) {
    const content = document.getElementById('content');

    if (state.loading) {
        content.innerHTML = '';
        content.appendChild(el('div', { className: 'loading-text', textContent: 'FETCHING FEEDS...' }));
        return;
    }

    if (state.articles.length === 0) {
        content.innerHTML = '';
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

    // If filter input is focused, only update the table (preserve input cursor)
    const existingFilterInput = document.getElementById('filter-input');
    const filterFocused = existingFilterInput && document.activeElement === existingFilterInput;

    if (filterFocused) {
        // Remove only the table and empty-state, keep filter bar
        const oldTable = content.querySelector('.article-table');
        const oldEmpty = content.querySelector('.empty-state');
        if (oldTable) oldTable.remove();
        if (oldEmpty) oldEmpty.remove();
    } else {
        content.innerHTML = '';
        const filterBar = renderFilterBar(state, handlers);
        if (filterBar) content.appendChild(filterBar);
    }

    const filtered = getFilteredArticles(state);

    if (filtered.length === 0 && state.filterText) {
        content.appendChild(el('div', { className: 'empty-state', textContent: 'No articles match filter.' }));
        return;
    }

    if (state.settings.infinite_scroll) {
        content.appendChild(buildArticleTable(filtered, 0, handlers, state));
    } else {
        const perPage = state.settings.articles_per_page || 8;
        const start = (state.page - 1) * perPage;
        const pageArticles = filtered.slice(start, start + perPage);
        content.appendChild(buildArticleTable(pageArticles, start, handlers, state));
    }

    // Focus filter input on first open (not when already focused)
    if (state.filterMode && !filterFocused) {
        setTimeout(() => {
            const input = document.getElementById('filter-input');
            if (input) input.focus();
        }, 0);
    }
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
        const classes = ['article-row'];
        if (article.read) classes.push('read');

        const row = el('tr', { className: classes.join(' '), onClick: () => handlers.selectByIndex(globalIdx) }, [
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
        '    ',
        article.read
            ? el('span', { className: 'read-badge', textContent: '\u2713 READ' })
            : el('span', { className: 'unread-badge', textContent: '\u25CF NEW' }),
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
        el('button', {
            className: 'tt-btn',
            textContent: article.read ? '\u2713 MARK UNREAD' : '\u25CF MARK READ',
            onClick: () => handlers.toggleReadFor(article),
        }),
        el('button', { className: 'tt-btn', textContent: '\u2190 BACK', onClick: handlers.back }),
    ]);
    view.appendChild(actions);

    content.appendChild(view);
}

export function renderFooter(state) {
    const footer = document.getElementById('footer');
    footer.innerHTML = '';

    if (!document.getElementById('number-input')) {
        const ni = el('div', { className: 'number-input hidden', id: 'number-input' });
        footer.appendChild(ni);
    }

    let shortcuts;
    if (state.view === 'list') {
        shortcuts = [
            ['N', 'Next'], ['P', 'Prev'], ['#', 'Go To'], ['\u2191\u2193', 'Nav'],
            ['/', 'Filter'], ['R', 'Refresh'],
            ['B', 'Bookmarks'], ['S', 'Settings'], ['F', 'Feeds'],
        ];
    } else if (state.view === 'bookmarks') {
        shortcuts = [
            ['ESC', 'Back'], ['\u2191\u2193', 'Nav'], ['R', 'Refresh'], ['S', 'Settings'], ['F', 'Feeds'],
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
    for (const t of ['dark', 'light', 'system', 'amber', 'green', 'blue', 'white']) {
        const opt = el('option', { value: t, textContent: t.toUpperCase() });
        if (t === state.settings.theme) opt.selected = true;
        themeSelect.appendChild(opt);
    }
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Theme' }),
        themeSelect,
    ]));

    // Font
    const fontSelect = el('select', { className: 'tt-select', id: 'setting-font' });
    for (const [val, label] of [
        ['default', 'DEFAULT'], ['vt323', 'VT323'], ['ibm-plex', 'IBM PLEX MONO'],
        ['fira-code', 'FIRA CODE'], ['space-mono', 'SPACE MONO'], ['jetbrains', 'JETBRAINS MONO'],
        ['press-start', 'PRESS START 2P'], ['share-tech', 'SHARE TECH MONO'],
    ]) {
        const opt = el('option', { value: val, textContent: label });
        if (val === state.settings.font) opt.selected = true;
        fontSelect.appendChild(opt);
    }
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Font' }),
        fontSelect,
    ]));

    // Layout
    const layoutInput = el('input', {
        className: 'tt-input', type: 'text', id: 'setting-layout',
        value: state.settings.layout || 'default',
        placeholder: 'e.g. 1400px, 80vw, 100%',
    });
    const layoutPresets = el('div', { className: 'layout-presets' });
    for (const [val, label] of [['compact', '720'], ['default', '960'], ['wide', '1200'], ['full', 'Full']]) {
        layoutPresets.appendChild(el('button', {
            className: 'tt-btn preset-btn' + ((state.settings.layout || 'default') === val ? ' active' : ''),
            textContent: label,
            onClick: (e) => {
                e.preventDefault();
                document.getElementById('setting-layout').value = val;
            },
        }));
    }
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Layout' }),
        el('div', { className: 'layout-control' }, [layoutInput, layoutPresets]),
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

    // Infinite scroll
    const scrollCheck = el('input', { type: 'checkbox', id: 'setting-scroll', className: 'tt-checkbox' });
    if (state.settings.infinite_scroll) scrollCheck.checked = true;
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Infinite Scroll' }),
        scrollCheck,
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

    // Notifications
    const notifCheck = el('input', { type: 'checkbox', id: 'setting-notif', className: 'tt-checkbox' });
    if (state.settings.notifications_enabled) notifCheck.checked = true;
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Notifications' }),
        notifCheck,
    ]));

    // Keyword alerts
    const keywordsInput = el('input', {
        className: 'tt-input', type: 'text', id: 'setting-keywords',
        value: (state.settings.keyword_alerts || []).join(', '),
        placeholder: 'e.g. breaking, climate, tech',
    });
    form.appendChild(el('div', { className: 'settings-row' }, [
        el('label', { className: 'settings-label', textContent: 'Alert Keywords' }),
        keywordsInput,
    ]));

    const actions = el('div', { className: 'settings-actions' }, [
        el('button', { className: 'tt-btn', textContent: 'SAVE', onClick: () => handlers.saveSettings({
            theme: document.getElementById('setting-theme').value,
            font: document.getElementById('setting-font').value,
            layout: document.getElementById('setting-layout').value,
            articles_per_page: parseInt(document.getElementById('setting-perpage').value) || 8,
            infinite_scroll: document.getElementById('setting-scroll').checked,
            auto_refresh_seconds: parseInt(document.getElementById('setting-refresh').value) || 0,
            notifications_enabled: document.getElementById('setting-notif').checked,
            keyword_alerts: document.getElementById('setting-keywords').value
                .split(',').map(s => s.trim()).filter(Boolean),
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

    // Feed list with health indicators
    const list = el('ul', { className: 'feed-list' });
    const health = state.feedHealth || {};
    for (const url of state.feeds) {
        const h = health[url];
        let statusIcon = '\u2022'; // bullet
        let statusClass = 'feed-status-unknown';
        if (h) {
            if (h.error_count > 0) {
                statusIcon = '\u2716'; // X
                statusClass = 'feed-status-error';
            } else if (h.last_success) {
                statusIcon = '\u2714'; // checkmark
                statusClass = 'feed-status-ok';
            }
        }
        list.appendChild(el('li', { className: 'feed-item' }, [
            el('span', { className: `feed-status ${statusClass}`, textContent: statusIcon }),
            el('span', { className: 'feed-url', textContent: url }),
            h && h.article_count ? el('span', { className: 'feed-count', textContent: `(${h.article_count})` }) : null,
            el('button', { className: 'tt-btn danger', textContent: 'DEL', onClick: () => handlers.deleteFeed(url) }),
        ]));
    }
    modal.appendChild(list);

    // Add feed row
    const addRow = el('div', { className: 'feed-add-row' }, [
        el('input', { className: 'tt-input', id: 'new-feed-url', type: 'text', placeholder: 'https://example.com/rss.xml' }),
        el('button', { className: 'tt-btn', textContent: 'ADD', onClick: () => {
            const input = document.getElementById('new-feed-url');
            if (input.value.trim()) handlers.addFeed(input.value.trim());
        }}),
    ]);
    modal.appendChild(addRow);

    // Feed discovery
    const discoverRow = el('div', { className: 'feed-add-row' }, [
        el('input', { className: 'tt-input', id: 'discover-url', type: 'text', placeholder: 'https://example.com (auto-discover RSS)' }),
        el('button', { className: 'tt-btn', textContent: 'DISCOVER', onClick: () => {
            const input = document.getElementById('discover-url');
            if (input.value.trim()) handlers.discoverFeeds(input.value.trim());
        }}),
    ]);
    modal.appendChild(discoverRow);

    // Discovered feeds list (shown after discovery)
    if (state.discoveredFeeds && state.discoveredFeeds.length > 0) {
        const discList = el('ul', { className: 'feed-list discovered' });
        for (const feed of state.discoveredFeeds) {
            discList.appendChild(el('li', { className: 'feed-item discovered-item' }, [
                el('span', { className: 'feed-url', textContent: `${feed.title} - ${feed.url}` }),
                el('button', { className: 'tt-btn', textContent: 'ADD', onClick: () => handlers.addFeed(feed.url) }),
            ]));
        }
        modal.appendChild(discList);
    }

    // OPML import/export
    const opmlRow = el('div', { className: 'feed-opml-row' }, [
        el('button', { className: 'tt-btn', textContent: 'IMPORT OPML', onClick: () => handlers.importOpml() }),
        el('button', { className: 'tt-btn', textContent: 'EXPORT OPML', onClick: () => handlers.exportOpml() }),
    ]);
    modal.appendChild(opmlRow);

    // Hidden file input for OPML import
    const fileInput = el('input', { type: 'file', id: 'opml-file-input', accept: '.opml,.xml', className: 'hidden' });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => handlers.importOpmlContent(ev.target.result);
            reader.readAsText(file);
        }
    });
    modal.appendChild(fileInput);

    const feedActions = el('div', { className: 'feed-actions' }, [
        el('button', { className: 'tt-btn', textContent: 'CLOSE', onClick: handlers.closeModal }),
    ]);
    modal.appendChild(feedActions);

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

export function updateFavicon(unreadCount) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Draw base icon (TV shape)
    ctx.fillStyle = '#0000cc';
    ctx.fillRect(2, 4, 28, 24);
    ctx.fillStyle = '#000';
    ctx.fillRect(4, 6, 24, 20);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TT', 16, 20);

    // Badge with unread count
    if (unreadCount > 0) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(26, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unreadCount > 99 ? '99+' : String(unreadCount), 26, 8);
    }

    link.href = canvas.toDataURL('image/png');
}

export function render(state, handlers) {
    renderHeader(state);
    const content = document.getElementById('content');
    // Page transition
    content.classList.add('page-transition');
    requestAnimationFrame(() => {
        if (state.view === 'detail') {
            renderArticleDetail(state, handlers);
        } else if (state.view === 'bookmarks') {
            renderBookmarks(state, handlers);
        } else {
            renderArticleList(state, handlers);
        }
        renderFooter(state);
        requestAnimationFrame(() => content.classList.remove('page-transition'));
    });
}
