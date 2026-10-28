// Explicit test adapter; application code never imports this filesystem implementation.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const sha = (b) => createHash("sha256").update(b).digest("hex");
export async function createGalleryTestStorage(root) {
  if (process.env.NODE_ENV !== "test" || process.env.VERCEL)
    throw Error("Test storage requires an isolated non-Vercel test process.");
  const db = new URL(process.env.DATABASE_URL || ""),
    origin = new URL(process.env.ADMIN_ORIGIN || "");
  if (
    db.hostname !== "127.0.0.1" ||
    db.port !== "55433" ||
    db.pathname !== "/nosee_admin01_test" ||
    origin.hostname !== "127.0.0.1"
  )
    throw Error(
      "Test storage requires the guarded loopback fixture environment.",
    );
  if (!path.resolve(root).startsWith("/tmp/nosee-a11-private/"))
    throw Error("Test storage must stay within the private task directory.");
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const dir = await fs.realpath(root);
  if ((await fs.stat(dir)).mode & 0o077)
    throw Error("Test storage must be private.");
  function file(key) {
    if (
      !/^gallery\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/(thumb|large)\.webp$/.test(
        key,
      )
    )
      throw Error("Unsafe test key");
    return path.join(dir, key);
  }
  const adapter = {
    id: "isolated-fs-test-v1",
    writes: 0,
    failWrites: 0,
    beforeRead: null,
    async putPrivate(key, body, meta) {
      if (adapter.failWrites > 0) {
        adapter.failWrites--;
        throw Error("Synthetic storage failure");
      }
      if (
        body.length !== meta.bytes ||
        sha(body) !== meta.sha256 ||
        meta.contentType !== "image/webp"
      )
        throw Error("Invalid immutable write");
      const f = file(key);
      await fs.mkdir(path.dirname(f), { recursive: true, mode: 0o700 });
      try {
        await fs.writeFile(f, body, { flag: "wx", mode: 0o600 });
        adapter.writes++;
      } catch (e) {
        if (e.code !== "EEXIST") throw e;
        const existing = await fs.readFile(f);
        if (sha(existing) !== meta.sha256)
          throw Error("Immutable object conflict");
      }
    },
    async statPrivate(key) {
      try {
        const b = await fs.readFile(file(key));
        return { bytes: b.length, sha256: sha(b), contentType: "image/webp" };
      } catch (e) {
        if (e.code === "ENOENT") return null;
        throw e;
      }
    },
    async readPrivate(key, maxBytes) {
      if (adapter.beforeRead) await adapter.beforeRead();
      const f = file(key),
        stat = await fs.stat(f);
      if (stat.size > maxBytes) throw Error("Object too large");
      return new Uint8Array(await fs.readFile(f));
    },
  };
  return adapter;
}
