// Mutating checks are restricted to a disposable loopback database and synthetic accounts.
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { writeFileSync, chmodSync, readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "../src/lib/admin/database.ts";
import {
  user,
  account,
  privacyPolicy,
  privacyPolicyVersion,
  membershipApplication,
  auditLog,
  loginAttempt,
} from "../src/lib/admin/schema.ts";
import {
  getPrivacy,
  savePrivacy,
  getPrivacyVersion,
} from "../src/lib/privacy/service.ts";
import { publishedPrivacyPolicy } from "../src/lib/privacy/public.ts";
import { developmentPolicy } from "../src/lib/privacy/content.ts";
import { descriptionDocument } from "../src/lib/research/description.ts";
import { createApplicationToken } from "../src/lib/membership/form-guard.ts";
import { submitMembershipApplication as submit } from "../src/lib/membership/service.ts";
import { seedLeadScope } from "./helpers/research-fixture.mjs";
const database = new URL(process.env.DATABASE_URL || ""),
  base = process.env.ADMIN_ORIGIN;
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "55433");
assert.equal(database.pathname, "/nosee_admin01_test");
assert.equal(new URL(base).hostname, "127.0.0.1");
for (const key of [
  "DATABASE_MIGRATION_URL",
  "DATABASE_URL_UNPOOLED",
  "RESEND_API_KEY",
])
  assert.ok(!process.env[key]);
assert.notEqual(process.env.MEMBERSHIP_EMAIL_ENABLED, "true");
const { db, pool } = adminDatabase(),
  fixtures = {},
  cookies = {},
  headers = new Headers({ origin: base }),
  root = "/admin/website/site-content/privacy";
let admin, editor, lead;
const baseline = () => ({
  title: developmentPolicy.title,
  body: developmentPolicy.body,
  effectiveDate: "",
});
const fields = (patch = {}) => ({
  title: "Privacy policy",
  body: "Synthetic policy wording for isolated tests " + randomUUID(),
  effectiveDate: "2026-10-28",
  ...patch,
});
const get = () => getPrivacy(editor),
  save = async (f, mode = "draft", patch = {}) =>
    savePrivacy(editor, {
      fields: f,
      mode,
      version: (await get()).version,
      mutationId: randomUUID(),
      confirm: true,
      ...(mode === "publish" ? { approvedForPublication: true } : {}),
      ...patch,
    });
