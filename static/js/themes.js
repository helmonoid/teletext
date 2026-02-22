const FONT_MAP = {
    'default': "'Courier New', Consolas, 'Liberation Mono', monospace",
    'vt323': "'VT323', monospace",
    'ibm-plex': "'IBM Plex Mono', monospace",
    'fira-code': "'Fira Code', monospace",
    'space-mono': "'Space Mono', monospace",
    'jetbrains': "'JetBrains Mono', monospace",
    'press-start': "'Press Start 2P', monospace",
    'share-tech': "'Share Tech Mono', monospace",
};

const LAYOUT_MAP = {
    'compact': '720px',
    'default': '960px',
    'wide': '1200px',
    'full': '100%',
};

export function applyTheme(name) {
    if (name === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', name);
    }
}

export function applyFont(name) {
    const fontFamily = FONT_MAP[name] || FONT_MAP['default'];
    document.documentElement.style.setProperty('--font', fontFamily);
}

export function applyLayout(name) {
    const maxWidth = LAYOUT_MAP[name] || LAYOUT_MAP['default'];
    document.documentElement.style.setProperty('--max-width', maxWidth);
}

export function initThemeListener(getThemeName) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getThemeName() === 'system') {
            applyTheme('system');
        }
    });
}
