"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteGallery({
  id,
  version,
  title,
}: {
  id: string;
  version: number;
  title: string;
}) {
  const router = useRouter(),
    trigger = useRef<HTMLButtonElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    submitting = useRef(false);
  const mutationId = useRef<string>("");
  const [open, setOpen] = useState(false),
    [phrase, setPhrase] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const required = `Delete ${title}`;
  async function remove() {
    if (submitting.current || phrase !== required) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/gallery/" + id, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrase,
          version,
          confirm: true,
          mutationId: mutationId.current,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.id !== id)
        throw new Error(
          result?.error ||
            "Deletion could not be confirmed. Check the gallery directory before retrying.",
        );
      if (result.cacheRefresh === "unconfirmed")
        adminToast.warning(
          "Gallery item deleted",
          "The website cache refresh could not be confirmed.",
        );
      else adminToast.success("Gallery item deleted");
      setOpen(false);
      router.replace("/admin/website/site-content/gallery");
      router.refresh();
    } catch (failure) {
      const message =
        failure instanceof Error && failure.message !== "Failed to fetch"
          ? failure.message
          : "Deletion could not be confirmed. Check the directory before retrying.";
      setError(message);
      adminToast.error("Couldn’t delete gallery");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="border-t border-line-mild pt-8"
      aria-labelledby="delete-gallery-heading"
    >
      <h2 id="delete-gallery-heading" className="font-semibold">
        Delete Gallery item
      </h2>
      <p className="my-3 text-secondary">
        Deletion removes the gallery from the website. History is retained.
        Linked Events and stored images remain intact.
      </p>
      <Button
        ref={trigger}
        type="button"
        variant="destructive"
        onClick={() => {
          mutationId.current = crypto.randomUUID();
          setPhrase("");
          setError("");
          setOpen(true);
        }}
      >
        Delete Gallery item
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!submitting.current) setOpen(value);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(gallery) => {
            gallery.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(gallery) => {
            gallery.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogTitle className="text-xl font-semibold">
            Delete Gallery item?
          </DialogTitle>
          <DialogDescription className="mt-3 text-secondary">
            This cannot be undone. If published, the gallery will be removed
            from the public website. History is retained and stored images and
            linked Events are retained.
          </DialogDescription>
          <form
            className="mt-5 space-y-5"
            aria-busy={busy}
            onSubmit={(gallery) => {
              gallery.preventDefault();
              void remove();
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="gallery-delete-phrase"
                className="block font-medium"
              >
                To confirm, type “{required}”
              </label>
              <Input
                id="gallery-delete-phrase"
                value={phrase}
                onChange={(gallery) => setPhrase(gallery.target.value)}
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={error ? "gallery-delete-error" : undefined}
              />
            </div>
            {error ? (
              <p
                id="gallery-delete-error"
                role="alert"
                className="text-red-800"
              >
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
              <DialogClose asChild>
                <Button
                  ref={cancel}
                  type="button"
                  variant="outline"
                  disabled={busy}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || phrase !== required}
              >
                {busy ? "Deleting…" : "Delete Gallery item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
