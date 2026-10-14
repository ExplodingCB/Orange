#!/usr/bin/env node
// Renders the ChApp Store link-preview card from share-src/app-card.html and
// points apps/index.html at it. The file name is a hash of the app list and
// the icons, so it changes exactly when the card would, and iMessage, Slack,
// and X fetch the new image instead of serving their cached copy.
//
//   node share-src/render-store-card.mjs           render if out of date
//   node share-src/render-store-card.mjs --check   exit 1 if out of date
//
// Needs Google Chrome (or set CHROME=/path/to/chrome) and macOS's sips.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => join(root, ...p);
const page = at('apps', 'index.html');
const SITE = 'https://explodingcb.com';
const SHARE = '/assets/apps/share/';

// Load the APPS list the same way the card does.
const context = { window: {}, document: { currentScript: { hasAttribute: () => true } } };
vm.runInNewContext(readFileSync(at('apps', 'apps.js'), 'utf8'), context);
const apps = context.window.CHAPP_APPS;
if (!Array.isArray(apps) || !apps.length) throw new Error('apps/apps.js did not expose CHAPP_APPS');

const icons = apps.map(a => a.iconFile || `${a.id}-icon.png`);
const hash = createHash('sha256');
hash.update(readFileSync(at('share-src', 'app-card.html')));
for (const file of icons) hash.update(file).update(readFileSync(at('assets', 'apps', file)));
const name = `chapp-store-${hash.digest('hex').slice(0, 10)}.jpg`;
const out = at('assets', 'apps', 'share', name);
const url = `${SITE}${SHARE}${name}`;

const names = apps.map(a => a.name);
const list = names.length > 1 ? `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}` : names[0];
const alt = `ChApp Store: free apps for Mac, Windows, and the web, with the icons for ${list}.`;

const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
let html = readFileSync(page, 'utf8');
const upToDate = existsSync(out) && html.includes(`"${url}"`) && html.includes(`content="${escapeAttr(alt)}"`);
if (upToDate) {
    console.log(`Store card is up to date (${name}).`);
    process.exit(0);
}
if (process.argv.includes('--check')) {
    console.error(`Store card is out of date. Run: node share-src/render-store-card.mjs`);
    process.exit(1);
}

if (!existsSync(out)) {
    const chrome = process.env.CHROME || [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ].find(existsSync);
    if (!chrome) throw new Error('No Chrome found. Set CHROME=/path/to/chrome.');

    const tmp = mkdtempSync(join(tmpdir(), 'chapp-card-'));
    try {
        const png = join(tmp, 'card.png');
        execFileSync(chrome, [
            '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run',
            '--allow-file-access-from-files', `--user-data-dir=${join(tmp, 'profile')}`,
            '--window-size=1200,630', '--force-device-scale-factor=2', '--virtual-time-budget=3000',
            `--screenshot=${png}`, pathToFileURL(at('share-src', 'app-card.html')).href
        ], { stdio: 'ignore' });
        // Rendered at 2x for crisp edges, saved at the 1200 x 630 preview size.
        execFileSync('sips', ['-z', '630', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '86', png, '--out', out], { stdio: 'ignore' });
    } finally {
        rmSync(tmp, { recursive: true, force: true });
    }
}

html = html
    .replace(/(<meta (?:property="og:image"|property="og:image:secure_url"|name="twitter:image") content=")[^"]*(")/g, `$1${url}$2`)
    .replace(/(<meta (?:property="og:image:alt"|name="twitter:image:alt") content=")[^"]*(")/g, `$1${escapeAttr(alt)}$2`);
writeFileSync(page, html);
console.log(`Rendered ${SHARE}${name} with ${apps.length} apps and updated apps/index.html.`);
