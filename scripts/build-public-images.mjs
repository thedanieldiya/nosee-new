import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";
import { publicImageWidths } from "../src/lib/content/public-images.ts";

// Sharp is already installed by Next; no image work runs on public requests.
const root = new URL("../public/", import.meta.url);
sharp.concurrency(2);
await mkdir(new URL("media/optimized/", root), { recursive: true });
for (const [src, widths] of Object.entries(publicImageWidths)) {
  const input = new URL(src.slice(1), root), metadata = await sharp(input.pathname).metadata();
  const name = src.split("/").at(-1).replace(/\.[^.]+$/, "");
  for (const width of widths) {
    assert.ok(width <= metadata.width, `${src}: no upscaling`);
    assert.ok(Number.isInteger(width * metadata.height / metadata.width), `${src}: preserve exact aspect ratio`);
    for (const format of ["avif", "webp"]) {
      const file = new URL(`media/optimized/${name}-${width}.${format}`, root);
      const image = sharp(input.pathname).resize({ width }).keepIccProfile();
      if (format === "avif") image.avif({ quality: 90, chromaSubsampling: "4:4:4", effort: 6 });
      else image.webp(src.endsWith(".jpg") ? { quality: 95, effort: 6 } : { lossless: true, effort: 6 });
      const result = await image.toFile(file.pathname);
      console.log(`${name}-${width}.${format}: ${result.size} bytes`);
    }
  }
}
