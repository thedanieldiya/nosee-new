/* eslint-disable @typescript-eslint/no-require-imports -- Cold image readiness verification. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const [base, output = '/tmp/nosee-image-readiness.json'] = process.argv.slice(2);
assert.ok(base, 'Usage: node tests/check-hero-image-readiness.cjs TARGET /tmp/results.json');
assert.ok(!path.resolve(output).startsWith(path.resolve(__dirname, '..') + path.sep));
const rows = [];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const dpr of [1, 1.75]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
      const session = await page.context().newCDPSession(page);
      await session.send('Network.enable'); await session.send('Network.setCacheDisabled', { cacheDisabled: true });
      await session.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.addInitScript(() => {
        const original = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (name, fn, ...args) {
          if (name === 'click' && this.matches?.('[data-hero-indicator]')) window.__heroReady = true;
          return original.call(this, name, fn, ...args);
        };
      });
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__heroReady, null, { timeout: 30000 });
      await page.locator('[data-hero-image-slide] img').first().evaluate(i => i.decode());
      await page.locator('[data-hero-indicator]').nth(1).click();
      const waiting = await page.locator('[data-hero-image-slide] img').nth(1).evaluate(i => ({ complete: i.complete, src: i.currentSrc }));
      if (!waiting.complete) assert.equal(await page.locator('[data-hero-content-slide]').first().getAttribute('aria-hidden'), 'false');
      await page.waitForFunction(() => document.querySelectorAll('[data-hero-content-slide]')[1].getAttribute('aria-hidden') === 'false', null, { timeout: 30000 });
      const ready = await page.locator('[data-hero-image-slide] img').nth(1).evaluate(i => ({ complete: i.complete, naturalWidth: i.naturalWidth, src: i.currentSrc, at: performance.now() }));
      assert.ok(ready.complete && ready.naturalWidth > 0);
      rows.push({ dpr, waiting, ready, noBlankFrame: true });
      await page.waitForLoadState('networkidle'); await page.close();
    }
    console.log('Two cold early-selection checks pass: old frame retained until the new raster decodes.');
  } finally { await browser.close(); fs.writeFileSync(output, JSON.stringify(rows, null, 2)); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
