"use client";
/* eslint-disable @next/next/no-img-element -- Protected persisted image previews. */
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import Up from "@mingcute/react/core-regular/arrow-up";
import Down from "@mingcute/react/core-regular/arrow-down";
import Delete from "@mingcute/react/core-regular/delete-2";
import { Field, Select } from "@/components/admin/ManagementShared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { EventAutocomplete } from "./EventAutocomplete";
import { photoLabel, type GalleryFields } from "@/lib/gallery/input";
import type { MediaImage } from "@/lib/media/contract";
export function GalleryFieldsForm({
  fields: f,
  setFields,
  images,
  errors,
  selectedEvent,
}: {
  fields: GalleryFields;
  setFields: Dispatch<SetStateAction<GalleryFields>>;
  images: MediaImage[];
  errors: Record<string, string>;
  selectedEvent: { id: string; title: string } | null;
}) {
  const [event, setEvent] = useState(selectedEvent),
    [removing, setRemoving] = useState<string | null>(null),
    [announcement, setAnnouncement] = useState(""),
    trigger = useRef<HTMLButtonElement | null>(null),
    cancel = useRef<HTMLButtonElement>(null);
  const map = new Map(images.map((v) => [v.id, v]));
  function move(id: string, delta: number) {
    setFields((cur) => {
      if (cur.kind !== "album") return cur;
      const index = cur.photos.findIndex((p) => p.id === id),
        photos = [...cur.photos];
      if (index < 0 || index + delta < 0 || index + delta >= photos.length)
        return cur;
      [photos[index], photos[index + delta]] = [
        photos[index + delta],
        photos[index],
      ];
      return { ...cur, photos };
    });
    setAnnouncement(
      "Photo order changed. Generated labels now follow the current order.",
    );
  }
  const caption = f.kind === "photo" ? f.caption : "";
  return (
    <div className="space-y-5">
      {f.kind === "photo" ? (
        <>
          <Field id="gallery-caption" label="Caption">
            <Input
              id="gallery-caption"
              value={caption}
              maxLength={500}
              aria-invalid={!!errors.caption}
              aria-describedby={
                errors.caption
                  ? "gallery-caption-error"
                  : "gallery-caption-help"
              }
              onChange={(e) =>
                setFields((cur) =>
                  cur.kind === "photo"
                    ? { ...cur, caption: e.target.value }
                    : cur,
                )
              }
            />
            <p id="gallery-caption-help" className="text-sm text-secondary">
              Required. This same caption is the public image alt text.
            </p>
            {errors.caption && (
              <p id="gallery-caption-error" className="text-sm text-red-800">
                {errors.caption}
              </p>
            )}
          </Field>
          {f.assetId && map.has(f.assetId) ? (
            <img
              src={map.get(f.assetId)!.thumbUrl}
              width={240}
              height={240}
              alt="Persisted working image preview"
              className="max-h-64 max-w-full object-contain"
            />
          ) : (
            <p className="text-sm text-secondary">
              No persisted image is attached.
            </p>
          )}
          {errors.assetId && <p className="text-red-800">{errors.assetId}</p>}
        </>
      ) : (
        <>
          <Field id="gallery-title" label="Album name">
            <Input
              id="gallery-title"
              value={f.title}
              maxLength={200}
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "gallery-title-error" : undefined
              }
              onChange={(e) =>
                setFields((cur) =>
                  cur.kind === "album"
                    ? { ...cur, title: e.target.value }
                    : cur,
                )
              }
            />
            {errors.title && (
              <p id="gallery-title-error" className="text-sm text-red-800">
                {errors.title}
              </p>
            )}
          </Field>
          <Field id="gallery-description" label="Description (optional)">
            <textarea
              id="gallery-description"
              rows={4}
              maxLength={3000}
              value={f.description}
              className="min-h-28 w-full rounded-md border border-line-strong bg-default p-3 focus-visible:outline-2 focus-visible:outline-accent"
              onChange={(e) =>
                setFields((cur) =>
                  cur.kind === "album"
                    ? { ...cur, description: e.target.value }
                    : cur,
                )
              }
            />
          </Field>
          <Field id="gallery-date" label="Album date (optional)">
            <Input
              id="gallery-date"
              type="date"
              value={f.albumDate}
              aria-invalid={!!errors.albumDate}
              aria-describedby={
                errors.albumDate ? "gallery-date-error" : "gallery-date-help"
              }
              onChange={(e) =>
                setFields((cur) =>
                  cur.kind === "album"
                    ? { ...cur, albumDate: e.target.value }
                    : cur,
                )
              }
            />
            <p id="gallery-date-help" className="text-xs text-secondary">
              A calendar date, independent of WAT system timestamps.
            </p>
            {errors.albumDate && (
              <p id="gallery-date-error" className="text-red-800">
                {errors.albumDate}
              </p>
            )}
          </Field>
          <EventAutocomplete
            selected={event}
            onSelect={(v) => {
              setEvent(v);
              setFields((cur) =>
                cur.kind === "album" ? { ...cur, eventId: v?.id ?? null } : cur,
              );
            }}
          />
          {f.eventId && !event && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFields((cur) =>
                  cur.kind === "album" ? { ...cur, eventId: null } : cur,
                )
              }
            >
              Clear unavailable Event
            </Button>
          )}
          <Field id="gallery-cover" label="Album cover">
            <Select
              id="gallery-cover"
              value={f.coverId ?? ""}
              aria-invalid={!!errors.coverId}
              onChange={(e) =>
                setFields((cur) =>
                  cur.kind === "album"
                    ? { ...cur, coverId: e.target.value || null }
                    : cur,
                )
              }
              disabled={!f.photos.length}
            >
              <option value="">Choose from this album’s uploaded photos</option>
              {f.photos.map((p, i) => (
                <option key={p.id} value={p.id}>
                  {photoLabel(f.title || "Album", i)}
                </option>
              ))}
            </Select>
            {errors.coverId && <p className="text-red-800">{errors.coverId}</p>}
          </Field>
          <p className="text-sm text-secondary">
            Names follow the album name and current order. Photo IDs remain
            stable. Captions are optional; a caption overrides descriptive alt
            text. Without either, the viewer announces that no description was
            provided.
          </p>
          <p role="status" className="sr-only">
            {announcement}
          </p>
          {errors.photos && <p className="text-red-800">{errors.photos}</p>}
          <ol className="space-y-5">
            {f.photos.map((p, i) => (
              <li
                key={p.id}
                className="space-y-4 rounded-md border border-line-mild p-4"
              >
                <h3 className="break-words font-medium">
                  {photoLabel(f.title || "Album", i)}
                </h3>
                {map.has(p.assetId) && (
                  <img
                    src={map.get(p.assetId)!.thumbUrl}
                    width={200}
                    height={200}
                    alt="Persisted working album photo"
                    loading="lazy"
                    className="max-h-48 max-w-full object-contain"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    aria-label={"Move up: photo " + (i + 1)}
                    disabled={i === 0}
                    onClick={() => move(p.id, -1)}
                  >
                    <Up size={18} color="currentColor" aria-hidden="true" />
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    aria-label={"Move down: photo " + (i + 1)}
                    disabled={i === f.photos.length - 1}
                    onClick={() => move(p.id, 1)}
                  >
                    <Down size={18} color="currentColor" aria-hidden="true" />
                    Move down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-11 p-0"
                    aria-label={"Remove photo " + (i + 1)}
                    onClick={(e) => {
                      trigger.current = e.currentTarget;
                      setRemoving(p.id);
                    }}
                  >
                    <Delete size={20} color="currentColor" aria-hidden="true" />
                  </Button>
                </div>
                <Field
                  id={"gallery-photo-caption-" + p.id}
                  label="Photo caption (optional)"
                >
                  <Input
                    id={"gallery-photo-caption-" + p.id}
                    value={p.caption}
                    maxLength={500}
                    onChange={(e) =>
                      setFields((cur) =>
                        cur.kind === "album"
                          ? {
                              ...cur,
                              photos: cur.photos.map((v) =>
                                v.id === p.id
                                  ? { ...v, caption: e.target.value }
                                  : v,
                              ),
                            }
                          : cur,
                      )
                    }
                  />
                </Field>
                <Field
                  id={"gallery-photo-alt-" + p.id}
                  label="Descriptive alt text (optional)"
                >
                  <Input
                    id={"gallery-photo-alt-" + p.id}
                    value={p.alt}
                    disabled={!!p.caption}
                    maxLength={500}
                    aria-describedby={"gallery-photo-alt-help-" + p.id}
                    onChange={(e) =>
                      setFields((cur) =>
                        cur.kind === "album"
                          ? {
                              ...cur,
                              photos: cur.photos.map((v) =>
                                v.id === p.id
                                  ? { ...v, alt: e.target.value }
                                  : v,
                              ),
                            }
                          : cur,
                      )
                    }
                  />
                  <p
                    id={"gallery-photo-alt-help-" + p.id}
                    className="text-xs text-secondary"
                  >
                    {p.caption
                      ? "The caption is used as alt text."
                      : "Describe the photo if you can. Its generated name is not a description."}
                  </p>
                </Field>
              </li>
            ))}
          </ol>
        </>
      )}
      <Field id="gallery-order" label="Display order">
        <Input
          id="gallery-order"
          type="number"
          min={0}
          max={9999}
          value={f.displayOrder}
          onChange={(e) =>
            setFields((cur) => ({
              ...cur,
              displayOrder: Number(e.target.value),
            }))
          }
        />
      </Field>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (trigger.current?.isConnected) trigger.current.focus();
            else document.getElementById("gallery-image-files")?.focus();
          }}
        >
          <DialogTitle>Remove photo from working album?</DialogTitle>
          <DialogDescription className="mt-3">
            The published snapshot stays unchanged. Stored images are retained.
            If this is the cover, the first remaining photo becomes the working
            cover.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-3">
            <DialogClose asChild>
              <Button ref={cancel} type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setFields((cur) => {
                  if (cur.kind !== "album") return cur;
                  const photos = cur.photos.filter((v) => v.id !== removing);
                  return {
                    ...cur,
                    photos,
                    coverId:
                      cur.coverId === removing
                        ? (photos[0]?.id ?? null)
                        : cur.coverId,
                  };
                });
                setRemoving(null);
                setAnnouncement("Photo removed from the working album.");
              }}
            >
              Remove photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
