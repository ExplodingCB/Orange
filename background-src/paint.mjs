#!/usr/bin/env node
// Renders background-src/paint.html at both sizes into assets/sky-wide.webp and
// assets/sky-tall.webp. Needs Playwright with Chromium (npm i -g playwright).
// You can also open paint.html in a browser and use its Save button instead.
//
//   node background-src/paint.mjs              both sizes into assets/
//   node background-src/paint.mjs --preview    PNGs into background-src/out/ instead

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const preview = process.argv.includes('--preview');

const browser = await chromium.launch();
const page = await browser.newPage();
for (const layout of ['wide', 'tall']) {
    await page.goto(`${pathToFileURL(join(here, 'paint.html'))}?render&layout=${layout}`);
    await page.waitForFunction(() => window.painted, null, { timeout: 300000 });
    const type = preview ? 'image/png' : 'image/webp';
    const url = await page.evaluate(t => document.getElementById('out').toDataURL(t, 0.86), type);
    const out = preview ? join(here, 'out', `sky-${layout}.png`) : join(here, '..', 'assets', `sky-${layout}.webp`);
    mkdirSync(dirname(out), { recursive: true });
    const buf = Buffer.from(url.split(',')[1], 'base64');
    writeFileSync(out, buf);
    const ms = await page.evaluate(() => window.paintMs);
    console.log(`${out.replace(join(here, '..') + '/', '')}  ${Math.round(buf.length / 1024)} KB  painted in ${ms} ms`);
}
await browser.close();
