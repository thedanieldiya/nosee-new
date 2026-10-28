/* eslint-disable @typescript-eslint/no-require-imports -- Guarded synthetic local browser workflows. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { Pool } = require("pg");
const sharp = require("sharp");
const [base, fixtureFile, output, axeFile] = process.argv.slice(2);
const database = new URL(process.env.DATABASE_URL || "");
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "55433");
assert.equal(database.pathname, "/nosee_admin01_test");
assert.equal(new URL(base).hostname, "127.0.0.1");
assert.ok(fs.realpathSync(fixtureFile).startsWith("/tmp/"));
assert.equal(fs.statSync(fixtureFile).mode & 0o077, 0);
assert.ok(path.resolve(output).startsWith("/tmp/"));
const fixtures = JSON.parse(fs.readFileSync(fixtureFile));
const secrets = Object.values(fixtures)
  .map((p) => p.password)
  .filter(Boolean);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const axe = fs.readFileSync(axeFile, "utf8");
const root = "/admin/website/site-content/gallery";
const report = { scans: [], checks: [], errors: [] };
fs.mkdirSync(output, { recursive: true });
async function scan(page, label) {
  await page.evaluate(axe);
  const violations = await page.evaluate(async () =>
    (
      await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  );
  assert.deepEqual(violations, [], label);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    label + " overflow",
  );
  report.scans.push(label);
  console.log("Passed " + label);
}
async function login(page, origin = base, role = "editor") {
  await pool.query("truncate admin_login_attempt,admin_rate_limit");
  await page.goto(origin + "/admin/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(fixtures[role].email);
  await page
    .getByLabel("Password", { exact: true })
    .fill(fixtures[role].password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(origin + "/admin");
}
async function dismiss(page) {
  const b = page.getByRole("button", {
    name: "Dismiss notification",
    exact: true,
  });
  while (await b.count()) await b.first().click();
  await page.mouse.move(0, 0);
}
async function save(page, mode = "draft") {
  await dismiss(page);
  const pending = page.waitForResponse(
    (r) =>
      ["POST", "PATCH"].includes(r.request().method()) &&
      /^\/api\/admin\/gallery(\/[0-9a-f-]{36})?$/.test(
        new URL(r.url()).pathname,
      ),
  );
  await page
    .getByRole("button", {
      name: mode === "draft" ? "Save as draft" : /^Publish/,
      exact: mode === "draft",
    })
    .click();
  const r = await pending;
  assert.equal(r.status(), 200, await r.text());
  const v = await r.json();
  await page.waitForURL(/\?saved=1$/);
  await page.waitForFunction(
    () =>
      document.activeElement?.tagName === "P" &&
      document.activeElement?.getAttribute("role") === "status",
  );
  await dismiss(page);
  return v.id;
}
async function record(id) {
  return (await pool.query("select * from gallery_item where id=$1", [id]))
    .rows[0];
}
async function state(page, name) {
  await dismiss(page);
  await page.getByRole("button", { name, exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "Cancel", exact: true }).waitFor();
  await d.getByRole("button", { name: "Confirm", exact: true }).click();
  await d.waitFor({ state: "hidden" });
  await page.waitForLoadState("networkidle");
  await dismiss(page);
}
(async () => {
  const png = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#23643d" },
  })
    .png()
    .toBuffer();
  const files = ["one.png", "two.png", "three.png"].map((name) => ({
    name,
    mimeType: "image/png",
    buffer: png,
  }));
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [390, 1440]) {
      await pool.query(
        "truncate media_reference,media_asset,gallery_item,admin_rate_limit",
      );
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);
      page.on("pageerror", (e) => report.errors.push(e.message));
      await login(page);
      await page.goto(base + root);
      await scan(page, "directory-empty-" + width);
      await page.getByRole("link", { name: "Add album", exact: true }).click();
      const title = "Browser album " + width;
      await page.getByLabel("Album name", { exact: true }).fill(title);
      await page
        .getByLabel("Description (optional)", { exact: true })
        .fill("Synthetic album for keyboard and upload verification.");
      await page
        .getByLabel("Album date (optional)", { exact: true })
        .fill("2026-10-28");
      await scan(page, "album-metadata-" + width);
      const id = await save(page);
      assert.equal((await record(id)).status, "draft");
      await page.locator("#gallery-image-files").setInputFiles(files);
      assert.equal(
        await page
          .getByText("Local preview — not uploaded.", { exact: true })
          .count(),
        3,
      );
      assert.equal(
        (await pool.query("select id from media_asset")).rowCount,
        0,
      );
      await scan(page, "local-previews-" + width);
      let fail = true;
      await page.route("**/api/admin/gallery/*/uploads/*", (route) => {
        if (route.request().method() === "PUT" && fail) {
          fail = false;
          return route.abort("failed");
        }
        return route.continue();
      });
      await page
        .getByRole("button", { name: "Upload selected files", exact: true })
        .click();
      await page
        .getByText("Persisted image. Save the draft to keep this attachment.", {
          exact: true,
        })
        .nth(1)
        .waitFor();
      await page.getByRole("button", { name: /^Retry / }).waitFor();
      assert.equal(
        await page.locator('input[id^="gallery-photo-caption-"]').count(),
        2,
      );
      assert.equal(
        await page.getByRole("button", { name: /^Retry / }).count(),
        1,
      );
      await scan(page, "partial-upload-retry-" + width);
      await page.getByRole("button", { name: /^Retry / }).click();
      await page
        .getByText("Persisted image. Save the draft to keep this attachment.", {
          exact: true,
        })
        .nth(2)
        .waitFor();
      assert.equal(
        await page.locator('input[id^="gallery-photo-caption-"]').count(),
        3,
      );
      await page.unrouteAll({ behavior: "wait" });
      const captions = page.locator('input[id^="gallery-photo-caption-"]');
      await captions.first().fill("Observed instrument beside the monitor");
      assert.equal(
        await page
          .locator('input[id^="gallery-photo-alt-"]')
          .first()
          .isDisabled(),
        true,
      );
      await page
        .locator('input[id^="gallery-photo-alt-"]')
        .nth(1)
        .fill("A tripod beside a test panel");
      const firstId = await captions.first().getAttribute("id");
      const down = page.getByRole("button", {
        name: "Move down: photo 1",
        exact: true,
      });
      const paint = await down.evaluate((b) => ({
        color: getComputedStyle(b).color,
        paths: [...b.querySelectorAll("path")].map((p) => ({
          fill: getComputedStyle(p).fill,
          stroke: getComputedStyle(p).stroke,
        })),
      }));
      assert.ok(
        paint.paths.length &&
          paint.paths.every(
            (p) =>
              (p.fill === "none" || p.fill === paint.color) &&
              (p.stroke === "none" || p.stroke === paint.color),
          ),
      );
      await down.focus();
      await page.keyboard.press("Enter");
      assert.equal(await captions.nth(1).getAttribute("id"), firstId);
      assert.equal(
        await page
          .getByRole("button", { name: "Move down: photo 2", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await page
        .getByLabel("Album cover", { exact: true })
        .selectOption({ index: 2 });
      await scan(page, "album-editor-" + width);
      await page.screenshot({
        path: path.join(output, "album-editor-" + width + ".png"),
        fullPage: true,
      });
      await save(page);
      let r = await record(id);
      assert.equal(r.fields.photos.length, 3);
      assert.equal(
        r.fields.photos[1].id,
        firstId.replace("gallery-photo-caption-", ""),
      );
      const stableIds = r.fields.photos.map((p) => p.id);
      await page
        .getByRole("link", { name: "Preview saved draft", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Saved working-copy preview",
          exact: true,
        })
        .waitFor();
      await scan(page, "private-preview-" + width);
      await page
        .getByRole("link", { name: "Back to editor", exact: true })
        .click();
      await save(page, "publish");
      r = await record(id);
      assert.deepEqual(
        r.published_content.photos.map((p) => p.id),
        stableIds,
      );
      const publicPage = await context.newPage();
      publicPage.on("pageerror", (e) => report.errors.push(e.message));
      await publicPage.goto(base + "/multimedia");
      await publicPage
        .getByRole("heading", { name: title, exact: true })
        .waitFor();
      await scan(publicPage, "public-directory-" + width);
      await publicPage.locator('a[href="/multimedia/' + r.slug + '"]').click();
      await publicPage.waitForURL(base + "/multimedia/" + r.slug);
      await publicPage
        .getByRole("button", { name: /^Enlarge photograph:/ })
        .first()
        .waitFor();
      await publicPage
        .getByRole("heading", { name: title, exact: true })
        .waitFor();
      assert.equal(
        await publicPage
          .getByRole("button", { name: /^Enlarge photograph:/ })
          .count(),
        3,
      );
      assert.equal(
        await publicPage.locator("figure img").nth(1).getAttribute("alt"),
        "Observed instrument beside the monitor",
      );
      assert.equal(
        await publicPage.locator("figure img").nth(2).getAttribute("alt"),
        "",
      );
      assert.equal(
        await publicPage.locator("figure img").first().getAttribute("alt"),
        "A tripod beside a test panel",
      );
      await scan(publicPage, "public-album-" + width);
      await publicPage.screenshot({
        path: path.join(output, "public-album-" + width + ".png"),
        fullPage: true,
      });
      const opener = publicPage.getByRole("button", {
        name: "Enlarge photograph: " + title + " - 1",
        exact: true,
      });
      await opener.focus();
      await publicPage.keyboard.press("Enter");
      let dialog = publicPage.getByRole("dialog");
      await dialog
        .getByRole("button", { name: "Close photograph", exact: true })
        .waitFor();
      assert.equal(
        await dialog
          .getByRole("button", { name: "Close photograph", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await publicPage.keyboard.press("ArrowRight");
      await dialog
        .getByRole("heading", { name: title + " - 2", exact: true })
        .waitFor();
      await publicPage.keyboard.press("ArrowRight");
      await dialog
        .getByText("No description was provided for this photograph.", {
          exact: true,
        })
        .waitFor();
      await scan(publicPage, "viewer-fallback-" + width);
      await publicPage.keyboard.press("ArrowLeft");
      await publicPage.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await publicPage.waitForFunction(label => document.activeElement?.getAttribute("aria-label") === label, "Enlarge photograph: " + title + " - 1");
      assert.equal(
        await opener.evaluate((n) => n === document.activeElement),
        true,
      );
      // Working rename/order/removal must not alter the live album or its images.
      await page
        .getByLabel("Album name", { exact: true })
        .fill("Revised " + title);
      await page
        .getByRole("button", { name: "Remove photo 2", exact: true })
        .click();
      dialog = page.getByRole("dialog");
      await dialog
        .getByRole("button", { name: "Cancel", exact: true })
        .waitFor();
      assert.equal(
        await dialog
          .getByRole("button", { name: "Cancel", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await scan(page, "remove-photo-dialog-" + width);
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Remove photo 2", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Remove photo", exact: true })
        .click();
      await save(page);
      r = await record(id);
      assert.equal(r.fields.photos.length, 2);
      assert.equal(r.fields.coverId, r.fields.photos[0].id);
      assert.equal(r.published_content.photos.length, 3);
      await publicPage.reload();
      await publicPage
        .getByRole("heading", { name: title, exact: true })
        .waitFor();
      await page
        .getByRole("link", { name: "All Gallery items", exact: true })
        .click();
      await page.getByText("Unpublished changes", { exact: true }).waitFor();
      await scan(page, "directory-revision-" + width);
      await page
        .getByRole("link", { name: "Revised " + title, exact: true })
        .click();
      await save(page, "publish");
      await publicPage.reload();
      await publicPage
        .getByRole("heading", { name: "Revised " + title, exact: true })
        .waitFor();
      assert.equal(
        await publicPage
          .getByRole("button", { name: /^Enlarge photograph:/ })
          .count(),
        2,
      );
      await state(page, "Unpublish");
      assert.equal((await record(id)).status, "unpublished");
      const missing = await publicPage.reload();
      assert.equal(missing.status(), 404);
      await save(page, "publish");
      // All three exit actions and keyboard restoration.
      await page
        .getByLabel("Description (optional)", { exact: true })
        .fill("Unsaved local description");
      await page
        .getByRole("link", { name: "All Gallery items", exact: true })
        .click();
      dialog = page.getByRole("dialog");
      await dialog
        .getByRole("button", { name: "Keep editing", exact: true })
        .waitFor();
      assert.equal(
        await dialog
          .getByRole("button", { name: "Keep editing", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await scan(page, "exit-dialog-" + width);
      await dialog
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await page
        .getByRole("link", { name: "All Gallery items", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Save as draft", exact: true })
        .click();
      await page.waitForURL(base + root);
      await dismiss(page);
      assert.equal(
        (await record(id)).fields.description,
        "Unsaved local description",
      );
      await page
        .getByRole("link", { name: "Revised " + title, exact: true })
        .click();
      await page
        .getByLabel("Description (optional)", { exact: true })
        .fill("Discard this value");
      await page
        .getByRole("link", { name: "All Gallery items", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
      await page.waitForURL(base + root);
      assert.equal(
        (await record(id)).fields.description,
        "Unsaved local description",
      );
      // A standalone photo: one required caption, upload, publication and replacement isolation.
      await page.getByRole("link", { name: "Add photo", exact: true }).click();
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page
        .getByText("Add a caption. It is also the image alt text.", {
          exact: true,
        })
        .waitFor();
      await scan(page, "photo-validation-" + width);
      const caption = "Synthetic standalone photograph " + width;
      await page.getByLabel("Caption", { exact: true }).fill(caption);
      const photoId = await save(page);
      assert.equal(
        await page
          .getByLabel("Descriptive alt text (optional)", { exact: true })
          .count(),
        0,
      );
      // Exercise drag/drop with real File bytes, separately from the native picker above.
      const transfer = await page.evaluateHandle(
        (bytes) => {
          const data = new DataTransfer();
          data.items.add(
            new File([Uint8Array.from(bytes)], "dropped.png", {
              type: "image/png",
            }),
          );
          return data;
        },
        [...png],
      );
      await page
        .locator('label[for="gallery-image-files"]')
        .locator("..")
        .dispatchEvent("drop", { dataTransfer: transfer });
      await page
        .getByText("Local preview — not uploaded.", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Upload selected files", exact: true })
        .click();
      await page
        .getByText("Persisted image. Save the draft to keep this attachment.", {
          exact: true,
        })
        .waitFor();
      await save(page, "publish");
      const oldAsset = (await record(photoId)).published_content.assetId;
      await publicPage.goto(base + "/multimedia/photos/" + photoId);
      assert.equal(
        await publicPage.locator("figure img").getAttribute("alt"),
        caption,
      );
      await scan(publicPage, "public-standalone-" + width);
      await page.locator("#gallery-image-files").setInputFiles([files[0]]);
      await page
        .getByRole("button", { name: "Upload selected files", exact: true })
        .click();
      await page
        .getByText("Persisted image. Save the draft to keep this attachment.", {
          exact: true,
        })
        .waitFor();
      await save(page);
      assert.equal((await record(photoId)).published_content.assetId, oldAsset);
      assert.notEqual((await record(photoId)).fields.assetId, oldAsset);
      await save(page, "publish");
      assert.notEqual(
        (await record(photoId)).published_content.assetId,
        oldAsset,
      );
      // Exact typed deletion and focus-safe cancellation.
      await page
        .getByRole("button", { name: "Delete Gallery item", exact: true })
        .click();
      dialog = page.getByRole("dialog");
      await dialog.getByLabel(/To confirm, type/).fill("wrong");
      assert.equal(
        await dialog
          .getByRole("button", { name: "Delete Gallery item", exact: true })
          .isDisabled(),
        true,
      );
      await scan(page, "typed-delete-" + width);
      await dialog.getByLabel(/To confirm, type/).fill("Delete " + caption);
      await dialog
        .getByRole("button", { name: "Delete Gallery item", exact: true })
        .click();
      await page.waitForURL(base + root);
      await dismiss(page);
      assert.ok((await record(photoId)).deleted_at);
      assert.equal((await publicPage.reload()).status(), 404);
      await publicPage.close();
      // Actual production mode never enables the test adapter, even sharing test DB.
      const unavailableContext = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      const unavailable = await unavailableContext.newPage(),
        other = "http://127.0.0.1:4322";
      await login(unavailable, other);
      await unavailable.goto(other + root + "/albums/new");
      await unavailable
        .getByLabel("Album name", { exact: true })
        .fill("Unavailable uploads " + width);
      await save(unavailable);
      await unavailable
        .getByText("Uploads are not configured.", { exact: true })
        .waitFor();
      await unavailable
        .locator("#gallery-image-files")
        .setInputFiles([files[0]]);
      assert.equal(
        await unavailable
          .getByRole("button", { name: "Upload selected files", exact: true })
          .isDisabled(),
        true,
      );
      await unavailable
        .getByRole("button", { name: "Publish", exact: true })
        .click();
      await unavailable
        .getByText("Add at least one persisted photo before publishing.", {
          exact: true,
        })
        .waitFor();
      await scan(unavailable, "unconfigured-local-preview-" + width);
      await unavailableContext.close();
      report.checks.push(
        "picker/drop, partial failure/retry, stable IDs, keyboard order, atomic draft/publication, cover removal, viewer, exit actions, caption/alt, typed deletion, unavailable provider at " +
          width,
      );
      await context.close();
    }
    const context = await browser.newContext(),
      page = await context.newPage();
    await login(page, base, "research_group_lead");
    assert.equal((await page.goto(base + root)).status(), 403);
    await scan(page, "lead-forbidden");
    await context.close();
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      "Browser checks passed: " +
        report.scans.length +
        " accessibility/overflow scans; 0 runtime errors.",
    );
  } finally {
    await browser.close();
    await pool.end();
  }
})().catch((e) => {
  let message = String(e.stack || e);
  for (const secret of secrets)
    message = message.split(secret).join("[redacted]");
  console.error(message);
  process.exitCode = 1;
});
