// Visual QA: full-page screenshots of every route on desktop and mobile, plus
// console-error capture and a client-side navigation check.
// Usage: npm run build && npx astro preview & node scripts/screenshots.mjs [outDir]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = process.argv[2] || 'screenshots';
const routes = ['/', '/about/', '/messages/', '/messages/the-ministry-of-giving-iii/', '/watch/', '/books/', '/transforming-lives/', '/events/', '/give/', '/contact-and-support/', '/credits/', '/404'];
const devices = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

await mkdir(OUT, { recursive: true });
// Use a preinstalled Chromium when the bundled one isn't downloaded.
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ executablePath });
const errors = [];

for (const d of devices) {
  const context = await browser.newContext({ viewport: d.viewport, isMobile: d.isMobile, hasTouch: d.hasTouch, deviceScaleFactor: 1 });
  // Still tier for full-page layout shots (animations would otherwise leave
  // below-the-fold content mid-reveal).
  await context.addInitScript(() => localStorage.setItem('motion', 'reduced'));
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${d.name}] ${page.url()} ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${d.name}] ${page.url()} ${e.message}`));
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    // Walk down the page so lazy images load before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const slug = r === '/' ? 'home' : r.replace(/\//g, '_').replace(/^_|_$/g, '');
    await page.screenshot({ path: `${OUT}/${d.name}-${slug}.png`, fullPage: true });
  }
  await context.close();
}

// Animated tier: hero first frame + client-side navigation (view transition).
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('motion', 'full'));
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`[full] ${page.url()} ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`[full] ${page.url()} ${m.text()}`));
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/full-home-hero.png` });
await page.mouse.wheel(0, 1400);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/full-home-scrolled.png` });
await page.click('a.intro__image');
await page.waitForURL('**/about/');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/full-about-after-nav.png` });
const booted = await page.evaluate(() => window.__motionBooted === true && document.documentElement.dataset.motion);
await browser.close();

console.log('motion tier after navigation:', booted);
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'No console errors.');
