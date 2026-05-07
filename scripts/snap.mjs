// Headless screenshot for visual validation.
// Usage:  node scripts/snap.mjs [url] [outPath] [width] [height]
// Default: http://localhost:5173/  ->  /tmp/noooro-snap.png  at 1280x800
//
// The dashboard is designed for 1280x800 with 100dvh; capturing at the design
// viewport prevents `dvh` from inflating the layout to a 1600px tall canvas.

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || '/tmp/noooro-snap.png';
const width = Number(process.argv[4] || 1280);
const height = Number(process.argv[5] || 800);
const fullPage = process.argv[6] === 'full';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage });
await browser.close();
console.log(out);
