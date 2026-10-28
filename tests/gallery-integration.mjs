// All mutations, uploads and fixture credentials are restricted to this disposable loopback database.
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { writeFileSync, chmodSync, readFileSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";
import { eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { adminDatabase } from "../src/lib/admin/database.ts";
import {
  user,
  account,
  mediaAsset,
  mediaReference,
  event,
  auditLog,
  loginAttempt,
} from "../src/lib/admin/schema.ts";
import * as service from "../src/lib/gallery/service.ts";
import {
  emptyGallery,
  assetIds,
  galleryTitle,
  photoLabel,
} from "../src/lib/gallery/input.ts";
import {
  beginUpload,
  acceptUpload,
  finalizeUpload,
  uploadStatus,
  bounded,
} from "../src/lib/media/uploads.ts";
import { mediaStorage } from "../src/lib/media/storage.ts";
import { deliverImage } from "../src/lib/media/delivery.ts";
import {
  publishedGallery,
  publishedGalleryRecord,
} from "../src/lib/gallery/public.ts";
import * as events from "../src/lib/events/service.ts";
import {
  emptyEventFields,
  eventDeletionPhrase,
} from "../src/lib/events/content.ts";
import { seedLeadScope } from "./helpers/research-fixture.mjs";
const database = new URL(process.env.DATABASE_URL || ""),
  base = process.env.ADMIN_ORIGIN,
  unconfigured = "http://127.0.0.1:4322";
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.port, "55433");
assert.equal(database.pathname, "/nosee_admin01_test");
assert.equal(new URL(base).hostname, "127.0.0.1");
assert.equal(process.env.NODE_ENV, "test");
assert.ok(!process.env.VERCEL);
for (const k of [
  "DATABASE_MIGRATION_URL",
  "DATABASE_URL_UNPOOLED",
  "RESEND_API_KEY",
  "MEMBERSHIP_EMAIL_ENABLED",
])
  assert.ok(!process.env[k]);
const { db, pool } = adminDatabase(),
  adapter = mediaStorage(),
  fixtures = {};
assert.equal(adapter?.id, "isolated-fs-test-v1");
let admin, editor, lead;
const fields = (kind = "album", patch = {}) => ({
  ...emptyGallery(kind),
  ...(kind === "album"
    ? { title: "Synthetic album " + randomUUID() }
    : { caption: "Synthetic caption " + randomUUID() }),
  ...patch,
});
async function credential(role) {
  const p = {
    id: randomUUID(),
    firstName: "Gallery",
    lastName: "Reviewer",
    name: "Gallery Reviewer",
    email: randomUUID() + "@example.invalid",
    password: randomBytes(32).toString("base64url"),
    role,
    researchGroupId: role === "research_group_lead" ? randomUUID() : null,
  };
  await db.insert(user).values({ ...p, password: undefined });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: p.id,
    userId: p.id,
    providerId: "credential",
    password: await hashPassword(p.password),
  });
  if (role === "research_group_lead") await seedLeadScope(db, p);
  return p;
}
async function request(
  path,
  {
    method = "GET",
    body,
    cookie,
    origin = base,
    target = base,
    binary = false,
  } = {},
) {
  const r = await fetch(target + path, {
    method,
    redirect: "manual",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method === "GET"
        ? {}
        : {
            origin,
            "content-type": binary
              ? "application/octet-stream"
              : "application/json",
          }),
    },
    ...(body === undefined
      ? {}
      : { body: binary ? body : JSON.stringify(body) }),
  });
  return {
    status: r.status,
    headers: r.headers,
    bytes: new Uint8Array(await r.arrayBuffer()),
  };
}
const text = (r) => Buffer.from(r.bytes).toString("utf8"),
  json = (r) => JSON.parse(text(r));
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
const get = (id) => service.getGallery(editor, id),
  add = async (f = fields(), mode = "draft") =>
    (
      await service.saveGallery(editor, null, {
        fields: f,
        mode,
        version: 0,
        mutationId: randomUUID(),
        confirm: true,
      })
    ).id;
const save = async (id, f, mode = "draft", patch = {}) =>
  service.saveGallery(editor, id, {
    fields: f,
    mode,
    version: (await get(id)).version,
    mutationId: randomUUID(),
    confirm: true,
    ...patch,
  });
const state = async (id, action, patch = {}) =>
  service.publishGallery(editor, id, {
    action,
    version: (await get(id)).version,
    mutationId: randomUUID(),
    confirm: true,
    ...patch,
  });
