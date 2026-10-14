/* eslint-disable @typescript-eslint/no-require-imports -- Uses the QA environment's Playwright, Chromium and Python image tools. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const [reference, target, output] = process.argv.slice(2);
assert.ok(reference && target && output, 'Usage: node tests/check-event-pages.cjs REFERENCE TARGET /tmp/captures (synchronize server clocks first)');
const root = path.resolve(output);
const repository = path.resolve(__dirname, '..');
assert.ok(root !== repository && !root.startsWith(repository + path.sep), 'Keep generated captures outside the repository.');
fs.mkdirSync(root, { recursive: true });
const sizes = [[390, 844], [768, 1024], [1024, 768], [1280, 900], [1440, 1000]];
const cases = [
  ['training', '/events/environmental-data-training', 200, '[data-event-detail-page]', '[data-event-itinerary]'],
  ['single-past', '/events/community-sky-observation-day', 200, '[data-event-detail-page]', '[aria-label="Event information"]'],
  ['workshop-future', '/events/earth-observation-data-workshop', 200, '[data-event-detail-page]', '[aria-label="Event information"]'],
  ['missing-event', '/events/missing-event', 404, 'main [class~="max-w-[90rem]"]'],
  ['missing-public', '/nonexistent-public-url', 404, 'main [class~="max-w-[90rem]"]'],
];
const report = { layouts: 0, interactions: 0, noJS: 0, captures: [], sourceNoJSMenuDefect: true };
const options = (width, height, motion = 'no-preference') => ({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'en-GB', timezoneId: 'Africa/Lagos', colorScheme: 'light', reducedMotion: motion });
async function settled(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('[data-scroll-navigation]')].every(e => e.dataset.navigationMode === (scrollY <= 24 ? 'expanded' : 'compact')) && document.getAnimations().filter(a => a.effect?.target?.closest('[data-scroll-navigation]')).length === 0);
}
async function ready(page, base, route, status) {
  assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), status);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('main img')].map(i => i.decode())); });
  await settled(page);
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.locator('[data-site-footer]').count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
async function snapshot(page, selector) {
  return page.locator(selector).evaluateAll(roots => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const color = value => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].join(','); };
    const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height }; };
    const properties = ['display', 'position', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'color', 'backgroundColor', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'borderTopWidth', 'borderBottomWidth', 'borderTopColor', 'gap', 'gridTemplateColumns', 'flexDirection', 'opacity', 'transform', 'translate', 'outlineWidth', 'outlineOffset', 'transitionDuration'];
    const attributes = ['href', 'target', 'rel', 'aria-label', 'aria-hidden', 'aria-current', 'src', 'alt', 'datetime'];
    return { title: document.title, main: box(document.querySelector('main')), footer: box(document.querySelector('[data-site-footer]')), height: document.documentElement.scrollHeight,
      elements: roots.flatMap(e => [e, ...e.querySelectorAll('*')]).map(e => ({ tag: e.tagName, box: box(e), text: e.childElementCount ? null : e.textContent.trim().replace(/\s+/g, ' '), attributes: Object.fromEntries(attributes.map(a => [a, e.getAttribute(a)])), styles: Object.fromEntries(properties.map(p => [p, p.toLowerCase().includes('color') ? color(getComputedStyle(e)[p]) : getComputedStyle(e)[p]])) })) };
  });
}
function compare(a, b, label) {
  // Avoid dumping an entire DOM tree when an assertion fails.
  assert.ok(JSON.stringify(a) === JSON.stringify(b), label);
}
async function capture(page, kind, name, width, selector) {
  const filename = `${kind}-${name}-${width}.png`;
  if (!selector) await page.screenshot({ path: path.join(root, filename), fullPage: true });
  else {
    await page.locator(selector).scrollIntoViewIfNeeded(); await settled(page);
    const clip = await page.locator(selector).evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, scale: 1 }; });
    const session = await page.context().newCDPSession(page);
    const shot = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip });
    fs.writeFileSync(path.join(root, filename), Buffer.from(shot.data, 'base64')); await session.detach();
  }
  report.captures.push(filename);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  report.browser = browser.version();
  try {
    for (const [name, route, status, selector, crop] of cases) for (const [width, height] of sizes) {
      const states = {};
      for (const [kind, base] of Object.entries({ reference, target })) {
        const ctx = await browser.newContext(options(width, height)), page = await ctx.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await ready(page, base, route, status); await page.mouse.move(1, 1);
        states[kind] = await snapshot(page, selector);
        await capture(page, kind, `${name}-full`, width);
        if (crop) await capture(page, kind, `${name}-crop`, width, crop);
        assert.deepEqual(errors, []); await ctx.close();
      }
      compare(states.reference, states.target, `${name}/${width}`); report.layouts++;
    }
    for (const motion of ['no-preference', 'reduce']) for (const [width, height] of [sizes[0], sizes[4]]) {
      const states = {};
      for (const [kind, base] of Object.entries({ reference, target })) {
        const ctx = await browser.newContext(options(width, height, motion)), page = await ctx.newPage();
        await ready(page, base, '/events/earth-observation-data-workshop', 200);
        const register = page.locator('main a').filter({ hasText: 'REGISTER' });
        await register.scrollIntoViewIfNeeded(); await register.focus(); await page.keyboard.press('Tab'); await settled(page);
        assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Development workshop requirements');
        states[kind] = { focus: await snapshot(page, '[aria-labelledby="event-resources-heading"]') };
        await capture(page, kind, `resource-focus-${motion}`, width, '[aria-labelledby="event-resources-heading"]');
        await register.hover(); await page.waitForTimeout(350);
        states[kind].hover = await snapshot(page, 'main a[href="https://example.org/events/earth-observation-data-workshop"]');
        await page.evaluate(() => scrollTo(0, 0)); await settled(page);
        if (width < 1024) {
          const button = page.locator('[data-mobile-menu-button]'); await button.focus(); await page.keyboard.press('Enter');
          await page.locator('[data-mobile-drawer]').waitFor({ state: 'visible' }); await page.keyboard.press('Escape');
          assert.equal(await button.getAttribute('aria-expanded'), 'false');
          assert.equal(await page.evaluate(() => document.activeElement.matches('[data-mobile-menu-button]')), true);
        } else {
          await page.locator('[data-desktop-navigation] a').filter({ hasText: 'Data & Products' }).focus();
          await page.locator('[data-desktop-navigation] a[href="/products"]').waitFor({ state: 'visible' });
        }
        await ctx.close();
      }
      compare(states.reference, states.target, `${motion}/${width}`); report.interactions++;
    }
    for (const route of ['/events/environmental-data-training', '/events/missing-event', '/nonexistent-public-url']) for (const [width, height] of [sizes[0], sizes[4]]) {
      const states = {};
      for (const [kind, base] of Object.entries({ reference, target })) {
        const ctx = await browser.newContext({ ...options(width, height), javaScriptEnabled: false }), page = await ctx.newPage();
        const status = (await page.goto(base + route, { waitUntil: 'networkidle' })).status();
        assert.equal(status, route.includes('training') ? 200 : 404);
        assert.equal(new URL(page.url()).pathname, route); assert.equal(await page.locator('main').count(), 1);
        states[kind] = { status, title: await page.title(), text: await page.locator('main').innerText() };
        if (width < 1024) assert.equal(await page.locator('[data-mobile-drawer]').isVisible(), false);
        await ctx.close();
      }
      compare(states.reference, states.target, `JS off ${route}/${width}`); report.noJS++;
    }
    const pixels = spawnSync('python3', ['-c', `
import sys,json
from pathlib import Path
from PIL import Image
import numpy as np
root=Path(sys.argv[1]);rows=[]
for name in json.loads(sys.argv[2]):
 if not name.startswith('reference-'):continue
 a=np.asarray(Image.open(root/name).convert('RGB'));b=np.asarray(Image.open(root/name.replace('reference-','target-',1)).convert('RGB'))
 rows.append({'case':name,'sameSize':a.shape==b.shape,'changedPixels':int(np.any(a!=b,axis=2).sum()) if a.shape==b.shape else None})
print(json.dumps(rows))
`, root, JSON.stringify(report.captures)], { encoding: 'utf8' });
    assert.equal(pixels.status, 0, pixels.stderr); report.pixels = JSON.parse(pixels.stdout);
    assert.deepEqual(report.pixels.filter(r => r.changedPixels !== 0), []);
    console.log(JSON.stringify({ layouts: report.layouts, interactions: report.interactions, noJS: report.noJS, pixelPairs: report.pixels.length, changedPixels: 0, browser: report.browser }));
  } finally { await browser.close(); fs.writeFileSync(path.join(root, 'summary.json'), JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
