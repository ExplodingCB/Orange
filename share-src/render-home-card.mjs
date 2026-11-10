#!/usr/bin/env node
// Renders the homepage link-preview image: a 1200 x 630 capture of the homepage itself, with
// the nav and the icon links hidden. Needs Playwright with Chromium (npm i -g playwright).
//
//   node share-src/render-home-card.mjs                 writes assets/chase-share-v3.jpg
//   node share-src/render-home-card.mjs chase-share-v4  another name, for the next version
//
// When the card changes, give it a new versioned name and point og:image and twitter:image in
// index.html at it, so preview services fetch it fresh. See assets/share-card.md.
// THREE_DIR=/path/to/three/build serves three.js from disk when the CDN can't be reached.

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2] || 'chase-share-v3';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    try {
        const body = await readFile(join(root, path));
        res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
}).listen(0);

const proxy = process.env.HTTPS_PROXY;
const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: !!proxy });
if (process.env.THREE_DIR) {
    await page.route('https://cdn.jsdelivr.net/npm/three@*/build/**', (r) => r.fulfill({ body: readFileSync(join(process.env.THREE_DIR, r.request().url().split('/').pop())), contentType: 'text/javascript' }));
}
await page.goto(`http://localhost:${server.address().port}/`);
await page.addStyleTag({ content: '.nav, .links { visibility: hidden; }' });
await page.waitForFunction(() => document.querySelector('#sunflower canvas') && !document.querySelector('.sunflower-placeholder'), null, { timeout: 60000 });
await page.waitForTimeout(3000);   // fonts in, and the wind well under way
await page.screenshot({ path: join(root, 'assets', `${name}.jpg`), type: 'jpeg', quality: 90 });
console.log(`assets/${name}.jpg`);
await browser.close();
server.close();
