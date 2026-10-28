import { z } from "zod";
import { canonicalContentFingerprint } from "../news/draft-state.ts";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v),
      "Use printable text.",
    );
export const albumPhotoInput = z
  .object({
    id: z.uuid(),
    assetId: z.uuid(),
    caption: text(500),
    alt: text(500),
  })
  .strict();
export const photoFieldsInput = z
  .object({
    kind: z.literal("photo"),
    caption: text(500).min(1, "Add a caption. It is also the image alt text."),
    assetId: z.uuid().nullable(),
    displayOrder: z.number().int().min(0).max(9999),
  })
  .strict();
export const albumFieldsInput = z
  .object({
    kind: z.literal("album"),
    title: text(200).min(1, "Add an album name."),
    description: text(3000),
    eventId: z.uuid().nullable(),
    albumDate: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d\d-\d\d$/.test(v) &&
            Number(v.slice(0, 4)) >= 1000 &&
            Number.isFinite(Date.parse(v + "T12:00:00Z")) &&
            new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v),
        "Use a real YYYY-MM-DD calendar date.",
      ),
    coverId: z.uuid().nullable(),
    photos: z.array(albumPhotoInput).max(100),
    displayOrder: z.number().int().min(0).max(9999),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      new Set(v.photos.map((p) => p.id)).size !== v.photos.length ||
      new Set(v.photos.map((p) => p.assetId)).size !== v.photos.length
    )
      c.addIssue({
        code: "custom",
        path: ["photos"],
        message: "Attach each photo once, with a stable unique ID.",
      });
    if (v.coverId && !v.photos.some((p) => p.id === v.coverId))
      c.addIssue({
        code: "custom",
        path: ["coverId"],
        message: "Choose a cover from this album’s photos.",
      });
  });
export const galleryFieldsInput = z.discriminatedUnion("kind", [
  photoFieldsInput,
  albumFieldsInput,
]);
export type GalleryFields = z.infer<typeof galleryFieldsInput>;
export type AlbumFields = z.infer<typeof albumFieldsInput>;
export type PhotoFields = z.infer<typeof photoFieldsInput>;
export const emptyGallery = (kind: "photo" | "album"): GalleryFields =>
  kind === "photo"
    ? { kind, caption: "", assetId: null, displayOrder: 0 }
    : {
        kind,
        title: "",
        description: "",
        eventId: null,
        albumDate: "",
        coverId: null,
        photos: [],
        displayOrder: 0,
      };
export const galleryTitle = (f: GalleryFields) =>
  f.kind === "photo" ? f.caption : f.title;
export const photoLabel = (name: string, index: number) =>
  `${name} - ${index + 1}`;
export const albumAlt = (p: z.infer<typeof albumPhotoInput>) =>
  p.caption || p.alt;
export const assetIds = (f: GalleryFields) =>
  f.kind === "photo"
    ? f.assetId
      ? [f.assetId]
      : []
    : f.photos.map((p) => p.assetId);
export const galleryFingerprint = (f: GalleryFields) =>
  canonicalContentFingerprint(f);
export const galleryRequirements = (
  f: GalleryFields,
): Record<string, string> =>
  f.kind === "photo"
    ? f.assetId
      ? {}
      : { assetId: "Upload and finalize a validated image before publishing." }
    : !f.photos.length
      ? { photos: "Add at least one persisted photo before publishing." }
      : !f.coverId
        ? { coverId: "Choose a cover from the album’s photos." }
        : {};
const mutation = {
  version: z.number().int().min(0),
  mutationId: z.uuid(),
  confirm: z.literal(true),
};
export const gallerySaveInput = z
  .object({
    ...mutation,
    fields: galleryFieldsInput,
    mode: z.enum(["draft", "publish"]),
  })
  .strict();
export const galleryStateInput = z
  .object({ ...mutation, action: z.enum(["publish", "unpublish"]) })
  .strict();
export const galleryDeleteInput = z
  .object({ ...mutation, phrase: text(600) })
  .strict();
export const galleryQuery = z
  .object({
    q: text(120).default(""),
    kind: z.enum(["", "photo", "album"]).default(""),
    status: z.enum(["", "draft", "published", "unpublished"]).default(""),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .strict();
export const publicGalleryQuery = galleryQuery.omit({ status: true });
