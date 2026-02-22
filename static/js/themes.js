const FONT_MAP = {
    'default': "'Courier New', Consolas, 'Liberation Mono', monospace",
    'vt323': "'VT323', monospace",
    'ibm-plex': "'IBM Plex Mono', monospace",
    'fira-code': "'Fira Code', monospace",
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

export function initThemeListener(getThemeName) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getThemeName() === 'system') {
            applyTheme('system');
        }
    });
}
