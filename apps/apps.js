(() => {
    'use strict';

    const STORE = 'ChApp Store';
    const ASSETS = '/assets/apps/';
    const BASE = '/apps/';

    // Release fields (version, date, size, download link, notes) are refreshed
    // from GitHub on load; these values are the fallback if that request fails.
    const APPS = [
        {
            id: 'mewp',
            repo: 'ExplodingCB/mewp',
            name: 'Mewp',
            subtitle: 'A free, native Mac cleaner',
            platform: 'mac',
            kicker: 'New app',
            headline: 'Clean up your Mac, carefully',
            feature: { src: 'mewp-space-map.webp', width: 1200, height: 784, bg: '#1b1e2c', w: '86%', top: '11%' },
            screenshots: [
                { src: 'mewp-checkup.webp', width: 1200, height: 784, alt: 'Checkup, a one-pass scan for junk, leftovers, and system health' },
                { src: 'mewp-space-map.webp', width: 1200, height: 784, alt: 'Space Map, a bubble map of what is using disk space' },
                { src: 'mewp-performance.webp', width: 1200, height: 784, alt: 'Performance, showing memory pressure, battery health, and CPU load' }
            ],
            about: [
                'Junk cleanup, a disk space map, large-file and duplicate finders, an uninstaller, and a menu-bar monitor. It’s built on native APIs, with a safety database that decides what’s allowed to be touched.',
                'Deletes go to the Trash first, only safe items are pre-selected, and nothing is removed until you check a box.'
            ],
            features: ['Checkup', 'Cleanup', 'Space Map', 'Large Files', 'Duplicates', 'Uninstaller', 'Similar Images', 'Performance', 'Startup Items'],
            requires: ['macOS 14', 'or later'],
            compatibility: 'macOS 14 or later, Apple silicon or Intel',
            language: ['Swift', 'SwiftUI'],
            category: 'Utilities',
            install: 'brew install --cask explodingcb/tap/mewp',
            note: 'Mewp is ad-hoc signed, not notarized. Homebrew clears the quarantine flag for you. If you use the zip, run <code>xattr -dr com.apple.quarantine /Applications/Mewp.app</code> after unzipping. Most modules need Full Disk Access, which has to be granted again after each upgrade.',
            asset: /\.zip$/i,
            release: { version: '0.5.1', date: '2026-09-24T22:33:47Z', size: 2305570, url: 'https://github.com/ExplodingCB/mewp/releases/latest', notes: [] }
        },
        {
            id: 'tv-remote',
            repo: 'ExplodingCB/tv-remote',
            name: 'TV Remote',
            subtitle: 'A Siri Remote for your Mac',
            platform: 'mac',
            kicker: 'New app',
            headline: 'Your Apple TV, on your Mac',
            feature: { src: 'tv-remote-shot.png', width: 480, height: 1512, bg: '#2a2a2c', w: '30%', top: '-36%' },
            screenshots: [
                { src: 'tv-remote-shot.png', width: 480, height: 1512, alt: 'The TV Remote window, shaped like a Siri Remote' }
            ],
            about: [
                'Control your Apple TV from your Mac with a small native app that looks and works like the Siri Remote. Close the window and it tucks into the menu bar.',
                'Trackpad mode (⌘T) turns your whole trackpad into the remote’s touch surface. Arrow keys, Return, Space, and the volume keys work too, and a keyboard opens whenever a text field is focused on the TV.'
            ],
            requires: ['macOS 15', 'or later'],
            compatibility: 'macOS 15 or later, Apple silicon or Intel',
            language: ['Swift', 'SwiftUI'],
            category: 'Utilities',
            install: 'brew install --cask explodingcb/tap/tv-remote',
            note: 'TV Remote is ad-hoc signed, not notarized. Homebrew clears the quarantine flag for you. If you use the zip, run <code>xattr -dr com.apple.quarantine "/Applications/TV Remote.app"</code> after unzipping.',
            asset: /\.zip$/i,
            release: { version: '1.0.2', date: '2026-09-24T22:00:00Z', size: 857496, url: 'https://github.com/ExplodingCB/tv-remote/releases/latest', notes: [] }
        },
        {
            id: 'tempmanager',
            repo: 'ExplodingCB/tempmanager',
            name: 'tempmanager',
            subtitle: 'Temperatures in your tray',
            platform: 'windows',
            kicker: 'For Windows',
            headline: 'Keep an eye on your temps',
            feature: { src: 'tempmanager-shot.png', width: 427, height: 405, bg: '#2b1f1e', w: '58%', top: '12%' },
            screenshots: [
                { src: 'tempmanager-shot.png', width: 427, height: 405, alt: 'The tempmanager popup with readings and a history chart for a CPU, a GPU, and two drives' }
            ],
            about: [
                'A tray temperature readout written in Rust against native Win32. Left-click the icon for current readings, a history chart, and a slider for how often it samples.',
                'It reads NVIDIA GPUs through the display driver, NVMe and SATA drives through Windows, and AMD Ryzen CPUs through AMD’s monitoring SDK. It runs on one thread with fixed-size buffers, so it stays out of the way.'
            ],
            requires: ['Windows 10', 'or 11'],
            compatibility: 'Windows 10 or 11, 64-bit',
            language: ['Rust', 'Win32'],
            category: 'Utilities',
            install: 'winget install ExplodingCB.tempmanager',
            note: 'tempmanager isn’t code-signed, so SmartScreen may say “Windows protected your PC” the first time. Choose More info, then Run anyway. CPU temperatures on Ryzen need the AMD SDK and admin rights.',
            asset: /setup.*\.exe$/i,
            release: { version: '0.1.1', date: '2026-09-24T23:58:56Z', size: 2248552, url: 'https://github.com/ExplodingCB/tempmanager/releases/latest', notes: [] }
        },
        {
            id: 'termloft',
            url: 'https://schedule.explodingcb.com/',
            iconFile: 'termloft-icon.svg',
            name: 'Termloft',
            subtitle: 'Your college workspace',
            platform: 'web',
            kicker: 'On the web',
            headline: 'College is a lot. Keep it together.',
            feature: { src: 'termloft-home.webp', width: 1200, height: 683, bg: '#18382c', w: '86%', top: '11%' },
            screenshots: [
                { src: 'termloft-home.webp', width: 1200, height: 683, alt: 'The Termloft home page, with an example week of classes and due dates' }
            ],
            about: [
                'Your classes, due dates, four-year plan, and lecture recordings in one place. Upload a syllabus or paste a Canvas or Brightspace feed, and the deadlines fill themselves in.',
                'I started it as a Purdue student. It runs in the browser, so there’s nothing to install. Signing up takes an invite for now.'
            ],
            info: [
                ['Price', 'Free', 'Invite only'],
                ['Runs in', 'Browser', 'Any device'],
                ['Category', 'Education', 'Web']
            ],
            compatibility: 'Any modern browser',
            category: 'Education'
        },
        {
            id: 'notebook-to-pdf',
            url: 'https://pdf.explodingcb.com/',
            source: 'ExplodingCB/notebook-to-pdf',
            name: 'Notebook to PDF',
            subtitle: 'Jupyter notebooks to clean PDFs',
            platform: 'web',
            kicker: 'New app',
            headline: 'Hand in notebooks without the cut-off code',
            feature: { src: 'notebook-to-pdf-home.webp', width: 1200, height: 760, bg: '#2b2d31', w: '86%', top: '11%' },
            screenshots: [
                { src: 'notebook-to-pdf-home.webp', width: 1200, height: 760, alt: 'Notebook to PDF with an example physics notebook in the page preview' }
            ],
            about: [
                'Drop in a Jupyter notebook and get a PDF that looks like the notebook: markdown, LaTeX math, highlighted code, plots, and tables. Long lines wrap and wide tables and equations shrink to fit, so nothing runs off the page.',
                'It converts right in the browser in about a second. Your file is never uploaded, and there are no ads.'
            ],
            info: [
                ['Price', 'Free', 'Open source'],
                ['Runs in', 'Browser', 'Any device'],
                ['Category', 'Utilities', 'Web']
            ],
            compatibility: 'Any modern browser',
            category: 'Utilities'
        },
        {
            id: 'betrcooking',
            url: 'https://betrcooking.com/',
            name: 'BetrCooking',
            subtitle: 'The family recipe book',
            platform: 'web',
            kicker: 'On the web',
            headline: 'A family recipe book you can actually cook from',
            feature: { src: 'betrcooking-recipe.webp', width: 1200, height: 750, bg: '#1b4332', w: '86%', top: '11%' },
            screenshots: [
                { src: 'betrcooking-home.webp', width: 1200, height: 750, alt: 'The BetrCooking recipe index, with the recipe of the day and recipes grouped by category' },
                { src: 'betrcooking-recipe.webp', width: 1200, height: 750, alt: 'A chicken stew recipe with scale buttons, cook mode, and an ingredient checklist' }
            ],
            about: [
                'Our family’s recipes in one place, from Grandma’s bread to the holiday cocktails. Search by name or ingredient, browse by category, or hit Surprise me when nobody can pick dinner.',
                'Every recipe scales, checks off as you go, and has a cook mode that keeps your screen awake. Anyone in the family can make an account to rate, comment, and add recipes, or import one straight from a link.'
            ],
            info: [
                ['Price', 'Free', 'No ads'],
                ['Runs in', 'Browser', 'Any device'],
                ['Category', 'Food & Drink', 'Web']
            ],
            compatibility: 'Any modern browser',
            category: 'Food & Drink'
        },
        {
            id: 'tabletop-tyrant',
            url: 'https://explodingcb.com/play/tabletop-tyrant/',
            name: 'Tabletop Tyrant',
            subtitle: 'Wreck a tiny village on your desk',
            platform: 'web',
            kicker: 'New game',
            headline: 'A tiny village on your desk, and your hands are the weather',
            feature: { src: 'tabletop-tyrant-domain.webp', width: 1200, height: 750, bg: '#101d17', w: '86%', top: '11%' },
            screenshots: [
                { src: 'tabletop-tyrant-hero.webp', width: 1200, height: 750, alt: 'The start screen, with a little village turning slowly beside the title' },
                { src: 'tabletop-tyrant-play.webp', width: 1200, height: 750, alt: 'A tornado tearing through the village while a meteor comes in, during a 60-hit combo' },
                { src: 'tabletop-tyrant-domain.webp', width: 1200, height: 750, alt: 'Domain Expansion: a black hole opens over the village in a starfield void' }
            ],
            about: [
                'Point your laptop’s camera at the table in front of you and a little village builds itself across the desk. MediaPipe tracks your hands in 3D, so you can press houses flat, sweep the board clear, slap the table for an earthquake, or pinch a villager and throw them.',
                'Wrecking things fills a power meter, and quick chains multiply it. Spend half a meter on a tornado you steer with your finger, or fill it and cross your fingers for Domain Expansion. It all runs in your browser, and the video never leaves your computer. No camera? It plays with a mouse too.'
            ],
            info: [
                ['Price', 'Free', 'No ads'],
                ['Runs in', 'Browser', 'Webcam or mouse'],
                ['Category', 'Games', 'Web']
            ],
            compatibility: 'Chrome or Edge on a laptop with a webcam, or any browser with a mouse',
            category: 'Games'
        }
    ];

    const PLATFORM = { mac: 'Mac', windows: 'Windows', web: 'Web' };
    const SECTIONS = ['discover', 'mac', 'windows', 'web'];
    const byId = Object.fromEntries(APPS.map(app => [app.id, app]));
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const inlineMd = s => escapeHtml(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    const formatSize = bytes => {
        const mb = bytes / 1048576;
        return mb < 10 ? mb.toFixed(1) : String(Math.round(mb));
    };

    const relativeDate = iso => {
        const days = Math.round((Date.parse(iso) - Date.now()) / 86400000);
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        if (Math.abs(days) < 30) return rtf.format(days, 'day');
        if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), 'month');
        return rtf.format(Math.round(days / 365), 'year');
    };
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    const icon = (app, size, cls = 'app-icon') =>
        `<img class="${cls}" src="${ASSETS}${app.iconFile || `${app.id}-icon.png`}" alt="" width="${size}" height="${size}" decoding="async">`;
    const repoUrl = app => `https://github.com/${app.repo}`;
    const isWeb = app => app.platform === 'web';

    /* ---------- Shell ---------- */

    // Every page under /apps/ is the same empty body with its own link-preview
    // tags, so the layout lives here rather than in the HTML.
    const NAV_ICONS = {
        discover: '<path d="M8 .9l2.1 4.4 4.8.6-3.5 3.3.9 4.8L8 11.7 3.7 14l.9-4.8L1.1 5.9l4.8-.6z"/>',
        mac: '<path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282"/>',
        windows: '<path d="M6.555 1.375 0 2.237v5.45h6.555zM0 13.795l6.555.933V8.313H0zm7.278-5.4.026 6.378L16 16V8.395zM16 0 7.33 1.244v6.414H16z"/>',
        web: '<path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>'
    };
    const ARROWS = `
        <div class="arrows" hidden>
            <button type="button" data-dir="-1" aria-label="Previous"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg></button>
            <button type="button" data-dir="1" aria-label="Next"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button>
        </div>`;

    const renderShell = () => {
        const navItem = id => `
            <a href="${BASE}#${id}" data-nav="${id}">
                <svg viewBox="0 0 16 16" aria-hidden="true">${NAV_ICONS[id]}</svg>
                <span>${id === 'discover' ? 'Discover' : PLATFORM[id]}</span>
            </a>`;
        const shelf = id => `
            <section class="shelf" id="${id}" aria-labelledby="${id}-title">
                <div class="shelf-head"><h2 id="${id}-title">${PLATFORM[id]}</h2>${ARROWS}</div>
                <ul class="lockups carousel" data-platform="${id}"></ul>
            </section>`;

        document.body.insertAdjacentHTML('afterbegin', `
            <a class="skip-link" href="#main">Skip to content</a>
            <div class="app">
                <aside class="sidebar">
                    <a class="brand" href="${BASE}">
                        <img src="${ASSETS}chase-logo.png" alt="" width="28" height="28">
                        <span>${STORE}</span>
                    </a>
                    <nav class="nav" aria-label="Store">${SECTIONS.map(navItem).join('')}</nav>
                    <a class="account" href="/" title="Back to explodingcb.com">
                        <img src="/assets/chase.png" alt="" width="28" height="28">
                        <span><strong>Chase Culbertson</strong><small>explodingcb.com</small></span>
                    </a>
                </aside>
                <main class="main" id="main">
                    <div class="view" id="store">
                        <section class="shelf shelf-discover" id="discover" aria-labelledby="discover-title">
                            <div class="shelf-head"><h1 class="page-title" id="discover-title">Discover</h1>${ARROWS}</div>
                            <ul class="editorial carousel" aria-label="Featured apps"></ul>
                        </section>
                        ${SECTIONS.slice(1).map(shelf).join('')}
                        <footer class="store-foot"><p>Everything here is free. Not affiliated with Apple.</p></footer>
                    </div>
                    <article class="view product" id="product" hidden></article>
                </main>
            </div>`);
    };

    /* ---------- Store ---------- */

    const renderStore = () => {
        $('.editorial').innerHTML = APPS.map(app => {
            const f = app.feature;
            return `
            <li>
                <a class="feature" href="${BASE}${app.id}/">
                    <p class="kicker">${app.kicker}</p>
                    <h2 class="feature-title">${app.headline}</h2>
                    <p class="feature-sub">${app.name} &middot; ${PLATFORM[app.platform]}</p>
                    <div class="feature-art" style="--bg:${f.bg};--w:${f.w};--top:${f.top}">
                        <img src="${ASSETS}${f.src}" alt="" width="${f.width}" height="${f.height}" decoding="async">
                    </div>
                </a>
            </li>`;
        }).join('');

        $$('.lockups').forEach(list => {
            list.innerHTML = APPS.filter(a => a.platform === list.dataset.platform).map(app => `
                <li>
                    <a class="lockup" href="${BASE}${app.id}/">
                        ${icon(app, 64)}
                        <span class="lockup-text">
                            <span class="lockup-name">${app.name}</span>
                            <span class="lockup-sub">${app.subtitle}</span>
                        </span>
                        <span class="get">${isWeb(app) ? 'Open' : 'Get'}</span>
                    </a>
                </li>`).join('');
        });
    };

    const setupArrows = () => {
        $$('.shelf').forEach(shelf => {
            const list = $('.carousel', shelf);
            const arrows = $('.arrows', shelf);
            const [prev, next] = $$('button', arrows);
            const update = () => {
                arrows.hidden = list.scrollWidth <= list.clientWidth + 8;
                prev.disabled = list.scrollLeft <= 2;
                next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
            };
            arrows.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (btn) list.scrollBy({ left: Number(btn.dataset.dir) * list.clientWidth, behavior: 'smooth' });
            });
            list.addEventListener('scroll', update, { passive: true });
            new ResizeObserver(update).observe(list);
        });
    };

    /* ---------- Product page ---------- */

    let productView;
    let storeView;

    const renderProduct = app => {
        const web = isWeb(app);
        const r = app.release;
        const shots = app.screenshots || [];
        const info = web ? app.info : [
            ['Price', 'Free', 'Open source'],
            ['Version', r.version, capitalize(relativeDate(r.date))],
            ['Size', formatSize(r.size), 'MB'],
            ['Requires', app.requires[0], app.requires[1]],
            ['Language', app.language[0], app.language[1]],
            ['Category', app.category, PLATFORM[app.platform]]
        ];
        const host = web && new URL(app.url).host;
        const details = web ? [
            ['Developer', 'Chase Culbertson'],
            ['Category', app.category],
            ['Compatibility', app.compatibility],
            ['Website', `<a href="${app.url}" target="_blank" rel="noopener noreferrer">${host}</a>`],
            ...(app.source ? [
                ['License', 'MIT'],
                ['Source code', `<a href="https://github.com/${app.source}" target="_blank" rel="noopener noreferrer">github.com/${app.source}</a>`]
            ] : [])
        ] : [
            ['Developer', 'Chase Culbertson'],
            ['Size', `${formatSize(r.size)} MB`],
            ['Category', app.category],
            ['Compatibility', app.compatibility],
            ['License', 'MIT'],
            ['Source code', `<a href="${repoUrl(app)}" target="_blank" rel="noopener noreferrer">github.com/${app.repo}</a>`]
        ];
        const actions = web ? `
                        <a class="get get-fill" href="${app.url}" target="_blank" rel="noopener noreferrer">Open</a>
                        <a class="text-button" href="${app.url}" target="_blank" rel="noopener noreferrer">${host}</a>` : `
                        <a class="get get-fill" href="${escapeHtml(r.url)}" rel="noopener noreferrer">Get</a>
                        <a class="text-button" href="${repoUrl(app)}" target="_blank" rel="noopener noreferrer">GitHub</a>`;

        productView.innerHTML = `
            <div class="product-bar">
                <a class="back" href="${BASE}#${app.platform}">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>
                    ${PLATFORM[app.platform]}
                </a>
            </div>

            <header class="product-head">
                ${icon(app, 128, 'app-icon product-icon')}
                <div class="product-title">
                    <h1>${app.name}</h1>
                    <p class="product-sub">${app.subtitle}</p>
                    <a class="product-dev" href="/">Chase Culbertson</a>
                    <div class="product-actions">${actions}
                        <button type="button" class="text-button share" data-share="${app.id}">Share</button>
                    </div>
                </div>
            </header>

            <dl class="info-strip">${info.map(([k, v, c]) => `
                <div><dt>${k}</dt><dd><b>${escapeHtml(v)}</b><span>${escapeHtml(c)}</span></dd></div>`).join('')}
            </dl>

            ${shots.length ? `
            <section class="block">
                <ul class="shots">${shots.map(s => `
                    <li class="${s.height > s.width ? 'tall' : ''}"><img src="${ASSETS}${s.src}" alt="${escapeHtml(s.alt)}" width="${s.width}" height="${s.height}" loading="lazy" decoding="async"></li>`).join('')}
                </ul>
            </section>` : ''}

            <section class="block">
                ${app.about.map(p => `<p class="prose">${p}</p>`).join('')}
                ${app.features ? `<p class="prose muted">Includes ${app.features.slice(0, -1).join(', ')}, and ${app.features[app.features.length - 1]}.</p>` : ''}
            </section>

            ${r && r.notes.length ? `
            <section class="block">
                <div class="block-head">
                    <h2>What’s New</h2>
                    <span>Version ${escapeHtml(r.version)}</span>
                </div>
                <ul class="notes">${r.notes.map(n => `<li>${n}</li>`).join('')}</ul>
            </section>` : ''}

            ${web ? '' : `
            <section class="block">
                <div class="block-head"><h2>Install</h2></div>
                <div class="command">
                    <code>${escapeHtml(app.install)}</code>
                    <button type="button" class="copy" data-copy="${escapeHtml(app.install)}">Copy</button>
                </div>
                <p class="prose muted">Or <a href="${escapeHtml(r.url)}" rel="noopener noreferrer">download ${escapeHtml(r.file || 'the latest release')}</a>. ${app.note}</p>
            </section>`}

            <section class="block">
                <div class="block-head"><h2>Information</h2></div>
                <dl class="details">${details.map(([k, v]) => `
                    <div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
                </dl>
            </section>`;
    };

    /* ---------- Routing ---------- */

    // Apps live at /apps/<id>/ so each has its own link preview; store
    // sections are /apps/#mac and so on. Old /apps/#<id> links still work.
    let current = null;
    let storeScroll = 0;

    const appFromPath = () => {
        const m = location.pathname.match(/\/apps\/([^/]+)\/?$/);
        return m && byId[decodeURIComponent(m[1])] ? decodeURIComponent(m[1]) : null;
    };

    const setActiveNav = id => $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === id));

    // Highlight the nav item for whichever store section is in view.
    const spy = () => {
        if (current) return;
        const y = window.scrollY + window.innerHeight * 0.4;
        let active = 'discover';
        for (const id of SECTIONS.slice(1)) {
            if (document.getElementById(id).offsetTop <= y) active = id;
        }
        if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            active = SECTIONS[SECTIONS.length - 1];
        }
        setActiveNav(active);
    };

    const route = () => {
        const hash = decodeURIComponent(location.hash.slice(1));
        if (byId[hash]) history.replaceState(null, '', `${BASE}${hash}/`);

        const app = byId[appFromPath()];
        if (app) {
            if (!current) storeScroll = window.scrollY;
            current = app.id;
            renderProduct(app);
            storeView.hidden = true;
            productView.hidden = false;
            document.title = `${app.name} · ${STORE}`;
            setActiveNav(app.platform);
            window.scrollTo(0, 0);
            return;
        }

        const wasProduct = current !== null;
        current = null;
        productView.hidden = true;
        storeView.hidden = false;
        document.title = STORE;

        if (hash === 'discover') window.scrollTo(0, 0);
        else if (SECTIONS.includes(hash)) document.getElementById(hash).scrollIntoView();
        else if (wasProduct) window.scrollTo(0, storeScroll);
        spy();
    };

    // Links inside the store change the view without reloading the page.
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href]');
        if (!link || link.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const url = new URL(link.href);
        if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
        e.preventDefault();
        if (url.href !== location.href) history.pushState(null, '', url.href);
        route();
    });

    window.addEventListener('popstate', route);
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', spy, { passive: true });

    document.addEventListener('click', e => {
        const copy = e.target.closest('.copy');
        if (copy) {
            navigator.clipboard?.writeText(copy.dataset.copy).then(() => {
                copy.textContent = 'Copied';
                setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
            });
            return;
        }

        const share = e.target.closest('.share');
        if (share) {
            const app = byId[share.dataset.share];
            const url = `${location.origin}${BASE}${app.id}/`;
            if (navigator.share) {
                navigator.share({ title: app.name, text: app.subtitle, url }).catch(() => {});
            } else {
                navigator.clipboard?.writeText(url).then(() => {
                    share.textContent = 'Link copied';
                    setTimeout(() => { share.textContent = 'Share'; }, 1600);
                });
            }
        }
    });

    /* ---------- Live release data ---------- */

    const parseNotes = body => {
        const lines = body.replace(/\r/g, '').split('\n');
        const start = lines.findIndex(l => /^##\s+What[’']s (in|new)/i.test(l));
        if (start < 0) return [];
        const notes = [];
        for (const line of lines.slice(start + 1)) {
            if (/^##\s/.test(line)) break;
            if (/^\s*[-*]\s+/.test(line)) notes.push(line.replace(/^\s*[-*]\s+/, ''));
            else if (/^\s{2,}\S/.test(line) && notes.length) notes[notes.length - 1] += ' ' + line.trim();
        }
        return notes.map(inlineMd);
    };

    const fetchRelease = async app => {
        const key = `release:${app.repo}`;
        try {
            const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (cached && Date.now() - cached.at < 3600000) return cached.data;
        } catch (_) { /* storage unavailable */ }

        const res = await fetch(`https://api.github.com/repos/${app.repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
        if (!res.ok) throw new Error(`GitHub ${res.status}`);
        const json = await res.json();
        const asset = json.assets.find(a => app.asset.test(a.name));
        const data = {
            version: json.tag_name.replace(/^v/, ''),
            date: json.published_at,
            size: asset ? asset.size : app.release.size,
            url: asset ? asset.browser_download_url : json.html_url,
            file: asset ? asset.name : null,
            notes: parseNotes(json.body || '')
        };
        try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch (_) { /* ignore */ }
        return data;
    };

    const refreshReleases = () => Promise.allSettled(APPS.filter(app => app.repo).map(async app => {
        app.release = { ...app.release, ...await fetchRelease(app) };
        if (current === app.id) renderProduct(app);
    }));

    renderShell();
    productView = $('#product');
    storeView = $('#store');
    renderStore();
    setupArrows();
    route();
    refreshReleases();
})();
