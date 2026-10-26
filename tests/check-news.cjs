/* eslint-disable @typescript-eslint/no-require-imports -- Disposable local production-browser checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const { Pool } = require('pg');

const [base, fixtureFile, output, axeFile] = process.argv.slice(2);
const database = new URL(process.env.DATABASE_URL || '');
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.pathname, '/nosee_admin01_test');
assert.equal(new URL(base).hostname, '127.0.0.1');
assert.ok(fs.realpathSync(fixtureFile).startsWith('/tmp/'));
assert.equal(fs.statSync(fixtureFile).mode & 0o077, 0);
assert.ok(path.resolve(output).startsWith('/tmp/'));
const fixtures = JSON.parse(fs.readFileSync(fixtureFile));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const axe = fs.readFileSync(axeFile, 'utf8');
const report = { scans: [], icons: 0, workflows: [], errors: [], baselineFindings: [] };
fs.mkdirSync(output, { recursive: true });

async function scan(page, label) {
  await page.evaluate(axe);
  const violations = await page.evaluate(async () => (
    await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
  ).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target),
    heroOnly: v.id === 'target-size' && v.nodes.every(n => n.target.length === 1 && document.querySelector(n.target[0])?.matches('[data-hero-indicator]')) })));
  const known = violations.filter(v => v.heroOnly && new URL(page.url()).pathname === '/');
  report.baselineFindings.push(...known.map(v => ({ label, id: v.id })));
  assert.deepEqual(violations.filter(v => !known.includes(v)), [], label);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' horizontal overflow');
  const paints = await page.locator('button svg,a svg').evaluateAll(nodes => nodes.filter(n => n.getBoundingClientRect().width).map(svg => {
    const anchor = svg.closest('button,a'), text = getComputedStyle(anchor).color;
    return { text, own: getComputedStyle(svg).color, paints: [...svg.querySelectorAll('path')].flatMap(p => ['fill', 'stroke'].map(k => getComputedStyle(p)[k]).filter(c => c !== 'none')) };
  }));
  for (const icon of paints) {
    assert.equal(icon.own, icon.text);
    assert.ok(icon.paints.every(color => color === icon.text), label + ' icon/text mismatch');
  }
  report.icons += paints.length;
  report.scans.push({ label, width: page.viewportSize().width });
}
async function login(page, person = fixtures.editor) {
  await pool.query('truncate admin_login_attempt,admin_rate_limit');
  await page.goto(base + '/admin/sign-in');
  await page.getByLabel('Email', { exact: true }).fill(person.email);
  await page.getByLabel('Password', { exact: true }).fill(person.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(base + '/admin');
}
async function record(title) {
  const result = await pool.query('select * from news_article where title=$1', [title]);
  return result.rows[0];
}
async function saved(page, label) {
  const response = page.waitForResponse(r => r.url().includes('/api/admin/news') && ['POST','PATCH'].includes(r.request().method()));
  await page.getByRole('button', { name: label, exact: true }).click();
  assert.equal((await response).status(), 200);
  await page.waitForURL(url => /^\/admin\/publishing\/news\/[0-9a-f-]{36}$/.test(url.pathname) && url.searchParams.get('saved') === '1');
  await page.waitForLoadState('networkidle');
}
async function editFields(page, title) {
  await page.locator('#news-title').fill(title);
  await page.locator('#news-category').selectOption('research-news');
  await page.locator('#news-excerpt').fill('Synthetic summary for the private review.');
  await page.locator('#news-date').fill('2026-01-01');
  await page.locator('#news-time').fill('12:30:00');
  await page.locator('#news-time-zone').selectOption('Africa/Lagos');
  await page.getByRole('textbox', { name: 'Article body' }).fill('Synthetic article body, not approved organisation content.');
}
async function shot(page, name) {
  await page.evaluate(async () => {
    scrollTo(0, 0);
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const width of [390, 768, 1440]) {
      await pool.query('truncate news_article,admin_rate_limit');
      const context = await browser.newContext({ viewport: { width, height: 940 }, reducedMotion: 'reduce', timezoneId: width === 768 ? 'America/New_York' : 'UTC' });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      await login(page, width === 390 ? fixtures.super_admin : fixtures.editor);
      await page.goto(base + '/admin/publishing/news/new');
      await page.locator('#news-body[contenteditable=true]').waitFor();
      assert.equal(await page.locator('#news-time-zone').inputValue(), 'Africa/Lagos');
      assert.match(await page.getByLabel('Time zone').innerText(), /WAT \(UTC\+01:00\)/);
      await scan(page, 'new-WAT-editor');
      // Unsaved new articles must not create records when discarded.
      const abandoned = 'Abandoned ' + width + ' ' + randomUUID();
      await page.locator('#news-title').fill(abandoned);
      await page.getByRole('link', { name: 'All news', exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Save your changes?' });
      await dialog.waitFor();
      assert.ok(await dialog.getByRole('button', { name: 'Keep editing' }).evaluate(node => node === document.activeElement));
      await dialog.getByRole('button', { name: 'Keep editing' }).click();
      assert.equal(await page.locator('#news-title').inputValue(), abandoned);
      await page.getByRole('link', { name: 'All news', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Save your changes?' });
      await dialog.getByRole('button', { name: 'Discard changes' }).click();
      await page.waitForURL(base + '/admin/publishing/news');
      assert.equal(await record(abandoned), undefined);

      // Exit-dialog Save as draft commits first and then completes navigation.
      await page.goto(base + '/admin/publishing/news/new');
      const title = 'Browser A07.1 ' + width + ' ' + randomUUID();
      await editFields(page, title);
      await page.getByRole('link', { name: 'All news', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Save your changes?' });
      await dialog.getByRole('button', { name: 'Save as draft' }).click();
      await page.waitForURL(base + '/admin/publishing/news');
      let row = await record(title);
      assert.equal(row.status, 'draft');
      assert.equal(row.publication_timezone, 'Africa/Lagos');
      assert.equal(row.publication_date.toISOString(), '2026-01-01T11:30:00.000Z');
      await page.goto(base + '/admin/publishing/news/' + row.id);
      await scan(page, 'saved-draft');
      await saved(page, 'Publish');
      row = await record(title);
      assert.equal(row.status, 'published');
      const publicPage = await context.newPage();
      await publicPage.goto(base + '/news/' + row.slug);
      await publicPage.getByRole('heading', { name: title, exact: true }).waitFor();
      await scan(publicPage, 'published-public-article');
      await publicPage.goto(base + '/news');
      assert.ok((await publicPage.content()).includes('/news/' + row.slug));
      await scan(publicPage, 'published-news-listing');

      // A saved working-copy revision leaves its public snapshot unchanged.
      await page.locator('#news-title').fill('Working revision ' + width);
      await saved(page, 'Save as draft');
      assert.ok((await page.getByText('Unpublished changes', { exact: true }).count()) > 0);
      await publicPage.goto(base + '/news/' + row.slug);
      assert.ok((await publicPage.content()).includes(title));
      assert.ok(!(await publicPage.content()).includes('Working revision ' + width));
      await saved(page, 'Publish changes');
      await publicPage.reload();
      assert.ok((await publicPage.content()).includes('Working revision ' + width));

      // Unpublishing hides the article, without making it a never-published Draft.
      await page.getByRole('button', { name: 'Unpublish', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Unpublish?' });
      await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForLoadState('networkidle');
      row = (await pool.query('select * from news_article where id=$1', [row.id])).rows[0];
      assert.equal(row.status, 'unpublished');
      assert.equal((await publicPage.goto(base + '/news/' + row.slug)).status(), 404);

      // Typed deletion revokes eligibility but retains an audit marker and reserved slug.
      await page.getByRole('button', { name: 'Delete article', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Delete article?' });
      const currentTitle = 'Working revision ' + width;
      const phrase = 'Delete ' + currentTitle;
      await dialog.getByLabel(/To confirm, type/).fill(phrase);
      await dialog.getByRole('button', { name: 'Delete article', exact: true }).click();
      await page.waitForURL(base + '/admin/publishing/news');
      const deleted = (await pool.query('select status,deleted_at,slug from news_article where id=$1', [row.id])).rows[0];
      assert.equal(deleted.status, 'deleted');
      assert.ok(deleted.deleted_at);
      assert.equal(deleted.slug, row.slug);
      report.workflows.push({ width, draftExitSave: true, publishedPublicSnapshot: true, retainedWorkingRevision: true, unpublish: true, typedDelete: true, watDate: true });
      if (width === 390) await shot(publicPage, 'public-news-mobile');
      await context.close();
    }
    // A real scoped Lead cannot gain News access by opening a direct URL.
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await login(page, fixtures.research_group_lead);
    assert.equal((await page.goto(base + '/admin/publishing/news')).status(), 403);
    assert.equal((await page.request.get(base + '/api/admin/news')).status(), 403);
    await context.close();
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ scans: report.scans.length, icons: report.icons, workflows: report.workflows, errors: report.errors, baselineFindings: report.baselineFindings }));
  } finally { await browser.close(); await pool.end(); }
})().catch(error => { console.error(String(error.stack || error).slice(0, 1900)); process.exitCode = 1; });
