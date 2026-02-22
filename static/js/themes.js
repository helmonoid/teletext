export function applyTheme(name) {
    if (name === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', name);
    }
}

export function initThemeListener(getThemeName) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getThemeName() === 'system') {
            applyTheme('system');
        }
    });
}
