import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  processImage,
  readImageBody,
  maxImageBytes,
} from "../src/lib/media/image.ts";
const create = () =>
  sharp({
    create: {
      width: 40,
      height: 24,
      channels: 3,
      background: { r: 20, g: 110, b: 60 },
    },
  });
test("real JPEG/PNG/WebP/AVIF bytes decode to bounded private WebP variants", async () => {
  for (const [method, mime] of [
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["avif", "image/avif"],
  ]) {
    const body = await create()[method]().toBuffer(),
      result = await processImage(body, mime);
    assert.equal(result.variants.length, 2);
    assert.equal(result.rawSha256.length, 64);
    for (const v of result.variants) {
      assert.equal((await sharp(v.body).metadata()).format, "webp");
      assert.ok(v.width <= 1600 && v.height <= 1600);
      assert.equal(v.bytes, v.body.length);
      assert.ok(v.bytes <= maxImageBytes);
      assert.equal(v.contentType, "image/webp");
    }
  }
});
test("extension/MIME spoofing, SVG/HTML/executable and corrupt image bodies are rejected", async () => {
  const png = await create().png().toBuffer();
  await assert.rejects(processImage(png, "image/jpeg"));
  for (const b of [
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    ),
    Buffer.from("<!doctype html><h1>Not a photograph</h1>"),
    Buffer.from("MZ executable"),
    Buffer.from([255, 216, 255, 0]),
  ])
    await assert.rejects(processImage(b, "image/png"));
});
test("source byte and dimension limits fail safely before publication", async () => {
  await assert.rejects(
    processImage(new Uint8Array(maxImageBytes + 1)),
    (e) => e.status === 413,
  );
  const wide = await sharp({
    create: { width: 12001, height: 1, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(processImage(wide, "image/png"));
});
test("orientation is applied and EXIF/location-capable source metadata is absent from both delivered variants", async () => {
  const source = await create()
    .jpeg()
    .withMetadata({
      orientation: 6,
      exif: { IFD0: { Artist: "Synthetic private metadata" } },
    })
    .toBuffer();
  assert.ok((await sharp(source).metadata()).exif);
  const result = await processImage(source, "image/jpeg");
  for (const v of result.variants) {
    const meta = await sharp(v.body).metadata();
    assert.equal(meta.exif, undefined);
    assert.equal(meta.xmp, undefined);
    assert.equal(meta.iptc, undefined);
    assert.equal(meta.orientation, undefined);
    assert.equal(meta.width, 24);
    assert.equal(meta.height, 40);
  }
});
test("declared and streamed upload size bounds cancel excessive request bodies", async () => {
  await assert.rejects(
    readImageBody(
      new Request("http://localhost/upload", {
        method: "PUT",
        headers: { "content-length": String(maxImageBytes + 1) },
        body: "x",
      }),
    ),
    (e) => e.status === 413,
  );
  let cancelled = false;
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(maxImageBytes));
      c.enqueue(new Uint8Array(1));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readImageBody(
      new Request("http://localhost/upload", {
        method: "PUT",
        body,
        duplex: "half",
      }),
    ),
    (e) => e.status === 413,
  );
  assert.equal(cancelled, true);
});
test("slow upload bodies have a bounded, cancellable timeout", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readImageBody(
      new Request("http://localhost/upload", {
        method: "PUT",
        body,
        duplex: "half",
      }),
      15,
    ),
    (e) => e.status === 408,
  );
  assert.equal(cancelled, true);
});
