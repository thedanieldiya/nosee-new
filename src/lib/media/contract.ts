export const maxImageBytes = 4 * 1024 * 1024,
  maxBatchFiles = 10;
export const imageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type MediaImage = {
  id: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  bytes: number;
  thumbUrl: string;
  largeUrl: string;
};
export function mediaImage(
  r: {
    id: string;
    ownerId: string;
    variants: {
      thumb: { width: number; height: number };
      large: { width: number; height: number; bytes: number };
    } | null;
  },
  isPublic = false,
): MediaImage {
  const v = r.variants!;
  const root = isPublic
    ? `/api/gallery/${r.ownerId}/images/${r.id}`
    : `/api/admin/gallery/${r.ownerId}/images/${r.id}`;
  return {
    id: r.id,
    width: v.large.width,
    height: v.large.height,
    thumbWidth: v.thumb.width,
    thumbHeight: v.thumb.height,
    bytes: v.large.bytes,
    thumbUrl: root + "?variant=thumb",
    largeUrl: root + "?variant=large",
  };
}
