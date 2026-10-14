/* eslint-disable @typescript-eslint/no-require-imports -- Production browser verification. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const [base, output = '/tmp/nosee-hardening.json', axeFile] = process.argv.slice(2);
assert.ok(base && axeFile, 'Usage: node tests/check-public-hardening.cjs TARGET /tmp/results.json /path/to/axe.min.js');
assert.ok(!path.resolve(output).startsWith(path.resolve(__dirname, '..') + path.sep));
const report = { scans: [], navigation: [], anchors: [], focus: [], images: [], errors: [] };
const routes = ['/', '/about', '/events', '/events?q=Lagos', '/events/archive', '/events/environmental-data-training', '/nonexistent-public-url'];
async function settle(page, js = true) {
  await page.evaluate(() => document.fonts.ready);
  if (js) await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (js) await page.waitForFunction(() => [...document.querySelectorAll('[data-scroll-navigation]')].every(e => e.dataset.navigationMode === (scrollY <= 24 ? 'expanded' : 'compact')), null, { timeout: 15000 });
  await page.waitForFunction(() => document.getAnimations().filter(a => a.playState === 'running').length === 0);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const width of [390, 1440]) for (const route of routes) {
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' }), page = await ctx.newPage();
      page.on('pageerror', e => report.errors.push(e.message));
      assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), route.includes('nonexistent') ? 404 : 200);
      await settle(page); assert.equal(await page.locator('[data-native-navigation]').count(), 0, 'No fallback DOM with JS');
      await page.addScriptTag({ content: fs.readFileSync(axeFile, 'utf8') });
      const scan = await page.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
        return r.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }));
      });
      assert.ok(!scan.some(v => ['color-contrast', 'label-content-name-mismatch'].includes(v.id)), JSON.stringify(scan));
      report.scans.push({ route, width, violations: scan }); fs.writeFileSync(output, JSON.stringify(report, null, 2));
      if (route === '/events' && width === 1440) {
        const input = page.locator('#event-search'); await input.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
        const focus = await input.evaluate(e => ({ style: getComputedStyle(e).outlineStyle, width: getComputedStyle(e).outlineWidth, offset: getComputedStyle(e).outlineOffset, visible: e.matches(':focus-visible') }));
        assert.deepEqual(focus, { style: 'solid', width: '2px', offset: '-2px', visible: true }); report.focus.push(focus);
        await input.fill('Lagos'); await page.keyboard.press('Enter'); await page.waitForURL('**/events?q=Lagos');
      }
      if (route === '/' && width === 390) {
        const images = await page.locator('[data-hero-image-slide] img').evaluateAll(es => es.map(i => ({ currentSrc: i.currentSrc, complete: i.complete && i.naturalWidth > 0, priority: i.fetchPriority, loading: i.loading })));
        assert.ok(images.every(i => i.complete && /optimized/.test(i.currentSrc))); assert.equal(images[0].priority, 'high'); assert.equal(images[1].priority, 'low'); report.images.push(images);
      }
      await ctx.close();
    }
    for (const js of [true, false]) for (const width of [320, 390, 768, 1024, 1440]) {
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, javaScriptEnabled: js, reducedMotion: 'reduce' }), page = await ctx.newPage();
      page.on('pageerror', e => report.errors.push(e.message)); await page.goto(base + '/about', { waitUntil: 'networkidle' }); await settle(page, js);
      if (width < 1024) {
        if (js) {
          const button = page.locator('[data-mobile-menu-button]'); await button.focus(); await page.keyboard.press('Enter');
          await page.locator('[data-mobile-drawer]').waitFor({ state: 'visible' }); assert.ok(await page.locator('[data-mobile-menu-close-icon]').isVisible());
          assert.equal(await page.locator('[data-mobile-menu-open-icon]').isVisible(), false);
          const first = page.locator('[data-mobile-drawer] a').first(); await first.focus(); await page.keyboard.press('Shift+Tab');
          assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '/multimedia');
          await page.keyboard.press('Escape'); assert.equal(await button.getAttribute('aria-expanded'), 'false'); assert.ok(await button.evaluate(e => e === document.activeElement));
          assert.equal(await page.locator('[data-mobile-menu-close-icon]').isVisible(), false);
        } else {
          assert.equal(await page.locator('[data-mobile-menu-button]').isVisible(), false);
          const summary = page.locator('[data-native-navigation] summary'); await summary.focus(); await page.keyboard.press('Enter');
          const details = page.locator('[data-native-navigation]'); assert.equal(await details.getAttribute('open'), '');
          const links = await details.locator('a').evaluateAll(es => es.map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })));
          assert.equal(links.length, 18); assert.ok(links.some(a => a.href === '/about#mission')); assert.ok(links.some(a => a.href === '/products'));
          assert.ok(await details.locator('svg[data-ui-icon="close"]').isVisible()); await summary.focus(); await page.keyboard.press('Space'); assert.equal(await details.getAttribute('open'), null);
          await summary.press('Enter'); await details.locator('a[href="/about#mission"]').click(); await settle(page, js);
          assert.ok(await page.locator('#mission h2').evaluate(e => e.getBoundingClientRect().top >= 0));
        }
      }
      report.navigation.push({ js, width, passed: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2));
      for (const hash of ['mission', 'leadership', 'collaborations']) {
        await page.goto(base + '/about#' + hash, { waitUntil: 'networkidle' }); await settle(page, js);
        const result = await page.evaluate(id => {
          const section = document.getElementById(id), heading = section.querySelector('h2');
          const h = heading.getBoundingClientRect(), nav = document.querySelector(innerWidth < 1024 ? '[data-mobile-navigation]' : '[data-desktop-navigation]');
          return { top: h.top, clearance: getComputedStyle(nav).position === 'fixed' ? h.top - nav.getBoundingClientRect().bottom : h.top };
        }, hash);
        assert.ok(result.clearance >= 0, JSON.stringify({ js, width, hash, ...result })); report.anchors.push({ js, width, hash, ...result }); fs.writeFileSync(output, JSON.stringify(report, null, 2));
      }
      await ctx.close();
    }
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify({ axeScans: report.scans.length, navigationCases: report.navigation.length, anchorCases: report.anchors.length, focusChecks: report.focus.length, errors: report.errors.length }));
  } finally { await browser.close(); fs.writeFileSync(output, JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
