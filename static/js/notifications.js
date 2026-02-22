let permission = 'default';

export async function requestPermission() {
    if (!('Notification' in window)) return false;
    permission = await Notification.requestPermission();
    return permission === 'granted';
}

export function isEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
}

export function notify(title, body, url) {
    if (!isEnabled()) return;
    try {
        const n = new Notification(title, {
            body,
            icon: '/favicon.svg',
            tag: 'teletext-' + (url || ''),
        });
        if (url) {
            n.onclick = () => { window.focus(); n.close(); };
        }
        setTimeout(() => n.close(), 8000);
    } catch (e) { /* ignore */ }
}

export function checkKeywordAlerts(articles, keywords, previousUrls) {
    if (!keywords || keywords.length === 0) return [];
    const prevSet = new Set(previousUrls);
    const newArticles = articles.filter(a => a.url && !prevSet.has(a.url));
    const matches = [];
    for (const article of newArticles) {
        const text = ((article.title || '') + ' ' + (article.summary || '')).toLowerCase();
        for (const kw of keywords) {
            if (kw && text.includes(kw.toLowerCase())) {
                matches.push({ article, keyword: kw });
                break;
            }
        }
    }
    return matches;
}
