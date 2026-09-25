(() => {
    'use strict';

    const STORE = 'ChApp Store';
    const ASSETS = '../assets/apps/';

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

    /* ---------- Store ---------- */

    const renderStore = () => {
        $('.editorial').innerHTML = APPS.map(app => {
            const f = app.feature;
            return `
            <li>
                <a class="feature" href="#${app.id}">
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
                    <a class="lockup" href="#${app.id}">
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

    const productView = $('#product');
    const storeView = $('#store');

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
            ['Website', `<a href="${app.url}" target="_blank" rel="noopener noreferrer">${host}</a>`]
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
                <a class="back" href="#${app.platform}">
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>
                    ${PLATFORM[app.platform]}
                </a>
            </div>

            <header class="product-head">
                ${icon(app, 128, 'app-icon product-icon')}
                <div class="product-title">
                    <h1>${app.name}</h1>
                    <p class="product-sub">${app.subtitle}</p>
                    <a class="product-dev" href="../">Chase Culbertson</a>
                    <div class="product-actions">${actions}
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

    let current = null;
    let storeScroll = 0;

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
        const id = decodeURIComponent(location.hash.slice(1));
        const app = byId[id];

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

        if (id === 'discover') window.scrollTo(0, 0);
        else if (SECTIONS.includes(id)) document.getElementById(id).scrollIntoView();
        else if (wasProduct) window.scrollTo(0, storeScroll);
        spy();
    };

    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', spy, { passive: true });

    document.addEventListener('click', e => {
        const copy = e.target.closest('.copy');
        if (!copy) return;
        navigator.clipboard?.writeText(copy.dataset.copy).then(() => {
            copy.textContent = 'Copied';
            setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
        });
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

    renderStore();
    setupArrows();
    route();
    refreshReleases();
})();
