import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { render } from "./helpers/render-site.mjs";
import {
  galleryFieldsInput,
  emptyGallery,
  galleryFingerprint,
  galleryRequirements,
  photoLabel,
  albumAlt,
} from "../src/lib/gallery/input.ts";
const { PhotoViewer } = await import(
  "../src/components/site/gallery/PhotoViewer.tsx"
);
const photo = (patch = {}) => ({
    ...emptyGallery("photo"),
    caption: "Synthetic photograph",
    ...patch,
  }),
  album = (patch = {}) => ({
    ...emptyGallery("album"),
    title: "Synthetic album",
    ...patch,
  }),
  entry = (patch = {}) => ({
    id: randomUUID(),
    assetId: randomUUID(),
    caption: "",
    alt: "",
    ...patch,
  });
test("standalone captions are required, trimmed and the only public alt source", () => {
  assert.equal(
    galleryFieldsInput.safeParse(photo({ caption: " " })).success,
    false,
  );
  assert.equal(
    galleryFieldsInput.safeParse({ ...photo(), alt: "conflicting" }).success,
    false,
  );
  assert.equal(
    galleryFieldsInput.parse(photo({ caption: "  Original caption  " }))
      .caption,
    "Original caption",
  );
  assert.ok(galleryRequirements(photo()).assetId);
});
test("album metadata drafts are valid without images; publication requires an owned cover and photos", () => {
  const f = album();
  assert.equal(galleryFieldsInput.safeParse(f).success, true);
  assert.ok(galleryRequirements(f).photos);
  const p = entry();
  assert.ok(galleryRequirements(album({ photos: [p] })).coverId);
  assert.deepEqual(
    galleryRequirements(album({ photos: [p], coverId: p.id })),
    {},
  );
  assert.equal(
    galleryFieldsInput.safeParse(album({ photos: [p], coverId: randomUUID() }))
      .success,
    false,
  );
});
test("album dates retain calendar meaning and reject impossible dates or timestamps", () => {
  for (const value of ["", "2028-02-29", "2050-06-01"])
    assert.equal(
      galleryFieldsInput.safeParse(album({ albumDate: value })).success,
      true,
    );
  for (const value of [
    "2026-02-29",
    "2026-04-31",
    "2026-06-01T00:00:00Z",
    "0999-01-01",
  ])
    assert.equal(
      galleryFieldsInput.safeParse(album({ albumDate: value })).success,
      false,
    );
});
test("stable photo IDs differ from generated names, which follow rename/reordering", () => {
  const a = entry(),
    b = entry(),
    f = album({ photos: [a, b], coverId: a.id }),
    renamed = { ...f, title: "Renamed", photos: [b, a] };
  assert.deepEqual(
    renamed.photos.map((p) => p.id),
    [b.id, a.id],
  );
  assert.equal(photoLabel(renamed.title, 0), "Renamed - 1");
  assert.equal(photoLabel(renamed.title, 1), "Renamed - 2");
  assert.equal(
    galleryFieldsInput.safeParse({ ...f, photos: [a, a] }).success,
    false,
  );
  assert.equal(
    galleryFieldsInput.safeParse({
      ...f,
      photos: [a, { ...b, assetId: a.assetId }],
    }).success,
    false,
  );
});
test("caption overrides descriptive alt; generated names never become descriptions", () => {
  assert.equal(
    albumAlt(
      entry({ caption: "Cloud observations", alt: "Unused alternative" }),
    ),
    "Cloud observations",
  );
  assert.equal(
    albumAlt(entry({ alt: "Tripod beside a monitor" })),
    "Tripod beside a monitor",
  );
  assert.equal(albumAlt(entry()), "");
});
test("canonical saved revision comparisons include photos/order/cover/captions and ignore object key ordering", () => {
  const a = entry(),
    b = entry(),
    f = album({ photos: [a, b], coverId: a.id });
  assert.equal(
    galleryFingerprint(f),
    galleryFingerprint(Object.fromEntries(Object.entries(f).reverse())),
  );
  for (const next of [
    { ...f, photos: [b, a] },
    { ...f, coverId: b.id },
    { ...f, title: "Changed" },
    { ...f, photos: [{ ...a, caption: "Changed" }, b] },
  ])
    assert.notEqual(galleryFingerprint(f), galleryFingerprint(next));
});
test("strict field allowlists reject storage keys, URLs, arbitrary status and malformed identities", () => {
  for (const patch of [
    { storageKey: "secret" },
    { url: "https://evil.invalid/x" },
    { status: "published" },
    { eventId: "not-an-id" },
    { displayOrder: -1 },
  ])
    assert.equal(
      galleryFieldsInput.safeParse({ ...album(), ...patch }).success,
      false,
    );
  assert.equal(
    galleryFieldsInput.safeParse(photo({ caption: "x".repeat(501) })).success,
    false,
  );
});
test("public viewer uses caption/empty alt rules, labelled controls and lazy bounded thumbnails", () => {
  const image = {
      id: randomUUID(),
      thumbUrl: "/api/gallery/a/images/b?variant=thumb",
      largeUrl: "/api/gallery/a/images/b?variant=large",
      thumbWidth: 640,
      thumbHeight: 480,
      width: 1600,
      height: 1200,
      bytes: 2000,
    },
    p = {
      id: randomUUID(),
      label: "Synthetic album - 1",
      caption: "",
      alt: "",
      image,
    };
  let html = render(PhotoViewer, {
    photos: [
      p,
      {
        ...p,
        id: randomUUID(),
        label: "Synthetic album - 2",
        caption: "Cloud field",
        alt: "Cloud field",
      },
    ],
  });
  assert.match(html, /alt=""/);
  assert.match(html, /No description was provided/);
  assert.match(html, /Enlarge photograph: Synthetic album - 1/);
  assert.match(html, /alt="Cloud field"/);
  assert.match(html, /loading="lazy"/);
  assert.ok(!html.includes("storageKey"));
  html = render(PhotoViewer, { photos: [p], single: true });
  assert.ok(!html.includes("lg:grid-cols-3"));
  assert.match(html, /loading="lazy"/);
});
