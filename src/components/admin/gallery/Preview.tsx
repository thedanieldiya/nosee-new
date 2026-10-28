/* eslint-disable @next/next/no-img-element -- Protected saved previews. */
import {
  galleryTitle,
  photoLabel,
  albumAlt,
  type GalleryFields,
} from "@/lib/gallery/input";
import type { MediaImage } from "@/lib/media/contract";
export function GalleryPreview({
  fields,
  images,
}: {
  fields: GalleryFields;
  images: MediaImage[];
}) {
  const map = new Map(images.map((v) => [v.id, v]));
  return (
    <article className="space-y-6">
      <h2 className="break-words text-2xl font-semibold">
        {galleryTitle(fields)}
      </h2>
      {fields.kind === "album" && (
        <>
          <p className="whitespace-pre-line break-words text-secondary">
            {fields.description}
          </p>
          {fields.albumDate && (
            <time dateTime={fields.albumDate}>{fields.albumDate}</time>
          )}
        </>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {(fields.kind === "album"
          ? fields.photos.map((p, i) => ({
              id: p.id,
              assetId: p.assetId,
              label: photoLabel(fields.title, i),
              alt: albumAlt(p),
            }))
          : fields.assetId
            ? [
                {
                  id: fields.assetId,
                  assetId: fields.assetId,
                  label: fields.caption,
                  alt: fields.caption,
                },
              ]
            : []
        ).map((p) => {
          const image = map.get(p.assetId);
          return (
            <figure key={p.id}>
              {image ? (
                <img
                  src={image.thumbUrl}
                  alt={p.alt}
                  width={image.thumbWidth}
                  height={image.thumbHeight}
                  className="max-h-96 w-full object-contain"
                />
              ) : (
                <p className="bg-surface p-6 text-secondary">
                  Image unavailable.
                </p>
              )}
              <figcaption className="mt-3 break-words text-sm">
                {p.label}
              </figcaption>
              {!p.alt && (
                <p className="text-sm text-secondary">
                  No description was provided.
                </p>
              )}
            </figure>
          );
        })}
      </div>
      {!images.length && (
        <p className="text-secondary">
          No persisted images are attached. This item cannot be published yet.
        </p>
      )}
    </article>
  );
}
