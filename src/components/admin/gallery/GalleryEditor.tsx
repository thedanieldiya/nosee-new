"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  galleryFieldsInput,
  galleryFingerprint,
  galleryRequirements,
  galleryTitle,
  type GalleryFields,
} from "@/lib/gallery/input";
import type { MediaImage } from "@/lib/media/contract";
import { GalleryFieldsForm } from "./Fields";
import { Uploader } from "./Uploader";
import { DeleteGallery } from "./DeleteGallery";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
type HistoryNavigation = EventTarget & { traverseTo(key: string): unknown };
type HistoryEvent = Event & {
  navigationType: string;
  destination: { key: string; url: string; sameDocument: boolean };
};

export function GalleryEditor({
  initial,
  id,
  version = 0,
  status = "draft",
  published = null,
  requestId,
  initialImages = [],
  selectedEvent = null,
  uploadsConfigured = false,
  focusSaved = false,
}: {
  initial: GalleryFields;
  id?: string;
  version?: number;
  status?: string;
  published?: GalleryFields | null;
  requestId: string;
  initialImages?: MediaImage[];
  selectedEvent?: { id: string; title: string } | null;
  uploadsConfigured?: boolean;
  focusSaved?: boolean;
}) {
  const router = useRouter(),
    [fields, setFields] = useState(initial),
    [images, setImages] = useState(initialImages),
    [savedKey, setSavedKey] = useState(galleryFingerprint(initial)),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [leaving, setLeaving] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uploadPending, setUploadPending] = useState(false),
    [localChanges, setLocalChanges] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    submitting = useRef(false),
    allowLeaving = useRef(false),
    leaveTrigger = useRef<HTMLElement | null>(null),
    actionKey = useRef<{ fingerprint: string; id: string } | null>(null);
  const directory = "/admin/website/site-content/gallery",
    locationPath =
      directory +
      (fields.kind === "photo" ? "/photos/" : "/albums/") +
      (id ?? "new"),
    dirty =
      galleryFingerprint(fields) !== savedKey || localChanges || uploadPending,
    hasUnpublishedChanges =
      status === "published" &&
      !!published &&
      galleryFingerprint(initial) !== galleryFingerprint(published);
  useEffect(() => {
    if (focusSaved) statusRef.current?.focus();
  }, [focusSaved]);
  useEffect(() => {
    if (!dirty) return;
    // Window capture catches Next.js sidebar and in-editor links before client navigation.
    const warn = (event: BeforeUnloadEvent) => {
      if (allowLeaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const internalClick = (event: MouseEvent) => {
      if (
        allowLeaving.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("target") === "_blank"
      )
        return;
      const href = new URL(anchor.href, window.location.href);
      if (href.origin !== location.origin || href.href === location.href)
        return;
      event.preventDefault();
      event.stopPropagation();
      leaveTrigger.current = anchor;
      setLeaving(href.pathname + href.search + href.hash);
    };
    // Cancel reliable same-document traversals without adding synthetic history entries.
    // Other browsers retain native unload protection and the internal-link guard.
    const navigation = (window as Window & { navigation?: HistoryNavigation })
      .navigation;
    const historyAttempt = (event: Event) => {
      const attempt = event as HistoryEvent;
      if (
        allowLeaving.current ||
        attempt.navigationType !== "traverse" ||
        !attempt.cancelable ||
        !attempt.destination.sameDocument
      )
        return;
      if (new URL(attempt.destination.url).origin !== location.origin) return;
      attempt.preventDefault();
      leaveTrigger.current = null;
      setLeaving("__history__:" + attempt.destination.key);
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", internalClick, true);
    navigation?.addEventListener("navigate", historyAttempt);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("click", internalClick, true);
      navigation?.removeEventListener("navigate", historyAttempt);
    };
  }, [dirty]);

  function navigate(destination: string) {
    allowLeaving.current = true;
    setLeaving(null);
    if (destination.startsWith("__history__:"))
      (
        window as Window & { navigation?: HistoryNavigation }
      ).navigation?.traverseTo(destination.slice("__history__:".length));
    else {
      const anchor = leaveTrigger.current;
      // Replay the confirmed link so sidebar menus also finish their normal close action.
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.href === new URL(destination, location.href).href
      )
        anchor.click();
      else router.push(destination);
      router.refresh();
    }
  }

  function attach(image: MediaImage) {
    setImages((old) =>
      old.some((v) => v.id === image.id) ? old : [...old, image],
    );
    const photoId = crypto.randomUUID();
    setFields((cur) =>
      cur.kind === "photo"
        ? { ...cur, assetId: image.id }
        : cur.photos.some((p) => p.assetId === image.id)
          ? cur
          : {
              ...cur,
              photos: [
                ...cur.photos,
                { id: photoId, assetId: image.id, caption: "", alt: "" },
              ],
              coverId: cur.coverId ?? photoId,
            },
    );
  }
  async function save(mode: "draft" | "publish", destination?: string) {
    if (
      submitting.current ||
      uploadPending ||
      !formRef.current?.reportValidity()
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const parsed = galleryFieldsInput.safeParse(fields);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((i) => [i.path.join("."), i.message]),
          ),
        );
        throw Error("Check the highlighted fields before saving.");
      }
      if (mode === "publish") {
        const required = galleryRequirements(parsed.data);
        if (Object.keys(required).length) {
          setErrors(required);
          throw Error("Complete the highlighted fields before publishing.");
        }
      }
      setErrors({});
      const key = mode + ":" + version + ":" + galleryFingerprint(parsed.data);
      if (!actionKey.current || actionKey.current.fingerprint !== key)
        actionKey.current = { fingerprint: key, id: crypto.randomUUID() };
      const r = await fetch("/api/admin/gallery" + (id ? "/" + id : ""), {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: parsed.data,
            mode,
            version,
            mutationId: id ? actionKey.current.id : requestId,
            confirm: true,
          }),
        }),
        v = await r.json().catch(() => null);
      if (!r.ok || !v?.id)
        throw Error(
          v?.error ||
            "The save could not be confirmed. Review the latest saved version before retrying.",
        );
      setSavedKey(galleryFingerprint(parsed.data));
      const title =
        mode === "publish" ? "Gallery item published" : "Draft saved";
      if (v.cacheRefresh === "unconfirmed")
        adminToast.warning(
          title,
          "The public cache refresh could not be confirmed.",
        );
      else adminToast.success(title);
      navigate(
        destination ??
          directory +
            (fields.kind === "photo" ? "/photos/" : "/albums/") +
            v.id +
            "?saved=1",
      );
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : "The save could not be confirmed. Your edits remain here; check the saved version before retrying.",
      );
      adminToast.error("Couldn’t save changes");
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void save("draft");
  }
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        <Link href={directory} className="underline">
          All Gallery items
        </Link>
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="text-sm text-secondary"
        >
          {uploadPending
            ? "Uploading files…"
            : dirty
              ? "Unsaved changes"
              : hasUnpublishedChanges
                ? "Unpublished changes"
                : version === 0
                  ? "New draft"
                  : status === "published"
                    ? "Published"
                    : status === "unpublished"
                      ? "Unpublished"
                      : "Draft saved"}
        </p>
      </div>
      {!uploadsConfigured && (
        <p
          role="status"
          className="rounded-md border border-line-mild p-4 text-secondary"
        >
          Uploads are not configured. Metadata drafts can be saved; publication
          requires validated images in durable private storage.
        </p>
      )}
      <form
        ref={formRef}
        onSubmit={submit}
        className="space-y-6"
        aria-busy={busy}
      >
        <Card>
          <CardHeader>
            <h2 className="font-semibold">
              {fields.kind === "photo"
                ? "Standalone photograph"
                : "Album content"}
            </h2>
            <p className="text-secondary">
              Save a working draft or publish current fields. Draft image, order
              and caption changes leave the live snapshot unchanged.
            </p>
          </CardHeader>
          <CardContent>
            <fieldset disabled={busy} className="space-y-5">
              <legend className="sr-only">Gallery fields</legend>
              <GalleryFieldsForm
                fields={fields}
                setFields={setFields}
                images={images}
                errors={errors}
                selectedEvent={selectedEvent}
              />
            </fieldset>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            {id ? (
              <Uploader
                recordId={id}
                single={fields.kind === "photo"}
                capacity={
                  fields.kind === "album" ? 100 - fields.photos.length : 1
                }
                busy={busy || uploadPending}
                onAttach={attach}
                onPending={setUploadPending}
                onLocalChange={setLocalChanges}
              />
            ) : (
              <p className="text-secondary">
                {fields.kind === "photo"
                  ? "Save the caption as a draft to add an image."
                  : "Save the album name as a draft to add images."}
              </p>
            )}
          </CardContent>
        </Card>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-4 text-red-900"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy || uploadPending || (version > 0 && !dirty)}
          >
            {busy ? "Saving…" : "Save as draft"}
          </Button>
          <Button
            type="button"
            disabled={busy || uploadPending}
            onClick={() => void save("publish")}
          >
            {status === "published" ? "Publish changes" : "Publish"}
          </Button>
          {id && (
            <Button asChild variant="outline">
              <Link href={locationPath + "?preview=1"}>
                Preview saved draft
              </Link>
            </Button>
          )}
        </div>
      </form>
      {id && status === "published" && (
        <ResearchAction
          endpoint={"/api/admin/gallery/" + id + "/publication"}
          payload={{ action: "unpublish", version }}
          title="Unpublish"
          description="Remove this Gallery item and its image delivery from public eligibility while retaining its working copy and stored images."
          disabled={busy || dirty}
        />
      )}
      {id && (
        <DeleteGallery
          id={id}
          version={version}
          title={galleryTitle(initial)}
        />
      )}
      <Dialog
        open={leaving !== null}
        onOpenChange={(open) => {
          if (!busy && !open) setLeaving(null);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            leaveTrigger.current?.focus();
          }}
        >
          <DialogTitle>Save your changes?</DialogTitle>
          <DialogDescription className="mt-3">
            {uploadPending
              ? "Uploads are still in progress. Keep editing to wait, or discard to leave."
              : localChanges
                ? "Local previews are not uploaded. Saving keeps metadata and completed uploads only."
                : "You have unsaved changes."}
          </DialogDescription>
          {error && (
            <p role="alert" className="mt-4 text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button
                ref={cancel}
                type="button"
                variant="outline"
                disabled={busy}
              >
                Keep editing
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (leaving) navigate(leaving);
              }}
            >
              Discard changes
            </Button>
            <Button
              type="button"
              disabled={busy || uploadPending}
              onClick={() => {
                if (leaving) void save("draft", leaving);
              }}
            >
              Save as draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
