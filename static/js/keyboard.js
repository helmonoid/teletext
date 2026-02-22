let numberBuffer = '';
let numberTimeout = null;

export function initKeyboard(handlers) {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = e.key.toLowerCase();

        // Number keys: buffer digits, fire after 600ms pause or on Enter
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            numberBuffer += e.key;
            handlers.showNumberInput(numberBuffer);
            clearTimeout(numberTimeout);
            numberTimeout = setTimeout(() => {
                const num = parseInt(numberBuffer);
                numberBuffer = '';
                handlers.clearNumberInput();
                if (num > 0) handlers.selectArticle(num);
            }, 800);
            return;
        }

        if (e.key === 'Enter' && numberBuffer) {
            e.preventDefault();
            clearTimeout(numberTimeout);
            const num = parseInt(numberBuffer);
            numberBuffer = '';
            handlers.clearNumberInput();
            if (num > 0) handlers.selectArticle(num);
            return;
        }

        // Clear number buffer on any non-digit key
        if (numberBuffer) {
            clearTimeout(numberTimeout);
            numberBuffer = '';
            handlers.clearNumberInput();
        }

        switch (key) {
            case 'n': e.preventDefault(); handlers.nextPage(); break;
            case 'p': e.preventDefault(); handlers.prevPage(); break;
            case 'r': e.preventDefault(); handlers.refresh(); break;
            case 'b': e.preventDefault(); handlers.toggleBookmark(); break;
            case 's': e.preventDefault(); handlers.openSettings(); break;
            case 'f': e.preventDefault(); handlers.openFeedManager(); break;
            case 'escape': e.preventDefault(); handlers.back(); break;
        }
    });
}
