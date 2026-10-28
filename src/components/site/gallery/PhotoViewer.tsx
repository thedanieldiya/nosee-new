"use client";
/* eslint-disable @next/next/no-img-element -- Authorized private-origin variants; no permanent public object URLs. */
import { useRef, useState } from "react";
import Close from "@mingcute/react/core-regular/close";
import Left from "@mingcute/react/core-regular/arrow-left";
import Right from "@mingcute/react/core-regular/arrow-right";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicPhoto } from "@/lib/gallery/public";
export function PhotoViewer({
  photos,
  single = false,
}: {
  photos: PublicPhoto[];
  single?: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null),
    opener = useRef<HTMLButtonElement | null>(null),
    close = useRef<HTMLButtonElement>(null),
    p = index === null ? null : photos[index];
  return (
    <>
      <div className={single ? "" : "grid gap-8 sm:grid-cols-2 lg:grid-cols-3"}>
        {photos.map((photo, i) => (
          <figure key={photo.id} className="min-w-0">
            <button
              type="button"
              className="block w-full overflow-hidden bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              aria-label={"Enlarge photograph: " + photo.label}
              aria-describedby={
                !photo.alt ? "photo-fallback-" + photo.id : undefined
              }
              onClick={(e) => {
                opener.current = e.currentTarget;
                setIndex(i);
              }}
            >
              <img
                src={photo.image.thumbUrl}
                alt={photo.alt}
                width={photo.image.thumbWidth}
                height={photo.image.thumbHeight}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
            {!photo.alt && (
              <p id={"photo-fallback-" + photo.id} className="sr-only">
                No description was provided for this photograph.
              </p>
            )}
            <figcaption className="mt-3 break-words text-sm leading-6 text-secondary">
              <p className="font-medium text-primary">{photo.label}</p>
              {photo.caption && photo.caption !== photo.label && (
                <p className="mt-1">{photo.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
      <Dialog
        open={p !== null}
        onOpenChange={(open) => {
          if (!open) setIndex(null);
        }}
      >
        <DialogContent
          className="max-w-5xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            close.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" && index !== null && index > 0) {
              e.preventDefault();
              setIndex(index - 1);
            }
            if (
              e.key === "ArrowRight" &&
              index !== null &&
              index < photos.length - 1
            ) {
              e.preventDefault();
              setIndex(index + 1);
            }
          }}
        >
          {p && (
            <>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="break-words text-xl font-semibold">
                  {p.label}
                </DialogTitle>
                <Button
                  ref={close}
                  type="button"
                  variant="ghost"
                  className="size-11 shrink-0 p-0"
                  aria-label="Close photograph"
                  onClick={() => setIndex(null)}
                >
                  <Close size={22} color="currentColor" aria-hidden="true" />
                </Button>
              </div>
              <DialogDescription className="mt-2 text-sm text-secondary">
                {p.caption ||
                  p.alt ||
                  "No description was provided for this photograph."}
              </DialogDescription>
              <img
                src={p.image.largeUrl}
                srcSet={
                  p.image.width > p.image.thumbWidth
                    ? `${p.image.thumbUrl} ${p.image.thumbWidth}w, ${p.image.largeUrl} ${p.image.width}w`
                    : undefined
                }
                sizes="(min-width: 1024px) 960px, calc(100vw - 5rem)"
                alt={p.alt}
                width={p.image.width}
                height={p.image.height}
                className="mt-5 max-h-[60dvh] w-full object-contain"
              />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => setIndex((v) => (v === null ? v : v - 1))}
                >
                  <Left size={18} color="currentColor" aria-hidden="true" />
                  Previous photograph
                </Button>
                <p role="status" className="text-sm text-secondary">
                  Photograph {(index ?? 0) + 1} of {photos.length} on this page
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === photos.length - 1}
                  onClick={() => setIndex((v) => (v === null ? v : v + 1))}
                >
                  Next photograph
                  <Right size={18} color="currentColor" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
