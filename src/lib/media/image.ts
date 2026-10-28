import sharp from "sharp";
import { createHash } from "node:crypto";
import { ManagementError } from "../admin/errors.ts";
import { maxImageBytes } from "./contract.ts";
export { maxImageBytes, maxBatchFiles, imageTypes } from "./contract.ts";
export const digest = (body: Uint8Array) =>
  createHash("sha256").update(body).digest("hex");
function byteType(b: Uint8Array) {
  const v = Buffer.from(b);
  if (v.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    return "image/jpeg";
  if (v.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (
    v.toString("ascii", 0, 4) === "RIFF" &&
    v.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (
    v.toString("ascii", 4, 8) === "ftyp" &&
    /avif|avis/.test(v.toString("ascii", 8, 48))
  )
    return "image/avif";
  return null;
}
export async function processImage(body: Uint8Array, hint = "") {
  if (!body.length || body.length > maxImageBytes)
    throw new ManagementError("Choose an image within the 4 MB limit.", 413);
  const mime = byteType(body);
  if (!mime || (hint && hint !== mime))
    throw new ManagementError(
      "Use valid JPEG, PNG, WebP or AVIF image bytes matching the file type.",
    );
  try {
    const image = sharp(body, {
        limitInputPixels: 40000000,
        failOn: "warning",
        animated: false,
      }),
      meta = await image.metadata();
    if (
      !meta.width ||
      !meta.height ||
      meta.width > 12000 ||
      meta.height > 12000 ||
      (meta.pages ?? 1) > 1 ||
      !(
        {
          "image/jpeg": ["jpeg"],
          "image/png": ["png"],
          "image/webp": ["webp"],
          "image/avif": ["heif", "avif"],
        }[mime] ?? []
      ).includes(meta.format ?? "") ||
      (mime === "image/avif" && meta.compression !== "av1")
    )
      throw Error();
    // Re-encoding applies orientation and drops EXIF/GPS, filenames and other source metadata.
    const large = await image
      .clone()
      .timeout({ seconds: 10 })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 3 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await sharp(large.data)
      .timeout({ seconds: 10 })
      .resize({
        width: 640,
        height: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78, effort: 3 })
      .toBuffer({ resolveWithObject: true });
    const variants = [
      ["thumb", thumb],
      ["large", large],
    ].map(([name, result]) => {
      const r = result as typeof large;
      return {
        name: String(name),
        body: r.data,
        width: r.info.width,
        height: r.info.height,
        bytes: r.data.byteLength,
        sha256: digest(r.data),
        contentType: "image/webp" as const,
      };
    });
    if (variants.some(v => v.bytes > maxImageBytes)) throw new ManagementError("The processed image exceeds the delivery limit. Choose a smaller image.", 413);
    return { rawSha256: digest(body), variants };
  } catch (e) {
    if (e instanceof ManagementError) throw e;
    throw new ManagementError(
      "This image cannot be decoded safely. Use a static image within 12,000 pixels per side and 40 megapixels.",
    );
  }
}
export async function readImageBody(request: Request, timeoutMs = 60000) {
  const length = Number(request.headers.get("content-length"));
  if (length > maxImageBytes)
    throw new ManagementError("Choose an image within the 4 MB limit.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ManagementError("Choose an image.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const timeout = new Promise<never>((_, reject) => {
    const t = setTimeout(() => {
      void reader.cancel();
      reject(new ManagementError("Upload timed out. Retry the file.", 408));
    }, timeoutMs);
    timers.push(t);
  });
  try {
    return await Promise.race([
      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > maxImageBytes) {
            await reader.cancel();
            throw new ManagementError(
              "Choose an image within the 4 MB limit.",
              413,
            );
          }
          chunks.push(value);
        }
        return Buffer.concat(chunks);
      })(),
      timeout,
    ]);
  } finally {
    for (const t of timers) clearTimeout(t);
  }
}