const remove = async (id, patch = {}) =>
  service.deleteGallery(editor, id, {
    phrase: "Delete " + galleryTitle((await get(id)).fields),
    version: (await get(id)).version,
    mutationId: randomUUID(),
    confirm: true,
    ...patch,
  });
const png = await sharp({
  create: {
    width: 80,
    height: 60,
    channels: 3,
    background: { r: 12, g: 80, b: 30 },
  },
})
  .png()
  .toBuffer();
async function upload(
  id,
  { actor = editor, body = png, key = randomUUID() } = {},
) {
  const start = await beginUpload(actor, id, {
    requestId: key,
    bytes: body.length,
    contentType: "image/png",
  });
  await acceptUpload(actor, id, start.id, body);
  return (await finalizeUpload(actor, id, start.id, { confirm: true })).image;
}
async function albumWithImages(count = 2, patch = {}) {
  const id = await add(fields("album", patch)),
    images = [];
  for (let i = 0; i < count; i++) images.push(await upload(id));
  const f = (await get(id)).fields;
  f.photos = images.map((image) => ({
    id: randomUUID(),
    assetId: image.id,
    caption: "",
    alt: "",
  }));
  f.coverId = f.photos[0]?.id ?? null;
  await save(id, f);
  return { id, fields: f, images };
}
async function photoWithImage() {
  const id = await add(fields("photo")),
    image = await upload(id),
    f = { ...(await get(id)).fields, assetId: image.id };
  await save(id, f);
  return { id, fields: f, image };
}
test.beforeEach(async () => {
  adapter.failWrites = 0;
  adapter.beforeRead = null;
  await db.execute(
    sql`truncate media_reference,media_asset,gallery_item,admin_rate_limit`,
  );
});
try {
  for (const role of ["super_admin", "editor", "research_group_lead"])
    fixtures[role] = await credential(role);
  const fresh = async (p) =>
    (await db.select().from(user).where(eq(user.id, p.id)))[0];
  admin = await fresh(fixtures.super_admin);
  editor = await fresh(fixtures.editor);
  lead = await fresh(fixtures.research_group_lead);
  const cookies = {};
  for (const role of Object.keys(fixtures))
    cookies[role] = await login(fixtures[role]);
  await test("both publishing roles access Gallery pages/APIs; Lead/anonymous are denied including upload/config/catalog operations", async () => {
    const id = await add(),
      root = "/admin/website/site-content/gallery";
    for (const role of ["super_admin", "editor"])
      for (const path of [
        root,
        root + "/albums/new",
        root + "/photos/new",
        root + "/albums/" + id,
        root + "/albums/" + id + "?preview=1",
        "/api/admin/gallery",
        "/api/admin/gallery/" + id,
      ]) {
        const r = await request(path, { cookie: cookies[role] });
        assert.equal(r.status, 200, path);
        assert.match(r.headers.get("cache-control"), /private.*no-store/);
      }
    for (const path of [root, root + "/albums/new", root + "/albums/" + id]) {
      assert.equal(
        (await request(path, { cookie: cookies.research_group_lead })).status,
        403,
      );
      assert.equal((await request(path)).status, 307);
    }
    for (const [path, method, body] of [
      ["/api/admin/gallery", "GET"],
      ["/api/admin/gallery/" + id + "/uploads", "GET"],
      [
        "/api/admin/gallery/" + id + "/uploads",
        "POST",
        {
          requestId: randomUUID(),
          bytes: png.length,
          contentType: "image/png",
        },
      ],
      ["/api/admin/gallery/events", "POST", { q: "test" }],
      ["/api/admin/gallery/" + id + "/uploads/" + randomUUID(), "PUT", {}],
      ["/api/admin/gallery/" + id + "/uploads/" + randomUUID() + "/finalize", "POST", { confirm: true }],
    ]) {
      assert.equal(
        (
          await request(path, {
            method,
            body,
            cookie: cookies.research_group_lead,
          })
        ).status,
        403,
      );
      assert.equal((await request(path, { method, body })).status, 401);
    }
    assert.equal(
      json(
        await request("/api/admin/gallery/" + id + "/uploads", {
          cookie: cookies.editor,
        }),
      ).configured,
      true,
    );
    await assert.rejects(
      uploadStatus({ ...lead, role: "super_admin" }, id),
      (e) => e.status === 403,
    );
  });
  await test("same-origin, confirmation and strict allowlists protect metadata/upload/finalization paths", async () => {
    const id = await add();
    for (const path of [
      "/api/admin/gallery",
      "/api/admin/gallery/" + id + "/uploads",
      "/api/admin/gallery/" + id + "/uploads/" + randomUUID() + "/finalize",
    ])
      assert.equal(
        (
          await request(path, {
            method: "POST",
            body: { confirm: true },
            cookie: cookies.editor,
            origin: "https://foreign.invalid",
          })
        ).status,
        403,
      );
    await assert.rejects(add({ ...fields(), storageKey: "secret" }));
    await assert.rejects(add({ ...fields(), status: "published" }));
    await assert.rejects(
      service.saveGallery(editor, id, {
        fields: fields(),
        mode: "draft",
        version: 1,
        mutationId: randomUUID(),
        confirm: false,
      }),
    );
  });
  await test("production mode fails closed without provider and Vercel rejects the test adapter; metadata drafts remain usable", async () => {
    const id = await add(),
      before = (await db.select().from(mediaAsset)).length;
    const status = await request("/api/admin/gallery/" + id + "/uploads", {
      cookie: cookies.editor,
      target: unconfigured,
    });
    assert.equal(status.status, 200);
    assert.equal(json(status).configured, false);
    const r = await request("/api/admin/gallery/" + id + "/uploads", {
      method: "POST",
      body: {
        requestId: randomUUID(),
        bytes: png.length,
        contentType: "image/png",
      },
      cookie: cookies.editor,
      target: unconfigured,
      origin: unconfigured,
    });
    assert.equal(r.status, 503);
    assert.equal(json(r).error, "Uploads are not configured.");
    assert.equal((await db.select().from(mediaAsset)).length, before);
    const mode = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      assert.equal(mediaStorage(), null);
      await assert.rejects(upload(id), (e) => e.status === 503);
    } finally {
      process.env.NODE_ENV = mode;
    }
    process.env.VERCEL = "1";
    try {
      assert.equal(mediaStorage(), null);
    } finally {
      delete process.env.VERCEL;
    }
    await save(id, {
      ...(await get(id)).fields,
      description: "Saved metadata without an image",
    });
    await assert.rejects(state(id, "publish"));
  });
  await test("HTTP upload/finalization uses real validated bytes, stays private and returns compact descriptors without keys or actor data", async () => {
    const id = await add(),
      start = await request("/api/admin/gallery/" + id + "/uploads", {
        method: "POST",
        cookie: cookies.editor,
        body: {
          requestId: randomUUID(),
          bytes: png.length,
          contentType: "image/png",
        },
      });
    assert.equal(start.status, 200);
    const uploadId = json(start).id;
    let r = await request("/api/admin/gallery/" + id + "/uploads/" + uploadId, {
      method: "PUT",
      body: png,
      binary: true,
      cookie: cookies.editor,
    });
    assert.equal(r.status, 200, text(r));
    r = await request(
      "/api/admin/gallery/" + id + "/uploads/" + uploadId + "/finalize",
      { method: "POST", body: { confirm: true }, cookie: cookies.editor },
    );
    assert.equal(r.status, 200, text(r));
    const image = json(r).image;
    assert.ok(image.thumbUrl.startsWith("/api/admin/gallery/" + id));
    assert.doesNotMatch(
      text(r),
      /rawSha|sha256|storage|provider|uploadedBy|gallery\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\//,
    );
    assert.equal(
      (await request("/api/gallery/" + id + "/images/" + image.id)).status,
      404,
    );
    assert.equal((await request(image.thumbUrl)).status, 401);
    assert.equal(
      (await request(image.thumbUrl, { cookie: cookies.research_group_lead }))
        .status,
      403,
    );
    const bytes = await request(image.thumbUrl, { cookie: cookies.editor });
    assert.equal(bytes.status, 200);
    assert.equal((await sharp(bytes.bytes).metadata()).format, "webp");
    assert.match(bytes.headers.get("cache-control"), /no-store/);
  });
  await test("upload requests and finalization retries are idempotent and cannot switch bytes or declaration", async () => {
    const id = await add(),
      key = randomUUID(),
      before = adapter.writes,
      image = await upload(id, { key }),
      start = await beginUpload(editor, id, {
        requestId: key,
        bytes: png.length,
        contentType: "image/png",
      });
    assert.equal(start.id, image.id);
    await acceptUpload(editor, id, image.id, png);
    assert.equal(
      (await finalizeUpload(editor, id, image.id, { confirm: true })).image.id,
      image.id,
    );
    assert.equal(adapter.writes, before + 2);
    assert.equal((await db.select().from(mediaAsset)).length, 1);
    await assert.rejects(
      beginUpload(editor, id, {
        requestId: key,
        bytes: png.length + 1,
        contentType: "image/png",
      }),
      (e) => e.status === 409,
    );
    await assert.rejects(
      acceptUpload(editor, id, image.id, new Uint8Array(png.length).fill(1)),
      (e) => e.status === 409,
    );
  });
  await test("forged ownership, premature finalization and forged client storage metadata are rejected", async () => {
    const id = await add(),
      other = await add(),
      r = await beginUpload(editor, id, {
        requestId: randomUUID(),
        bytes: png.length,
        contentType: "image/png",
      });
    await assert.rejects(
      finalizeUpload(editor, id, r.id, { confirm: true }),
      (e) => e.status === 409,
    );
    await assert.rejects(
      acceptUpload(admin, id, r.id, png),
      (e) => e.status === 404,
    );
    await assert.rejects(
      finalizeUpload(editor, other, r.id, { confirm: true }),
      (e) => e.status === 404,
    );
    await assert.rejects(
      finalizeUpload(editor, id, r.id, {
        confirm: true,
        key: "forged",
        variants: {},
      }),
      (e) => e.status === 400,
    );
    const asset = await upload(id),
      photoId = randomUUID();
    await assert.rejects(
      save(
        other,
        fields("album", {
          photos: [{ id: photoId, assetId: asset.id, caption: "", alt: "" }],
          coverId: photoId,
        }),
      ),
      (e) => e.status === 400 && /upload/i.test(e.message),
    );
  });
  await test("a failed file preserves other completed uploads; retry produces one attachment identity and records immutable failed-attempt keys", async () => {
    const id = await add(),
      one = await upload(id),
      key = randomUUID(),
      two = await beginUpload(editor, id, {
        requestId: key,
        bytes: png.length,
        contentType: "image/png",
      });
    adapter.failWrites = 1;
    await assert.rejects(
      acceptUpload(editor, id, two.id, png),
      (e) => e.status === 503,
    );
    assert.equal(
      (await db.select().from(mediaAsset).where(eq(mediaAsset.id, one.id)))[0]
        .state,
      "ready",
    );
    await acceptUpload(editor, id, two.id, png);
    await finalizeUpload(editor, id, two.id, { confirm: true });
    const r = (
      await db.select().from(mediaAsset).where(eq(mediaAsset.id, two.id))
    )[0];
    assert.equal(r.attempts.length, 2);
    assert.equal(r.attempts[0].state, "failed");
    assert.equal(r.attempts[1].state, "ready");
    assert.notEqual(r.attempts[0].keys.large, r.attempts[1].keys.large);
    assert.equal(
      (
        await beginUpload(editor, id, {
          requestId: key,
          bytes: png.length,
          contentType: "image/png",
        })
      ).id,
      two.id,
    );
  });
  await test("declaration size/MIME, decode failures and global upload leases bound untrusted work", async () => {
    const id = await add(),
      bad = await beginUpload(editor, id, {
        requestId: randomUUID(),
        bytes: png.length,
        contentType: "image/jpeg",
      });
    await assert.rejects(
      acceptUpload(editor, id, bad.id, png),
      (e) => e.status === 400,
    );
    assert.equal(
      (await db.select().from(mediaAsset).where(eq(mediaAsset.id, bad.id)))[0]
        .state,
      "failed",
    );
    const ids = [];
    for (let i = 0; i < 3; i++)
      ids.push(
        (
          await beginUpload(editor, id, {
            requestId: randomUUID(),
            bytes: png.length,
            contentType: "image/png",
          })
        ).id,
      );
    await db
      .update(mediaAsset)
      .set({ state: "uploading", leaseUntil: new Date(Date.now() + 120000) })
      .where(sql`${inIds(ids.slice(0, 2))}`);
    await assert.rejects(
      acceptUpload(editor, id, ids[2], png),
      (e) => e.status === 429,
    );
    function inIds(values) {
      return sql`${mediaAsset.id} in (${sql.join(
        values.map((v) => sql`${v}::uuid`),
        sql`,`,
      )})`;
    }
  });
  await test("standalone required caption is exactly the public alt, and draft image replacement keeps the old published bytes live", async () => {
    const { id, fields: f, image } = await photoWithImage();
    await state(id, "publish");
    let record = await publishedGalleryRecord(id, "photo");
    assert.equal(record.photos[0].alt, f.caption);
    const oldUrl = record.photos[0].image.largeUrl,
      replacement = await upload(id);
    await save(id, {
      ...f,
      assetId: replacement.id,
      caption: "Working replacement caption",
    });
    record = await publishedGalleryRecord(id, "photo");
    assert.equal(record.photos[0].image.id, image.id);
    assert.equal((await request(oldUrl)).status, 200);
    assert.equal(
      (await request("/api/gallery/" + id + "/images/" + replacement.id))
        .status,
      404,
    );
    await state(id, "publish");
    record = await publishedGalleryRecord(id, "photo");
    assert.equal(record.photos[0].alt, "Working replacement caption");
    assert.equal((await request(oldUrl)).status, 404);
    assert.equal((await request(record.photos[0].image.largeUrl)).status, 200);
  });
  await test("album metadata/photo order/cover/captions publish as one snapshot with stable IDs and generated labels", async () => {
    const { id, fields: f } = await albumWithImages(3);
    await state(id, "publish");
    const live = await publishedGalleryRecord((await get(id)).slug, "album");
    const next = {
      ...f,
      title: "Renamed working album",
      photos: [
        { ...f.photos[2], caption: "Actual caption", alt: "Ignored hint" },
        f.photos[0],
        { ...f.photos[1], alt: "Tripod beside monitor" },
      ],
      coverId: f.photos[2].id,
    };
    await save(id, next);
    assert.deepEqual(
      await publishedGalleryRecord((await get(id)).slug, "album"),
      live,
    );
    await state(id, "publish");
    const result = await publishedGalleryRecord((await get(id)).slug, "album");
    assert.deepEqual(
      result.photos.map((p) => p.id),
      next.photos.map((p) => p.id),
    );
    assert.deepEqual(
      result.photos.map((p) => p.label),
      next.photos.map((_, i) => photoLabel(next.title, i)),
    );
    assert.equal(result.photos[0].alt, "Actual caption");
    assert.equal(result.photos[1].alt, "");
    assert.equal(result.photos[2].alt, "Tripod beside monitor");
  });
  await test("canonical indicators appear/revert/clear on republish, while upload and update bookkeeping alone cannot create false flags", async () => {
    const { id, fields: f } = await albumWithImages();
    await state(id, "publish");
    const flag = async () =>
      (await service.galleryDirectory(editor, {})).rows.find((r) => r.id === id)
        .hasUnpublishedChanges;
    assert.equal(await flag(), false);
    await db
      .update(mediaAsset)
      .set({ updatedAt: new Date() })
      .where(eq(mediaAsset.id, f.photos[0].assetId));
    await save(id, f);
    assert.equal(await flag(), false);
    await save(id, { ...f, description: "Changed" });
    assert.equal(await flag(), true);
    await save(id, f);
    assert.equal(await flag(), false);
    await save(id, { ...f, coverId: f.photos[1].id }, "publish");
    assert.equal(await flag(), false);
    const dto = (await service.galleryDirectory(editor, {})).rows[0];
    assert.ok(
      !("fields" in dto) && !("published" in dto) && !("provider" in dto),
    );
  });
  await test("cover ownership, duplicate attachments and unfinished/missing images prevent publication", async () => {
    const { id, fields: f } = await albumWithImages();
    await assert.rejects(save(id, { ...f, coverId: randomUUID() }, "publish"));
    await assert.rejects(
      save(id, { ...f, photos: [f.photos[0], f.photos[0]] }, "publish"),
    );
    await assert.rejects(
      save(
        id,
        {
          ...f,
          photos: [{ ...f.photos[0], assetId: randomUUID() }],
          coverId: f.photos[0].id,
        },
        "publish",
      ),
    );
    await assert.rejects(add(fields("photo"), "publish"));
    await assert.rejects(add(fields("album"), "publish"));
  });
  await test("draft removals, unpublish and deletion preserve stored objects/references and never expose obsolete public URLs", async () => {
    const { id, fields: f } = await albumWithImages();
    await state(id, "publish");
    const url = (await publishedGalleryRecord((await get(id)).slug, "album"))
      .photos[0].image.largeUrl;
    await save(id, { ...f, photos: [f.photos[1]], coverId: f.photos[1].id });
    assert.equal((await request(url)).status, 200);
    await state(id, "publish");
    assert.equal((await request(url)).status, 404);
    const asset = (
      await db
        .select()
        .from(mediaAsset)
        .where(eq(mediaAsset.id, f.photos[0].assetId))
    )[0];
    assert.ok(await adapter.statPrivate(asset.variants.large.key));
    assert.ok(
      (
        await db
          .select()
          .from(mediaReference)
          .where(
            sql`${mediaReference.assetId}=${asset.id}::uuid and ${mediaReference.kind}='history'`,
          )
      ).length,
    );
    await state(id, "unpublish");
    assert.equal(
      await publishedGalleryRecord((await get(id)).slug, "album"),
      null,
    );
    await state(id, "publish");
    await remove(id);
    assert.equal((await request(url)).status, 404);
    assert.ok(await adapter.statPrivate(asset.variants.large.key));
    await assert.rejects(state(id, "publish"), (e) => e.status === 404);
  });
  await test("safe cleanup eligibility excludes current/published/history and other valid references; no storage deletion is performed", async () => {
    const { id, fields: f } = await albumWithImages(),
      orphan = await upload(id);
    await db
      .update(mediaAsset)
      .set({
        createdAt: new Date(Date.now() - 9 * 86400000),
        updatedAt: new Date(Date.now() - 9 * 86400000),
      });
    assert.deepEqual(
      (await service.mediaCleanupCandidates(admin)).map((v) => v.id),
      [orphan.id],
    );
    await db.insert(mediaReference).values({
      assetId: orphan.id,
      ownerType: "other-authorized-context",
      ownerId: randomUUID(),
      kind: "working",
    });
    assert.equal((await service.mediaCleanupCandidates(admin)).length, 0);
    await assert.rejects(
      service.mediaCleanupCandidates(editor),
      (e) => e.status === 403,
    );
    assert.ok(assetIds(f).length);
  });
  await test("Event association uses real nondeleted records and current published links; Event unpublish/delete never cascades to albums", async () => {
    const ef = {
        ...emptyEventFields(),
        title: "Synthetic Gallery Event",
        summary: "Synthetic event summary",
        organiser: "Synthetic test organiser",
        body: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Synthetic event description." }],
            },
          ],
        },
        location: {
          type: "online",
          venue: "",
          address: "",
          city: "",
          country: "",
          platform: "Test meeting",
        },
        startAt: "2027-05-01T10:00:00Z",
        endAt: "2027-05-01T12:00:00Z",
      },
      eid = (
        await events.createEvent(editor, {
          fields: ef,
          mode: "publish",
          requestId: randomUUID(),
          confirm: true,
        })
      ).id;
    const { id } = await albumWithImages(1, { eventId: eid });
    await state(id, "publish");
    const slug = (await get(id)).slug;
    assert.equal(
      (await publishedGalleryRecord(slug, "album")).event.title,
      ef.title,
    );
    const er = await events.getEvent(editor, eid);
    await events.publishEvent(editor, eid, {
      action: "unpublish",
      version: er.version,
      mutationId: randomUUID(),
      confirm: true,
    });
    assert.equal((await publishedGalleryRecord(slug, "album")).event, null);
    const ev = await events.getEvent(editor, eid);
    await events.deleteEvent(editor, eid, {
      phrase: eventDeletionPhrase(ev.fields.title),
      version: ev.version,
      mutationId: randomUUID(),
      confirm: true,
    });
    assert.ok(await publishedGalleryRecord(slug, "album"));
    await assert.rejects(
      save(id, (await get(id)).fields),
      (e) => e.status === 409,
    );
    await save(id, { ...(await get(id)).fields, eventId: null });
    await remove(id);
    assert.equal(
      (await events.getEvent(editor, eid).catch((e) => ({ status: e.status })))
        .status,
      404,
    );
  });
  await test("stale/concurrent edits, idempotent saves and reserved stable/deleted slugs cannot resurrect records", async () => {
    const f = fields("album", { title: "Stable slug" }),
      id = await add(f),
      slug = (await get(id)).slug;
    const body = {
      fields: { ...f, title: "Renamed" },
      version: 1,
      mutationId: randomUUID(),
      mode: "draft",
      confirm: true,
    };
    await service.saveGallery(editor, id, body);
    await service.saveGallery(editor, id, body);
    assert.equal((await get(id)).version, 2);
    assert.equal((await get(id)).slug, slug);
    const result = await Promise.allSettled([
      save(id, f, "draft", { version: 2 }),
      save(id, { ...f, description: "Other" }, "draft", { version: 2 }),
    ]);
    assert.equal(result.filter((v) => v.status === "fulfilled").length, 1);
    const r = await get(id),
      del = {
        phrase: "Delete " + galleryTitle(r.fields),
        version: r.version,
        mutationId: randomUUID(),
        confirm: true,
      };
    await service.deleteGallery(editor, id, del);
    await service.deleteGallery(editor, id, del);
    assert.notEqual((await get(await add(f))).slug, slug);
    await assert.rejects(
      service.saveGallery(editor, id, body),
      (e) => e.status === 404,
    );
  });
  await test("current role revocation wins before finalization and while image bytes are being read", async () => {
    const { id } = await photoWithImage();
    await state(id, "publish");
    const record = await publishedGalleryRecord(id, "photo"),
      imageId = record.photos[0].image.id;
    let release, started;
    const begin = new Promise((r) => (started = r)),
      wait = new Promise((r) => (release = r));
    adapter.beforeRead = async () => {
      started();
      await wait;
    };
    const read = deliverImage(id, imageId, "large");
    await begin;
    await state(id, "unpublish");
    release();
    await assert.rejects(read, (e) => e.status === 404);
    adapter.beforeRead = null;
    await db
      .update(user)
      .set({ accessVersion: editor.accessVersion + 1 })
      .where(eq(user.id, editor.id));
    try {
      await assert.rejects(
        finalizeUpload(editor, id, imageId, { confirm: true }),
        (e) => e.status === 403,
      );
      await assert.rejects(
        service.getGallery({ ...editor, role: "super_admin" }, id),
        (e) => e.status === 403,
      );
    } finally {
      await db
        .update(user)
        .set({ accessVersion: editor.accessVersion })
        .where(eq(user.id, editor.id));
    }
  });
  await test("public/admin search/pagination and public DTOs remain bounded and free of storage/private metadata", async () => {
    for (let i = 0; i < 23; i++) {
      const { id, fields: f } = await photoWithImage();
      await save(
        id,
        {
          ...f,
          caption: "Page fixture " + String(i).padStart(2, "0"),
          displayOrder: i,
        },
        "publish",
      );
    }
    const a = await service.galleryDirectory(editor, { q: "Page fixture" }),
      b = await service.galleryDirectory(editor, {
        q: "Page fixture",
        page: 2,
      }),
      p = await publishedGallery({ q: "Page fixture" }),
      p2 = await publishedGallery({ q: "Page fixture", page: 2 });
    assert.equal(a.rows.length, 20);
    assert.equal(b.rows.length, 3);
    assert.equal(p.rows.length, 12);
    assert.equal(p2.rows.length, 11);
    assert.equal(p.rows[0].title, "Page fixture 00");
    assert.doesNotMatch(
      JSON.stringify(p),
      /uploadedBy|sha256|rawSha|provider|leaseToken|storageKey|attempts/,
    );
  });
  await test("public pages have accurate canonical/noindex, complete 404s, bounded album photo pages and independent links", async () => {
    const { id } = await albumWithImages(14, {
      title: "Synthetic public album",
      albumDate: "2026-10-28",
    });
    await state(id, "publish");
    const slug = (await get(id)).slug;
    for (const path of ["/multimedia", "/multimedia/" + slug]) {
      const r = await request(path);
      assert.equal(r.status, 200);
      assert.match(text(r), /noindex, nofollow/);
      assert.match(text(r), /rel="canonical"/);
    }
    const second = await publishedGalleryRecord(slug, "album", 2);
    assert.equal(second.photos.length, 2);
    assert.equal(second.photos[0].label, "Synthetic public album - 13");
    assert.doesNotMatch(
      text(await request("/multimedia/" + slug)),
      /uploadedBy|storageKey|leaseToken/,
    );
    await state(id, "unpublish");
    for (const path of [
      "/multimedia/" + slug,
      "/multimedia/missing-album",
      "/multimedia/photos/invalid",
      "/multimedia/photos/" + id,
    ]) {
      const r = await request(path);
      assert.equal(r.status, 404, path);
      assert.match(text(r), />Page not found<\/h1>/);
      assert.equal((text(r).match(/id="main-content"/g) || []).length, 1);
    }
  });
  await test("audit events retain IDs/actions/status, not captions, descriptions or storage metadata; failed audit rolls back a publication", async () => {
    const { id, fields: f } = await albumWithImages(1, {
      description: "PRIVATE EDITOR DESCRIPTION",
    });
    await save(id, { ...f, title: "Sensitive editorial title" }, "publish");
    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.targetId, id));
    assert.doesNotMatch(
      JSON.stringify(audits),
      /PRIVATE EDITOR DESCRIPTION|Sensitive editorial title|sha256|thumb\.webp/,
    );
    await db.execute(
      sql`create function a11_fail_audit() returns trigger language plpgsql as $$ begin if NEW.target_id='${sql.raw(id)}'::uuid then raise exception 'synthetic audit failure'; end if; return NEW; end $$;create trigger a11_fail_audit before insert on admin_audit_log for each row execute function a11_fail_audit()`,
    );
    const before = await get(id);
    try {
      await assert.rejects(
        save(id, { ...before.fields, description: "Uncommitted" }, "publish"),
      );
      assert.deepEqual(await get(id), before);
    } finally {
      await db.execute(
        sql`drop trigger a11_fail_audit on admin_audit_log;drop function a11_fail_audit()`,
      );
    }
  });
  await test("missing or altered physical objects cannot finalize; finalization rechecks role after storage work", async () => {
    const id = await add();
    const pending = await beginUpload(editor, id, {
      requestId: randomUUID(),
      bytes: png.length,
      contentType: "image/png",
    });
    await acceptUpload(editor, id, pending.id, png);
    const original = adapter.statPrivate;
    try {
      adapter.statPrivate = async () => null;
      await assert.rejects(
        finalizeUpload(editor, id, pending.id, { confirm: true }),
        (e) => e.status === 503,
      );
      adapter.statPrivate = async (key) => ({
        ...(await original(key)),
        sha256: "0".repeat(64),
      });
      await assert.rejects(
        finalizeUpload(editor, id, pending.id, { confirm: true }),
        (e) => e.status === 503,
      );
      let revoked = false;
      adapter.statPrivate = async (key) => {
        if (!revoked) {
          revoked = true;
          await db
            .update(user)
            .set({ accessVersion: editor.accessVersion + 1 })
            .where(eq(user.id, editor.id));
        }
        return original(key);
      };
      await assert.rejects(
        finalizeUpload(editor, id, pending.id, { confirm: true }),
        (e) => e.status === 403,
      );
      assert.equal(
        (
          await db
            .select()
            .from(mediaAsset)
            .where(eq(mediaAsset.id, pending.id))
        )[0].state,
        "staged",
      );
    } finally {
      adapter.statPrivate = original;
      await db
        .update(user)
        .set({ accessVersion: editor.accessVersion })
        .where(eq(user.id, editor.id));
    }
    await finalizeUpload(editor, id, pending.id, { confirm: true });
  });
  await test("storage operations time out safely without claiming success", async () => {
    await assert.rejects(
      bounded(new Promise(() => {}), 15),
      (e) => e.status === 503,
    );
  });
  await test("0014 is additive and preserves unrelated identities and Events", async () => {
    const users = await db.select().from(user),
      eventsBefore = await db.select().from(event),
      rollback = Error("isolated rollback");
    await assert.rejects(
      db.transaction(async (tx) => {
        await tx.execute(
          sql`drop table media_reference,media_asset,gallery_item`,
        );
        for (const statement of readFileSync(
          new URL("../drizzle/0014_gallery_media.sql", import.meta.url),
          "utf8",
        ).split("--> statement-breakpoint"))
          if (statement.trim()) await tx.execute(sql.raw(statement));
        assert.deepEqual(await tx.select().from(user), users);
        assert.deepEqual(await tx.select().from(event), eventsBefore);
        throw rollback;
      }),
      (e) => e === rollback,
    );
  });
  writeFileSync(
    "/tmp/nosee-a11-private/fixtures.json",
    JSON.stringify(fixtures),
    { mode: 0o600 },
  );
  chmodSync("/tmp/nosee-a11-private/fixtures.json", 0o600);
} finally {
  adapter.beforeRead = null;
  await pool.end();
}
