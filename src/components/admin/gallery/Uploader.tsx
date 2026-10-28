"use client";
/* eslint-disable @next/next/no-img-element -- Local object previews are distinct from protected persisted images. */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { maxBatchFiles, maxImageBytes, imageTypes } from "@/lib/media/contract";
import type { MediaImage } from "@/lib/media/contract";
type Row = {
  key: string;
  file: File;
  url: string;
  requestId: string;
  uploadId?: string;
  status: "local" | "uploading" | "ready" | "failed";
  progress: number;
  error?: string;
};
export function Uploader({
  recordId,
  single,
  busy,
  onAttach,
  onPending,
  onLocalChange,
  capacity = 100,
}: {
  recordId: string;
  single: boolean;
  busy: boolean;
  onAttach: (v: MediaImage) => void;
  onPending: (value: boolean) => void;
  onLocalChange: (value: boolean) => void;
  capacity?: number;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [configured, setConfigured] = useState<boolean | null>(null),
    [message, setMessage] = useState(""),
    [activeCount, setActiveCount] = useState(0),
    input = useRef<HTMLInputElement>(null),
    urls = useRef(new Set<string>()),
    active = useRef(0),
    attached = useRef(new Set<string>()),
    controllers = useRef(new Set<AbortController>()),
    requests = useRef(new Set<XMLHttpRequest>()),
    mounted = useRef(true),
    latest = useRef(rows),
    callbacks = useRef({ onAttach, onPending, onLocalChange });
  useEffect(() => {
    latest.current = rows;
    callbacks.current = { onAttach, onPending, onLocalChange };
    callbacks.current.onLocalChange(rows.some((r) => r.status !== "ready"));
  });
  useEffect(() => {
    const c = new AbortController();
    void fetch(`/api/admin/gallery/${recordId}/uploads`, { signal: c.signal })
      .then(async (r) => {
        const v = await r.json();
        if (!c.signal.aborted) {
          setConfigured(r.ok && v.configured === true);
          setMessage(v.message || v.error || "Uploads are not configured.");
        }
      })
      .catch(() => {
        if (!c.signal.aborted) {
          setConfigured(false);
          setMessage(
            "Upload availability could not be checked. Reload to retry.",
          );
        }
      });
    return () => c.abort();
  }, [recordId]);
  useEffect(() => {
    const pendingControllers = controllers.current,
      pendingRequests = requests.current,
      objectUrls = urls.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const c of pendingControllers) c.abort();
      for (const r of pendingRequests) r.abort();
      for (const u of objectUrls) URL.revokeObjectURL(u);
    };
  }, []);
  function patch(key: string, value: Partial<Row>) {
    if (mounted.current)
      setRows((old) =>
        old.map((r) => (r.key === key ? { ...r, ...value } : r)),
      );
  }
  function choose(files: FileList | File[] | null) {
    if (!files || busy) return;
    const values = [...files];
    if (
      values.length > Math.min(single ? 1 : maxBatchFiles, capacity) ||
      (!single && latest.current.length + values.length > maxBatchFiles)
    ) {
      setMessage(
        single
          ? "Choose one replacement image at a time."
          : "Choose up to 10 files in this batch.",
      );
      return;
    }
    const next = values.map((file) => {
      const unsupported =
          file.type !== "" &&
          !imageTypes.includes(file.type as (typeof imageTypes)[number]),
        url =
          unsupported || file.size > maxImageBytes
            ? ""
            : URL.createObjectURL(file);
      if (url) urls.current.add(url);
      return {
        key: crypto.randomUUID(),
        file,
        url,
        requestId: crypto.randomUUID(),
        status:
          unsupported || file.size > maxImageBytes
            ? ("failed" as const)
            : ("local" as const),
        progress: 0,
        ...(unsupported
          ? { error: "Use JPEG, PNG, WebP or AVIF images." }
          : file.size > maxImageBytes
            ? { error: "Choose an image within the 4 MB limit." }
            : {}),
      };
    });
    if (single) {
      for (const r of latest.current) {
        if (r.url) {
          URL.revokeObjectURL(r.url);
          urls.current.delete(r.url);
        }
      }
      setRows(next);
    } else setRows((old) => [...old, ...next]);
    if (input.current) input.current.value = "";
  }
  async function json(url: string, body: object, signal?: AbortSignal) {
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      }),
      v = await r.json();
    if (!r.ok)
      throw Error(v.error || "Upload could not be confirmed. Retry this file.");
    return v;
  }
  async function upload(row: Row) {
    if (
      busy ||
      active.current >= 2 ||
      !configured ||
      row.status === "ready" ||
      row.file.size > maxImageBytes
    )
      return;
    const controller = new AbortController();
    controllers.current.add(controller);
    active.current++;
    setActiveCount(active.current);
    callbacks.current.onPending(true);
    patch(row.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const start = await json(
          `/api/admin/gallery/${recordId}/uploads`,
          {
            requestId: row.requestId,
            bytes: row.file.size,
            contentType: row.file.type,
          },
          controller.signal,
        ),
        id = start.id;
      if (controller.signal.aborted || !mounted.current)
        throw Error("Upload cancelled.");
      patch(row.key, { uploadId: id });
      if (!["ready", "staged"].includes(start.state))
        await new Promise<void>((resolve, reject) => {
          const r = new XMLHttpRequest();
          requests.current.add(r);
          r.open("PUT", `/api/admin/gallery/${recordId}/uploads/${id}`);
          r.timeout = 120000;
          r.setRequestHeader("Content-Type", "application/octet-stream");
          r.upload.onprogress = (e) => {
            if (e.lengthComputable)
              patch(row.key, {
                progress: Math.round((e.loaded / e.total) * 100),
              });
          };
          r.onerror = () => {
            requests.current.delete(r);
            reject(Error("Connection interrupted. Retry this file."));
          };
          r.ontimeout = () => {
            requests.current.delete(r);
            reject(Error("Upload timed out. Retry this file."));
          };
          r.onabort = () => {
            requests.current.delete(r);
            reject(Error("Upload cancelled."));
          };
          r.onload = () => {
            requests.current.delete(r);
            if (r.status >= 200 && r.status < 300) resolve();
            else {
              let error = "Upload could not be confirmed. Retry this file.";
              try {
                error = JSON.parse(r.responseText).error || error;
              } catch {}
              reject(Error(error));
            }
          };
          r.send(row.file);
        });
      const result = await json(
        `/api/admin/gallery/${recordId}/uploads/${id}/finalize`,
        { confirm: true },
        controller.signal,
      );
      if (!mounted.current) return;
      if (!attached.current.has(id)) {
        attached.current.add(id);
        callbacks.current.onAttach(result.image);
      }
      patch(row.key, { status: "ready", progress: 100 });
    } catch (e) {
      patch(row.key, {
        status: "failed",
        error:
          e instanceof Error
            ? e.message
            : "Upload could not be confirmed. Retry this file.",
      });
    } finally {
      controllers.current.delete(controller);
      active.current--;
      if (mounted.current) {
        setActiveCount(active.current);
        callbacks.current.onPending(active.current > 0);
      }
    }
  }
  async function uploadAll() {
    const queue = latest.current.filter(
      (r) =>
        r.status === "local" ||
        (r.status === "failed" && r.file.size <= maxImageBytes),
    );
    let position = 0;
    await Promise.all(
      Array.from({ length: Math.min(2, queue.length) }, async () => {
        while (position < queue.length) {
          const row = queue[position++];
          await upload(row);
        }
      }),
    );
  }
  return (
    <section className="space-y-4" aria-labelledby="gallery-upload-heading">
      <h3 id="gallery-upload-heading" className="font-semibold">
        {single ? "Image" : "Add album photos"}
      </h3>
      <p className="text-sm text-secondary">
        JPEG, PNG, WebP or AVIF · up to 4 MB each · 10 files per batch. Local
        previews are not saved images.
      </p>
      <p role="status" className="text-sm text-secondary">
        {configured === null ? "Checking uploads…" : message}
      </p>
      <div
        className="rounded-md border border-dashed border-line-strong p-5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files);
        }}
      >
        <label htmlFor="gallery-image-files" className="block font-medium">
          {single
            ? "Choose an image or drop it here"
            : "Choose images or drop them here"}
        </label>
        <input
          ref={input}
          id="gallery-image-files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
          multiple={!single}
          disabled={busy}
          onChange={(e) => choose(e.target.files)}
          className="mt-3 block max-w-full text-sm file:mr-3 file:min-h-11 file:rounded-md file:border file:border-line-strong file:bg-default file:px-3"
        />
      </div>
      {rows.length > 0 && (
        <>
          <ul className="space-y-4">
            {rows.map((r) => (
              <li
                key={r.key}
                className="flex flex-wrap items-start gap-4 rounded-md border border-line-mild p-3"
              >
                {r.url && (
                  <img
                    src={r.url}
                    alt="Local preview, not yet attached"
                    width={96}
                    height={96}
                    className="size-24 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-medium">{r.file.name}</p>
                  <p className="mt-1 text-sm text-secondary" role="status">
                    {r.status === "ready"
                      ? "Persisted image. Save the draft to keep this attachment."
                      : r.status === "uploading"
                        ? r.progress === 100
                          ? "Processing and verifying private storage…"
                          : `Uploading ${r.progress}%`
                        : r.status === "failed"
                          ? r.error
                          : "Local preview — not uploaded."}
                  </p>
                  {r.status === "uploading" && (
                    <progress
                      className="mt-2 w-full"
                      value={r.progress}
                      max={100}
                      aria-label={"Upload progress for " + r.file.name}
                    />
                  )}
                  {r.error && (
                    <p
                      role="alert"
                      className="mt-2 break-words text-sm text-red-800"
                    >
                      {r.error}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "failed" && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !configured ||
                          busy ||
                          activeCount >= 2 ||
                          r.file.size > maxImageBytes
                        }
                        onClick={() => void upload(r)}
                      >
                        Retry {r.file.name}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy || r.status === "uploading"}
                      onClick={() => {
                        URL.revokeObjectURL(r.url);
                        urls.current.delete(r.url);
                        setRows((old) => old.filter((v) => v.key !== r.key));
                      }}
                    >
                      Remove from batch
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            disabled={
              !configured ||
              busy ||
              activeCount > 0 ||
              !rows.some(
                (r) =>
                  r.status === "local" ||
                  (r.status === "failed" && r.file.size <= maxImageBytes),
              )
            }
            onClick={() => void uploadAll()}
          >
            Upload selected files
          </Button>
        </>
      )}
    </section>
  );
}
