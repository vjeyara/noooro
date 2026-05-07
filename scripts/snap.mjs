// Headless screenshot for visual validation.
// Usage:  node scripts/snap.mjs [url] [outPath]
// Default: http://localhost:5173/  ->  /tmp/noooro-snap.png

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || '/tmp/noooro-snap.png';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1600 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