const application = (version) => ({
  firstName: "Privacy",
  lastName: "Applicant",
  email: randomUUID() + "@example.invalid",
  careerStage: "early_career",
  researchInterests: ["space_weather"],
  why: "Private synthetic motivation.",
  consent: true,
  formToken: createApplicationToken(undefined, version),
  website: "",
});
async function request(
  path,
  { method = "GET", body, cookie, origin = base } = {},
) {
  const r = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method === "GET"
        ? {}
        : { origin, "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, headers: r.headers, text: await r.text() };
}
const json = (r) => JSON.parse(r.text),
  count = async (table) => (await db.select().from(table)).length;
async function credential(role) {
  const p = {
    id: randomUUID(),
    firstName: "Privacy",
    lastName: "Reviewer",
    name: "Privacy Reviewer",
    email: randomUUID() + "@example.invalid",
    password: randomBytes(32).toString("base64url"),
    role,
    researchGroupId: role === "research_group_lead" ? randomUUID() : null,
  };
  await db.insert(user).values({ ...p, password: undefined });
  await db
    .insert(account)
    .values({
      id: randomUUID(),
      accountId: p.id,
      userId: p.id,
      providerId: "credential",
      password: await hashPassword(p.password),
    });
  if (role === "research_group_lead") await seedLeadScope(db, p);
  return p;
}
async function login(p) {
  await db.delete(loginAttempt);
  const r = await request("/api/admin/auth/sign-in/email", {
    method: "POST",
    body: { email: p.email, password: p.password },
  });
  assert.equal(r.status, 200);
  return r.headers
    .getSetCookie()
    .find((v) => v.includes("session_token="))
    ?.split(";")[0];
}
async function reset() {
  await db.execute(sql`truncate admin_rate_limit`);
  await db
    .update(privacyPolicy)
    .set({
      fields: baseline(),
      publishedVersion: developmentPolicy.version,
      version: 1,
      lastMutationKey: null,
      lastMutationDigest: null,
    })
    .where(eq(privacyPolicy.id, "privacy"));
}
async function pendingApplicationLock() {
  for (let i = 0; i < 100; i++) {
    const r = await pool.query(
      "select count(*)::int n from pg_stat_activity where wait_event='advisory' and query like '%4631003%' and pid<>pg_backend_pid()",
    );
    if (r.rows[0].n) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error("Expected bounded lock wait");
}
test.beforeEach(reset);
try {
  for (const role of ["super_admin", "editor", "research_group_lead"]) {
    fixtures[role] = await credential(role);
    cookies[role] = await login(fixtures[role]);
  }
  const fresh = async (p) =>
    (await db.select().from(user).where(eq(user.id, p.id)))[0];
  admin = await fresh(fixtures.super_admin);
  editor = await fresh(fixtures.editor);
  lead = await fresh(fixtures.research_group_lead);
  await test("Super Admin/Editor access editor, previews and empty Monitoring; Lead/anonymous are denied by pages and APIs", async () => {
    for (const role of ["super_admin", "editor"])
      for (const path of [
        root,
        root + "?preview=1",
        root + "?publishedVersion=development-placeholder-v1",
        "/admin/website/monitoring-dashboards",
        "/api/admin/site-content/privacy",
      ]) {
        const r = await request(path, { cookie: cookies[role] });
        assert.equal(r.status, 200, path);
        assert.match(r.headers.get("cache-control"), /private.*no-store/);
      }
    for (const path of [
      root,
      root + "?preview=1",
      "/admin/website/monitoring-dashboards",
    ]) {
      assert.equal(
        (await request(path, { cookie: cookies.research_group_lead })).status,
        403,
      );
      assert.equal((await request(path)).status, 307);
    }
    assert.equal(
      (
        await request("/api/admin/site-content/privacy", {
          cookie: cookies.research_group_lead,
        })
      ).status,
      403,
    );
    assert.equal(
      (await request("/api/admin/site-content/privacy")).status,
      401,
    );
    for (const actor of [lead, { ...lead, role: "super_admin" }])
      await assert.rejects(getPrivacy(actor), (e) => e.status === 403);
    const monitoring = (
      await request("/admin/website/monitoring-dashboards", {
        cookie: cookies.editor,
      })
    ).text
      .split('<main id="main-content"')[1]
      .split("</main>")[0];
    assert.match(monitoring, />Monitoring dashboards<\/h1>/);
    assert.doesNotMatch(monitoring, /<form|<input|<button|metric|integration/i);
  });
  await test("same-origin, strict allowlists, confirmation and approval protect mutations; no unpublish/delete exists", async () => {
    const body = {
      fields: fields(),
      mode: "draft",
      version: 1,
      mutationId: randomUUID(),
      confirm: true,
    };
    assert.equal(
      (
        await request("/api/admin/site-content/privacy", {
          method: "PATCH",
          body,
          cookie: cookies.editor,
          origin: "https://foreign.invalid",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/api/admin/site-content/privacy", {
          method: "PATCH",
          body,
          cookie: cookies.research_group_lead,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/api/admin/site-content/privacy", {
          method: "PATCH",
          body,
        })
      ).status,
      401,
    );
    for (const patch of [
      { confirm: false },
      { status: "unpublished" },
      { createdBy: admin.id },
      { publishedVersion: "forged" },
      { mode: "unpublish" },
    ])
      await assert.rejects(
        savePrivacy(editor, { ...body, ...patch }),
        (e) => e.status === 400,
      );
    for (const method of ["DELETE", "POST"])
      assert.equal(
        (
          await request("/api/admin/site-content/privacy", {
            method,
            body: { action: "unpublish" },
            cookie: cookies.editor,
          })
        ).status,
        405,
      );
    assert.equal(
      (await publishedPrivacyPolicy()).version,
      developmentPolicy.version,
    );
  });
  await test("draft saves/private previews never change the shared public policy, and no working content leaks", async () => {
    const f = fields({ body: "PRIVATE DRAFT POLICY MARKER" });
    await save(f);
    const row = await get();
    assert.equal(row.hasUnpublishedChanges, true);
    assert.equal(row.publishedVersion, developmentPolicy.version);
    assert.match(
      (await request(root + "?preview=1", { cookie: cookies.editor })).text,
      /PRIVATE DRAFT POLICY MARKER/,
    );
    for (const path of ["/privacy", "/join", "/api/privacy"]) {
      const r = await request(path);
      assert.equal(r.status, 200);
      assert.doesNotMatch(r.text, /PRIVATE DRAFT POLICY MARKER/);
      assert.match(r.text, /Lorem ipsum/);
    }
  });
  await test("publication freezes title/body/date atomically and retains immutable historical wording for consent review", async () => {
    const f = fields({
      title: "Synthetic policy title",
      body: descriptionDocument("Synthetic published policy body."),
    });
    await save(f, "publish");
    const live = await publishedPrivacyPolicy();
    assert.equal(live.title, f.title);
    assert.equal(live.effectiveDate, f.effectiveDate);
    assert.deepEqual(live.body, f.body);
    assert.equal(live.isPlaceholder, false);
    assert.match(live.version, /^privacy-/);
    const old = await getPrivacyVersion(editor, developmentPolicy.version);
    assert.equal(old.body, developmentPolicy.body);
    const current = json(await request("/api/privacy")).policy;
    assert.deepEqual(current, live);
    assert.match(
      (await request("/privacy")).text,
      /Synthetic published policy body/,
    );
    assert.doesNotMatch(
      JSON.stringify(current),
      /createdBy|lastMutation|fields|administrator/,
    );
    await save(fields());
    assert.deepEqual(await publishedPrivacyPolicy(), live);
    assert.deepEqual(await getPrivacyVersion(admin, live.version), {
      ...live,
      publishedAt: live.publishedAt,
    });
  });
  await test("canonical identical saves, timestamp bookkeeping, revert and republish never produce false revisions or new consent versions", async () => {
    await save({
      ...baseline(),
      body: descriptionDocument(developmentPolicy.body),
    });
    assert.equal((await get()).hasUnpublishedChanges, false);
    const f = fields();
    await save(f, "publish");
    const live = await publishedPrivacyPolicy(),
      before = await count(privacyPolicyVersion);
    await db
      .update(privacyPolicy)
      .set({ updatedAt: new Date() })
      .where(eq(privacyPolicy.id, "privacy"));
    assert.equal((await get()).hasUnpublishedChanges, false);
    await save({ ...f, title: "Changed" });
    assert.equal((await get()).hasUnpublishedChanges, true);
    await save({ ...f, body: descriptionDocument(f.body) });
    assert.equal((await get()).hasUnpublishedChanges, false);
    await save(f, "publish");
    assert.equal((await publishedPrivacyPolicy()).version, live.version);
    assert.equal(await count(privacyPolicyVersion), before);
  });
  await test("stale/concurrent saves and reused mutation keys cannot overwrite a reviewed draft", async () => {
    const body = {
      fields: fields(),
      mode: "draft",
      version: 1,
      mutationId: randomUUID(),
      confirm: true,
    };
    await savePrivacy(editor, body);
    await savePrivacy(editor, body);
    assert.equal((await get()).version, 2);
    await assert.rejects(
      savePrivacy(editor, { ...body, fields: fields() }),
      (e) => e.status === 409,
    );
    await assert.rejects(
      save(fields(), "draft", { version: 1 }),
      (e) => e.status === 409,
    );
    const results = await Promise.allSettled([
      save(fields(), "draft", { version: 2 }),
      save(fields(), "draft", { version: 2 }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  });
  await test("placeholder/empty wording and missing approval cannot publish or displace the live policy", async () => {
    for (const f of [
      baseline(),
      { ...baseline(), body: descriptionDocument(developmentPolicy.body) },
      fields({ body: "" }),
    ])
      await assert.rejects(save(f, "publish"), (e) => e.status === 400);
    await assert.rejects(
      savePrivacy(editor, {
        fields: fields(),
        mode: "publish",
        version: 1,
        mutationId: randomUUID(),
        confirm: true,
      }),
      (e) => e.status === 400,
    );
    assert.equal(
      (await publishedPrivacyPolicy()).version,
      developmentPolicy.version,
    );
  });
  await test("new receipts record exactly the presented policy and unchanged consent wording/UTC expiry; later publication never rewrites them", async () => {
    await save(fields(), "publish");
    const live = await publishedPrivacyPolicy(),
      data = application(live.version);
    await submit(data, headers);
    const [before] = await db
      .select()
      .from(membershipApplication)
      .where(eq(membershipApplication.email, data.email));
    assert.equal(before.privacyVersion, live.version);
    assert.equal(before.consentVersion, "membership-review-v1");
    assert.equal(before.expiresAt - before.createdAt, 720 * 3600000);
    assert.ok(before.consentedAt instanceof Date);
    await save(fields(), "publish");
    const [after] = await db
      .select()
      .from(membershipApplication)
      .where(eq(membershipApplication.id, before.id));
    assert.deepEqual(after, before);
    assert.deepEqual(
      (await getPrivacyVersion(admin, before.privacyVersion)).body,
      live.body,
    );
  });
  await test("a policy update while an old form is open rejects submission without creating a receipt or attributing unseen wording", async () => {
    const data = application(developmentPolicy.version),
      before = await count(membershipApplication);
    await save(fields(), "publish");
    await assert.rejects(
      submit(data, headers),
      (e) => e.status === 409 && /privacy policy changed/.test(e.message),
    );
    assert.equal(await count(membershipApplication), before);
    await assert.rejects(
      submit(
        { ...data, privacyVersion: (await publishedPrivacyPolicy()).version },
        headers,
      ),
      (e) => e.status === 400,
    );
    await assert.rejects(
      submit(
        {
          ...data,
          formToken: data.formToken.replace(
            "development-placeholder-v1",
            (await publishedPrivacyPolicy()).version,
          ),
        },
        headers,
      ),
      (e) => e.status === 400,
    );
  });
  await test("successful receipt retries remain idempotent after publication, preserving original consent and notification intent", async () => {
    const data = application(developmentPolicy.version);
    await submit(data, headers);
    const before = await count(membershipApplication),
      [row] = await db
        .select()
        .from(membershipApplication)
        .where(eq(membershipApplication.email, data.email));
    await save(fields(), "publish");
    await submit(data, headers);
    assert.equal(await count(membershipApplication), before);
    assert.deepEqual(
      (
        await db
          .select()
          .from(membershipApplication)
          .where(eq(membershipApplication.id, row.id))
      )[0],
      row,
    );
  });
  await test("pre-A12 signed forms bind only the original placeholder and require review if the policy changed", async () => {
    const value = randomUUID() + "." + Date.now(),
      signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET)
        .update("nosee-membership-form-v1:" + value)
        .digest("base64url"),
      data = {
        ...application(developmentPolicy.version),
        formToken: value + "." + signature,
      };
    await submit(data, headers);
    const [row] = await db
      .select()
      .from(membershipApplication)
      .where(eq(membershipApplication.email, data.email));
    assert.equal(row.privacyVersion, developmentPolicy.version);
    const value2 = randomUUID() + "." + Date.now(),
      sig2 = createHmac("sha256", process.env.BETTER_AUTH_SECRET)
        .update("nosee-membership-form-v1:" + value2)
        .digest("base64url");
    await save(fields(), "publish");
    await assert.rejects(
      submit(
        {
          ...data,
          email: randomUUID() + "@example.invalid",
          formToken: value2 + "." + sig2,
        },
        headers,
      ),
      (e) => e.status === 409,
    );
  });
  await test("publication and receipt share the consent lock in management/application order, so queued old submissions cannot race through", async () => {
    const data = application(developmentPolicy.version),
      client = await pool.connect();
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(4631003)");
    let publication, receipt;
    try {
      const row = await get();
      publication = savePrivacy(editor, {
        fields: fields(),
        mode: "publish",
        version: row.version,
        mutationId: randomUUID(),
        confirm: true,
        approvedForPublication: true,
      });
      publication.catch(() => {});
      await pendingApplicationLock();
      receipt = submit(data, headers);
      receipt.catch(() => {});
      await client.query("commit");
      await publication;
      await assert.rejects(receipt, (e) => e.status === 409);
    } finally {
      await client.query("rollback");
      client.release();
      await Promise.allSettled([publication, receipt].filter(Boolean));
    }
    assert.equal(
      (
        await db
          .select()
          .from(membershipApplication)
          .where(eq(membershipApplication.email, data.email))
      ).length,
      0,
    );
  });
  await test("safe audits exclude wording/title/token data, and an audit failure rolls back both snapshot and working copy", async () => {
    const f = fields({
      title: "PRIVATE EDITOR TITLE",
      body: "PRIVATE EDITOR WORDING",
    });
    await save(f, "publish");
    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.targetLabel, "Privacy policy"));
    assert.doesNotMatch(
      JSON.stringify(rows),
      /PRIVATE EDITOR TITLE|PRIVATE EDITOR WORDING|formToken/,
    );
    const before = await get(),
      versions = await count(privacyPolicyVersion);
    await db.execute(
      sql`create function a12_fail_policy_audit() returns trigger language plpgsql as $$ begin if NEW.action='Published privacy policy' then raise exception 'isolated policy audit failure';end if;return NEW;end $$;create trigger a12_fail_policy_audit before insert on admin_audit_log for each row execute function a12_fail_policy_audit()`,
    );
    try {
      await assert.rejects(save(fields(), "publish"));
      assert.deepEqual(await get(), before);
      assert.equal(await count(privacyPolicyVersion), versions);
    } finally {
      await db.execute(
        sql`drop trigger a12_fail_policy_audit on admin_audit_log;drop function a12_fail_policy_audit()`,
      );
    }
  });
  await test("current authority revocation wins even if the caller supplies a forged role", async () => {
    await db
      .update(user)
      .set({ accessVersion: editor.accessVersion + 1 })
      .where(eq(user.id, editor.id));
    try {
      await assert.rejects(
        getPrivacy({ ...editor, role: "super_admin" }),
        (e) => e.status === 403,
      );
      await assert.rejects(save(fields()), (e) => e.status === 403);
    } finally {
      await db
        .update(user)
        .set({ accessVersion: editor.accessVersion })
        .where(eq(user.id, editor.id));
    }
  });
  await test("configured database/schema failure never restores obsolete placeholder wording and disables new consent", async () => {
    await save(fields(), "publish");
    const configured = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      assert.equal(await publishedPrivacyPolicy(), null);
    } finally {
      process.env.DATABASE_URL = configured;
    }
    await db.execute(
      sql`alter table privacy_policy rename to a12_unavailable_policy`,
    );
    try {
      assert.equal(await publishedPrivacyPolicy(), null);
      assert.equal((await request("/api/privacy")).status, 503);
      const page = await request("/privacy");
      assert.equal(page.status, 200);
      assert.match(page.text, /temporarily unavailable/);
      assert.doesNotMatch(page.text, /Lorem ipsum/);
      const join = await request("/join");
      assert.match(join.text, /<fieldset disabled=""/);
      assert.doesNotMatch(join.text, /Lorem ipsum/);
    } finally {
      await db.execute(
        sql`alter table a12_unavailable_policy rename to privacy_policy`,
      );
    }
  });
  await test("additive 0015 preserves historical consent timestamps/versions, including unmapped legacy values, without membership deletion", async () => {
    const data = application(developmentPolicy.version);
    await submit(data, headers);
    await db
      .update(membershipApplication)
      .set({
        privacyVersion: "legacy-unmapped-policy",
        consentVersion: "historical-consent-v0",
      })
      .where(eq(membershipApplication.email, data.email));
    const before = await db.select().from(membershipApplication),
      users = await db.select().from(user),
      rollback = Error("isolated rollback");
    await assert.rejects(
      db.transaction(async (tx) => {
        await tx.execute(
          sql`drop table privacy_policy;drop table privacy_policy_version`,
        );
        for (const statement of readFileSync(
          new URL("../drizzle/0015_privacy_policy.sql", import.meta.url),
          "utf8",
        ).split("--> statement-breakpoint"))
          if (statement.trim()) await tx.execute(sql.raw(statement));
        assert.deepEqual(await tx.select().from(membershipApplication), before);
        assert.deepEqual(await tx.select().from(user), users);
        throw rollback;
      }),
      (e) => e === rollback,
    );
  });
  await reset();
  writeFileSync(
    "/tmp/nosee-a12-private/privacy-fixtures.json",
    JSON.stringify(fixtures),
    { mode: 0o600 },
  );
  chmodSync("/tmp/nosee-a12-private/privacy-fixtures.json", 0o600);
} finally {
  await pool.end();
}
