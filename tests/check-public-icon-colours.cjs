/* eslint-disable @typescript-eslint/no-require-imports -- Browser QA uses the environment's Playwright installation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const [base, output = '/tmp/nosee-icon-colours.json'] = process.argv.slice(2);
assert.ok(base, 'Usage: node tests/check-public-icon-colours.cjs TARGET /tmp/results.json');
assert.ok(!path.resolve(output).startsWith(path.resolve(__dirname, '..') + path.sep), 'Keep QA output outside the repository.');
const report = { checks: [], fixtures: [], failures: [] };
async function colours(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const rgb = value => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].join(','); };
    return [...document.querySelectorAll('svg[data-ui-icon]')].map(icon => {
      let neighbour = icon.closest('a,button') ?? icon.parentElement;
      if (icon.dataset.uiIcon === 'location') neighbour = icon.parentElement.querySelector('span');
      if (['calendar', 'clock'].includes(icon.dataset.uiIcon)) neighbour = icon.parentElement.querySelector('time');
      const colour = rgb(getComputedStyle(icon).color), expected = rgb(getComputedStyle(neighbour).color);
      const paints = [...icon.querySelectorAll('path,circle,rect,line,polygon,polyline,ellipse')].flatMap(e => ['fill', 'stroke'].filter(k => getComputedStyle(e)[k] !== 'none').map(k => ({ property: k, colour: rgb(getComputedStyle(e)[k]), opacity: getComputedStyle(e).opacity })));
      return { icon: icon.dataset.uiIcon, colour, expected, paints, filter: getComputedStyle(icon).filter, opacity: getComputedStyle(icon).opacity, hidden: !icon.getBoundingClientRect().width, decorative: icon.getAttribute('aria-hidden') === 'true' && icon.getAttribute('focusable') === 'false', matches: colour === expected && paints.every(p => p.colour === expected && p.opacity === '1') };
    });
  });
}
async function record(page, route, width, state) {
  const rows = await colours(page);
  report.checks.push({ route, width, state, rows });
  report.failures.push(...rows.filter(r => !r.matches || !r.decorative || r.filter !== 'none' || r.opacity !== '1').map(r => ({ route, width, state, ...r })));
}
async function states(page, control, route, width) {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate(e => { if (!e.closest('[data-scroll-navigation]')) scrollTo(0, e.getBoundingClientRect().top + scrollY - 180); });
  await page.mouse.move(1, 1); await page.waitForTimeout(350);
  await record(page, route, width, 'rest');
  await control.hover(); await page.waitForTimeout(350); await record(page, route, width, 'hover');
  await control.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(350);
  await record(page, route, width, 'keyboard-focus');
  await control.hover(); await page.mouse.down(); await page.waitForTimeout(350); await record(page, route, width, 'active');
  await page.mouse.move(1, 1); await page.mouse.up();
}
const fixtureSource = `
import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server';
import './tests/helpers/render-site.mjs';
const {ButtonLink}=await import('./src/components/site/ui/ButtonLink.tsx');
const {ArrowRight}=await import('./src/components/site/ui/ArrowRight.tsx');
const html=[];
for(const intent of ['primary','secondary','destructive'])for(const variant of ['fill','stroke','text'])for(const disabled of [false,true]) {
 const id=intent+'-'+variant+'-'+disabled;
 html.push(renderToStaticMarkup(createElement(ButtonLink,{href:'/events',intent,variant,disabled,'data-icon-fixture':id},'Continue',createElement(ArrowRight))));
}
console.log(html.join(''));
`;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const width of [390, 1440]) for (const route of ['/', '/about', '/events', '/events/archive', '/events/earth-observation-data-workshop', '/nonexistent-public-url']) {
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' }), page = await ctx.newPage();
      assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), route.includes('nonexistent') ? 404 : 200);
      await page.evaluate(() => document.fonts.ready); await record(page, route, width, 'initial');
      if (width < 1024) {
        const menu = page.locator('[data-mobile-menu-button]'); await states(page, menu, route, width);
        await menu.click(); await page.locator('[data-mobile-drawer]').waitFor({ state: 'visible' }); await record(page, route, width, 'open/selected');
        const submenu = page.locator('[data-mobile-submenu-button]').first(); await states(page, submenu, route, width);
        await submenu.click(); await record(page, route, width, 'submenu-expanded'); await page.keyboard.press('Escape');
      } else await states(page, page.locator('[data-desktop-navigation] a[aria-label="Login"]'), route, width);
      for (const control of await page.locator('main a:has(svg[data-ui-icon]),main button:has(svg[data-ui-icon]),[data-site-footer] a:has(svg[data-ui-icon])').all()) {
        if (await control.isVisible() && await control.evaluate(e => !e.closest('[inert],[aria-hidden="true"]'))) await states(page, control, route, width);
      }
      await ctx.close();
    }
    const rendered = spawnSync(process.execPath, ['--input-type=module', '-e', fixtureSource], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.equal(rendered.status, 0, rendered.stderr);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await ctx.newPage();
    await page.goto(base + '/events', { waitUntil: 'networkidle' });
    await page.evaluate(html => { const fixture = document.createElement('section'); fixture.id = 'icon-fixture'; fixture.innerHTML = html; document.querySelector('main').append(fixture); }, rendered.stdout);
    for (const control of await page.locator('[data-icon-fixture]').all()) {
      const id = await control.getAttribute('data-icon-fixture'); report.fixtures.push(id);
      if (id.endsWith('true')) {
        assert.equal(await control.getAttribute('aria-disabled'), 'true'); assert.equal(await control.getAttribute('href'), null);
        assert.equal(await control.evaluate(e => getComputedStyle(e).opacity), '0.5');
        await record(page, 'actual ButtonLink fixture', 1440, id + '/disabled');
      } else await states(page, control, id, 1440);
    }
    await ctx.close();
    assert.equal(report.failures.length, 0, JSON.stringify(report.failures.slice(0, 3)));
    console.log(JSON.stringify({ stateSamples: report.checks.length, svgChecks: report.checks.reduce((n, c) => n + c.rows.length, 0), buttonFixtures: report.fixtures.length, colourMismatches: 0 }));
  } finally { await browser.close(); fs.writeFileSync(output, JSON.stringify(report, null, 2)); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
