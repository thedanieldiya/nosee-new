/* eslint-disable @typescript-eslint/no-require-imports -- Guarded synthetic local browser workflows. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { randomUUID } = require("node:crypto"),
  { chromium } = require("playwright"),
  { Pool } = require("pg");
const [base, fixtureFile, output, axeFile] = process.argv.slice(2),
  database = new URL(process.env.DATABASE_URL || "");
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "55433");
assert.equal(database.pathname, "/nosee_admin01_test");
assert.equal(new URL(base).hostname, "127.0.0.1");
assert.ok(fs.realpathSync(fixtureFile).startsWith("/tmp/"));
assert.equal(fs.statSync(fixtureFile).mode & 0o077, 0);
assert.ok(path.resolve(output).startsWith("/tmp/"));
const fixtures = JSON.parse(fs.readFileSync(fixtureFile)),
  secrets = Object.values(fixtures).map((p) => p.password),
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 }),
  axe = fs.readFileSync(axeFile, "utf8"),
  root = "/admin/website/site-content/privacy",
  report = { scans: [], checks: [], errors: [] },
  receipts = [];
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
async function login(page, role = "editor") {
  await pool.query("truncate admin_login_attempt,admin_rate_limit");
  const p = fixtures[role];
  await page.goto(base + "/admin/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(p.email);
  await page.getByLabel("Password", { exact: true }).fill(p.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(base + "/admin");
}
async function dismiss(page) {
  const buttons = page.getByRole("button", {
    name: "Dismiss notification",
    exact: true,
  });
  while (await buttons.count()) await buttons.first().click();
  await page.mouse.move(0, 0);
}
async function saved(page) {
  await page.waitForURL(/\?saved=1$/);
  await page.waitForFunction(
    () =>
      document.activeElement?.tagName === "P" &&
      document.activeElement?.getAttribute("role") === "status",
  );
  await dismiss(page);
}
async function save(page, mode = "draft") {
  await dismiss(page);
  if (mode === "publish") {
    await page
      .getByRole("button", { name: "Publish changes", exact: true })
      .click();
    const d = page.getByRole("dialog");
    await d
      .getByRole("checkbox", {
        name: "I confirm this wording is approved for publication.",
        exact: true,
      })
      .check();
  }
  const pending = page.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" &&
      new URL(r.url()).pathname === "/api/admin/site-content/privacy",
  );
  await page
    .getByRole("button", {
      name: mode === "publish" ? "Publish policy" : "Save as draft",
      exact: true,
    })
    .click();
  const r = await pending;
  assert.equal(r.status(), 200, await r.text());
  await saved(page);
}
async function current(page) {
  const r = await page.request.get(base + "/api/admin/site-content/privacy");
  assert.equal(r.status(), 200);
  return r.json();
}
async function publish(page, text, title = "Privacy policy") {
  const row = await current(page),
    r = await page.request.patch(base + "/api/admin/site-content/privacy", {
      headers: { origin: base },
      data: {
        fields: { title, effectiveDate: "2026-10-28", body: text },
        mode: "publish",
        version: row.version,
        mutationId: randomUUID(),
        confirm: true,
        approvedForPublication: true,
      },
    });
  assert.equal(r.status(), 200, await r.text());
  return (await page.request.get(base + "/api/privacy")).json();
}
async function fillApplication(page, tag) {
  const v = {
    firstName: "Applicant " + tag,
    lastName: "Synthetic",
    email: randomUUID() + "@example.invalid",
    careerStage: "early_career",
    why: "Synthetic motivation retained " + tag,
  };
  await page.locator("#join-firstName").fill(v.firstName);
  await page.locator("#join-lastName").fill(v.lastName);
  await page.locator("#join-email").fill(v.email);
  await page.locator("#join-careerStage").selectOption(v.careerStage);
  await page
    .locator('input[name="researchInterests"][value="space_weather"]')
    .check();
  await page.locator("#join-why").fill(v.why);
  await page.locator("#join-consent").check();
  return v;
}
async function retained(page, v, consent = true) {
  for (const k of ["firstName", "lastName", "email", "why"])
    assert.equal(await page.locator("#join-" + k).inputValue(), v[k]);
  assert.equal(
    await page.locator("#join-careerStage").inputValue(),
    v.careerStage,
  );
  assert.equal(
    await page
      .locator('input[name="researchInterests"][value="space_weather"]')
      .isChecked(),
    true,
  );
  assert.equal(await page.locator("#join-consent").isChecked(), consent);
}
async function openPolicy(page, body) {
  await page.getByRole("link", { name: "privacy policy", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByText(body, { exact: true }).waitFor();
  assert.equal(
    await d
      .getByRole("button", { name: "Close privacy policy", exact: true })
      .evaluate((n) => n === document.activeElement),
    true,
  );
  return d;
}
async function closed(page, dialog) {
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.textContent === "privacy policy",
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of [390, 1440]) {
      await pool.query(
        "update privacy_policy set fields=(select jsonb_build_object('title',title,'body',body,'effectiveDate',effective_date) from privacy_policy_version where id='development-placeholder-v1'),published_version='development-placeholder-v1',version=1,last_mutation_key=null,last_mutation_digest=null;truncate admin_rate_limit",
      );
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        }),
        admin = await context.newPage();
      admin.setDefaultTimeout(15000);
      admin.on("pageerror", (e) => report.errors.push(e.message));
      await login(admin);
      await admin.goto(base + root);
      await admin.getByText("Published", { exact: true }).waitFor();
      assert.equal(
        await admin
          .getByRole("button", { name: "Unpublish", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await admin.getByRole("button", { name: /Delete/ }).count(),
        0,
      );
      await scan(admin, "privacy-placeholder-editor-" + width);
      await admin
        .getByRole("button", { name: "Publish changes", exact: true })
        .click();
      let dialog = admin.getByRole("dialog");
      await dialog
        .getByRole("button", { name: "Cancel", exact: true })
        .waitFor();
      assert.equal(
        await dialog
          .getByRole("button", { name: "Cancel", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      assert.equal(
        await dialog
          .getByRole("button", { name: "Publish policy", exact: true })
          .isDisabled(),
        true,
      );
      await scan(admin, "approval-dialog-" + width);
      await admin.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      const body = "Synthetic policy for browser review " + width;
      await admin
        .getByRole("textbox", { name: "Policy body", exact: true })
        .fill(body);
      await admin
        .getByLabel("Effective date (optional)", { exact: true })
        .fill("2026-10-28");
      await save(admin);
      await admin.getByText("Unpublished changes", { exact: true }).waitFor();
      await admin
        .getByRole("link", { name: "Preview saved draft", exact: true })
        .click();
      await admin
        .getByRole("heading", { name: "Saved policy preview", exact: true })
        .waitFor();
      await admin.getByText(body, { exact: true }).waitFor();
      await scan(admin, "private-policy-preview-" + width);
      await admin
        .getByRole("link", { name: "Back to editor", exact: true })
        .click();
      await admin
        .getByRole("textbox", { name: "Policy body", exact: true })
        .waitFor();
      await save(admin, "publish");
      const publicContext = await browser.newContext({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        }),
        join = await publicContext.newPage(),
        privacy = await publicContext.newPage();
      for (const p of [join, privacy]) {
        p.setDefaultTimeout(15000);
        p.on("pageerror", (e) => report.errors.push(e.message));
      }
      await privacy.goto(base + "/privacy");
      await privacy.getByText(body, { exact: true }).waitFor();
      assert.equal(
        await privacy
          .getByRole("link", { name: /back to membership/i })
          .count(),
        0,
      );
      assert.equal(
        await privacy
          .getByText(/development placeholder|awaiting approval/)
          .count(),
        0,
      );
      await scan(privacy, "published-policy-" + width);
      await privacy.screenshot({
        path: path.join(output, "privacy-" + width + ".png"),
        fullPage: true,
      });
      await join.goto(base + "/join");
      const values = await fillApplication(join, "open-" + width);
      await scan(join, "join-retained-form-" + width);
      dialog = await openPolicy(join, body);
      await scan(join, "privacy-panel-" + width);
      await join.keyboard.press("Tab");
      assert.equal(
        await dialog
          .getByRole("button", { name: "Close privacy policy", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await join.keyboard.press("Shift+Tab");
      assert.equal(
        await dialog
          .getByRole("button", { name: "Close privacy policy", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await join.keyboard.press("Escape");
      await closed(join, dialog);
      await retained(join, values);
      dialog = await openPolicy(join, body);
      await dialog
        .getByRole("button", { name: "Close privacy policy", exact: true })
        .click();
      await closed(join, dialog);
      await retained(join, values);
      dialog = await openPolicy(join, body);
      await join.mouse.click(2, 2);
      await closed(join, dialog);
      await retained(join, values);
      // The endpoint may fail; retry preserves both field values and unchanged consent.
      await join.route("**/api/privacy", (route) => route.abort("failed"));
      await join
        .getByRole("link", { name: "privacy policy", exact: true })
        .click();
      dialog = join.getByRole("dialog");
      await dialog.getByRole("alert").waitFor();
      await scan(join, "policy-unavailable-panel-" + width);
      await join.unroute("**/api/privacy");
      await dialog
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await dialog.getByText(body, { exact: true }).waitFor();
      await join.keyboard.press("Escape");
      await closed(join, dialog);
      await retained(join, values);
      // Publication after initial presentation must not silently renew affirmative consent.
      const next = "Synthetic changed policy " + width,
        newLive = await publish(admin, next);
      await join
        .getByRole("button", { name: "Submit application", exact: true })
        .click();
      await join
        .getByRole("alert")
        .filter({ hasText: "privacy policy changed" })
        .first()
        .waitFor();
      await retained(join, values, false);
      assert.equal(
        await join
          .locator('input[name="formToken"]')
          .inputValue()
          .then((v) => v.split(".")[2]),
        newLive.policy.version,
      );
      await scan(join, "changed-policy-submit-" + width);
      dialog = await openPolicy(join, next);
      await join.keyboard.press("Escape");
      await closed(join, dialog);
      await join.locator("#join-consent").check();
      await join
        .getByRole("button", { name: "Submit application", exact: true })
        .click();
      await join
        .getByRole("heading", { name: "Application received", exact: true })
        .waitFor();
      await scan(join, "confirmed-new-consent-" + width);
      const receipt = (
        await pool.query(
          "select * from membership_application where email=$1",
          [values.email],
        )
      ).rows[0];
      assert.equal(receipt.privacy_version, newLive.policy.version);
      assert.equal(receipt.consent_version, "membership-review-v1");
      assert.equal(receipt.expires_at - receipt.created_at, 720 * 3600000);
      receipts.push({
        id: receipt.id,
        version: receipt.privacy_version,
        body: next,
      });
      // Opening the panel discovers a new publication without remounting unsaved form fields.
      await join.goto(base + "/join");
      const opening = await fillApplication(join, "panel-" + width),
        onOpen = "Synthetic policy found on opening " + width;
      await publish(admin, onOpen);
      dialog = await openPolicy(join, onOpen);
      await scan(join, "policy-refreshed-on-open-" + width);
      await join.keyboard.press("Escape");
      await closed(join, dialog);
      await retained(join, opening, false);
      await join
        .getByText(
          "The privacy policy has changed. Review this version and confirm consent again.",
          { exact: true },
        )
        .waitFor();
      // While a dialog is open, it keeps the version being read; submission checks again.
      await join.locator("#join-consent").check();
      dialog = await openPolicy(join, onOpen);
      await publish(
        admin,
        "Synthetic policy published during reading " + width,
      );
      assert.equal(
        await dialog.getByText(onOpen, { exact: true }).isVisible(),
        true,
      );
      await join.keyboard.press("Escape");
      await closed(join, dialog);
      await retained(join, opening, true);
      await join
        .getByRole("button", { name: "Submit application", exact: true })
        .click();
      await join
        .getByRole("alert")
        .filter({ hasText: "privacy policy changed" })
        .first()
        .waitFor();
      await retained(join, opening, false);
      assert.equal(
        (
          await pool.query(
            "select id from membership_application where email=$1",
            [opening.email],
          )
        ).rowCount,
        0,
      );
      // Validation failure before the transaction still cannot carry old consent to a fresh policy token.
      await join.goto(base + "/join");
      const invalid = await fillApplication(join, "validation-" + width);
      await join.locator("#join-why").fill("");
      await join
        .locator('form[action="/join"]')
        .evaluate((f) => (f.noValidate = true));
      await publish(admin, "Synthetic policy during validation " + width);
      await join
        .getByRole("button", { name: "Submit application", exact: true })
        .click();
      await join
        .getByRole("alert")
        .filter({ hasText: "privacy policy changed" })
        .first()
        .waitFor();
      await retained(join, { ...invalid, why: "" }, false);
      await scan(join, "policy-validation-refresh-" + width);
      // Draft/revert status and shared dirty-navigation choices.
      await admin.goto(base + root);
      const published = await current(admin);
      await admin
        .getByLabel("Page title", { exact: true })
        .fill("Private draft title " + width);
      await save(admin);
      await admin.getByText("Unpublished changes", { exact: true }).waitFor();
      await privacy.reload();
      assert.equal(
        await privacy
          .getByRole("heading", {
            name: "Private draft title " + width,
            exact: true,
          })
          .count(),
        0,
      );
      await admin
        .getByLabel("Page title", { exact: true })
        .fill(published.fields.title);
      await save(admin);
      await admin.getByText("Published", { exact: true }).waitFor();
      await admin
        .getByLabel("Page title", { exact: true })
        .fill("Unsaved title");
      await admin
        .getByRole("navigation", { name: "Website", exact: true })
        .getByRole("link", { name: "Monitoring dashboards", exact: true })
        .click();
      dialog = admin.getByRole("dialog");
      await dialog
        .getByRole("button", { name: "Keep editing", exact: true })
        .waitFor();
      await scan(admin, "privacy-dirty-exit-" + width);
      await dialog
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await admin
        .getByRole("navigation", { name: "Website", exact: true })
        .getByRole("link", { name: "Monitoring dashboards", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
      await admin.waitForURL(base + "/admin/website/monitoring-dashboards");
      assert.equal(await admin.locator("main").getByRole("button").count(), 0);
      assert.equal(await admin.locator("main input,main form").count(), 0);
      await scan(admin, "reserved-monitoring-" + width);
      await admin
        .getByRole("navigation", { name: "Website", exact: true })
        .getByRole("link", { name: "Site content", exact: true })
        .click();
      await admin
        .getByRole("navigation", { name: "Site content", exact: true })
        .getByRole("link", { name: "Privacy policy", exact: true })
        .click();
      await admin
        .getByLabel("Page title", { exact: true })
        .fill("Saved exit draft " + width);
      await admin
        .getByRole("navigation", { name: "Website", exact: true })
        .getByRole("link", { name: "Monitoring dashboards", exact: true })
        .click();
      await admin
        .getByRole("dialog")
        .getByRole("button", { name: "Save as draft", exact: true })
        .click();
      await admin.waitForURL(base + "/admin/website/monitoring-dashboards");
      assert.equal(
        (await current(admin)).fields.title,
        "Saved exit draft " + width,
      );
      // Shared editor regression: Hero and profile drafts/previews remain operational.
      if (width === 1440) {
        await admin.goto(base + "/admin/website/site-content/homepage");
        await admin
          .locator('input[id^="hero-"][id$="-title"]')
          .first()
          .fill("Synthetic hero draft only");
        let pending = admin.waitForResponse(
          (r) =>
            r.request().method() === "PATCH" &&
            r.url().endsWith("/api/admin/site-content/homepage"),
        );
        await admin
          .getByRole("button", { name: "Save as draft", exact: true })
          .click();
        assert.equal((await pending).status(), 200);
        await saved(admin);
        await admin
          .getByRole("link", { name: "Preview saved draft", exact: true })
          .click();
        await admin
          .getByRole("heading", { name: "Saved hero preview", exact: true })
          .waitFor();
        await admin.goto(
          base + "/admin/website/site-content/leadership-profiles/new",
        );
        await admin
          .locator("#profile-displayName")
          .fill("Synthetic profile draft");
        await admin.locator("#profile-roleTitle").fill("Synthetic role");
        pending = admin.waitForResponse(
          (r) =>
            r.request().method() === "POST" &&
            r.url().endsWith("/api/admin/site-content/leadership-profiles"),
        );
        await admin
          .getByRole("button", { name: "Save as draft", exact: true })
          .click();
        assert.equal((await pending).status(), 200);
        await saved(admin);
        await admin
          .getByRole("link", { name: "Preview saved draft", exact: true })
          .click();
        await admin
          .getByRole("heading", { name: "Saved profile preview", exact: true })
          .waitFor();
        report.checks.push(
          "Existing Hero/profile shared editor drafts and previews passed",
        );
      }
      report.checks.push(
        "Admin/policy/consent/panel/publication/stale validation and empty Monitoring workflows at " +
          width,
      );
      await publicContext.close();
      await context.close();
    }
    // Super Admin can trace a historical receipt to the exact retained snapshot.
    const saContext = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      }),
      sa = await saContext.newPage();
    await login(sa, "super_admin");
    await sa.goto(base + "/admin/membership/applications/" + receipts[0].id);
    await sa
      .getByRole("link", { name: "View presented policy", exact: true })
      .click();
    await sa
      .getByRole("heading", { name: "Presented policy version", exact: true })
      .waitFor();
    await sa.getByText(receipts[0].body, { exact: true }).waitFor();
    await scan(sa, "historical-policy-consent-trace");
    await saContext.close();
    const leadContext = await browser.newContext(),
      lead = await leadContext.newPage();
    await login(lead, "research_group_lead");
    assert.equal((await lead.goto(base + root)).status(), 403);
    await scan(lead, "lead-policy-forbidden");
    await leadContext.close();
    // Native no-JS submission also returns retained fields and requires renewed consent.
    const nojs = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 1000 },
      }),
      native = await nojs.newPage(),
      operator = await browser.newContext(),
      admin = await operator.newPage();
    await login(admin);
    await native.goto(base + "/join");
    const values = await fillApplication(native, "nojs");
    await publish(admin, "Synthetic no-JavaScript publication");
    await native
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await native
      .getByRole("alert")
      .filter({ hasText: "privacy policy changed" })
      .first()
      .waitFor();
    await retained(native, values, false);
    await native.locator("#join-consent").check();
    await native
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await native
      .getByRole("heading", { name: "Application received", exact: true })
      .waitFor();
    report.checks.push(
      "Native no-JS stale-policy review, retained fields and renewed consent passed",
    );
    await nojs.close();
    await operator.close();
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      "Browser checks passed: " +
        report.scans.length +
        " axe/overflow scans; 0 runtime errors.",
    );
  } finally {
    await browser.close();
    await pool.end();
  }
})().catch((e) => {
  let text = String(e.stack || e);
  for (const secret of secrets) text = text.split(secret).join("[redacted]");
  console.error(text);
  process.exitCode = 1;
});
