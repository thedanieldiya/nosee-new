"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eventDraftFingerprint, hasUnpublishedEventChanges } from "@/lib/events/content";
import { eventFieldsInput, type EventFields, type EventContent } from "@/lib/events/input";
import { EventFieldsForm } from "./EventFieldsForm";
import { descriptionCount, descriptionLimit } from "@/lib/research/description";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { DeleteEvent } from "./DeleteEvent";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

type Props = { initial: EventFields; id?: string; version?: number; status?: string; requestId: string; published?: EventContent | null; focusSaved?: boolean; slug?: string; coverImage?: string; coverAlt?: string };
type HistoryNavigation = EventTarget & { traverseTo(key: string): unknown };
type HistoryEvent = Event & { navigationType: string; destination: { key: string; url: string; sameDocument: boolean } };
export function EventEditor({ initial, id, version, status = "draft", requestId, published = null, focusSaved = false, slug = "", coverImage = "", coverAlt = "" }: Props) {
  const router = useRouter();
  const baseline = initial;
  const [fields, setFields] = useState<EventFields>(baseline);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState(eventDraftFingerprint(baseline));
  const [leaving, setLeaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null), cancel = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null), submitting = useRef(false), allowLeaving = useRef(false);
  const actionKey = useRef<{ fingerprint: string; id: string } | null>(null), leaveTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => { if (focusSaved) statusRef.current?.focus(); }, [focusSaved]);

  const candidateKey = eventDraftFingerprint(fields);
  const dirty = candidateKey !== savedKey;
  const hasUnpublishedChanges = status === "published" && hasUnpublishedEventChanges({ ...initial, slug, coverImage, coverAlt }, published);
  const overLimit = descriptionCount(fields.body) > descriptionLimit;

  useEffect(() => {
    if (!dirty) return;
    // Window capture catches Next.js sidebar and in-editor links before client navigation.
    const warn = (event: BeforeUnloadEvent) => { if (allowLeaving.current) return; event.preventDefault(); event.returnValue = ""; };
    const internalClick = (event: MouseEvent) => {
      if (allowLeaving.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.getAttribute("target") === "_blank") return;
      const href = new URL(anchor.href, window.location.href);
      if (href.origin !== location.origin || href.href === location.href) return;
      event.preventDefault(); event.stopPropagation();
      leaveTrigger.current = anchor; setLeaving(href.pathname + href.search + href.hash);
    };
    // Cancel reliable same-document traversals without adding synthetic history entries.
    // Other browsers retain native unload protection and the internal-link guard.
    const navigation = (window as Window & { navigation?: HistoryNavigation }).navigation;
    const historyAttempt = (event: Event) => {
      const attempt = event as HistoryEvent;
      if (allowLeaving.current || attempt.navigationType !== "traverse" || !attempt.cancelable || !attempt.destination.sameDocument) return;
      if (new URL(attempt.destination.url).origin !== location.origin) return;
      attempt.preventDefault();
      leaveTrigger.current = null; setLeaving("__history__:" + attempt.destination.key);
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", internalClick, true);
    navigation?.addEventListener("navigate", historyAttempt);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("click", internalClick, true); navigation?.removeEventListener("navigate", historyAttempt); };
  }, [dirty]);

  function navigate(destination: string) {
    allowLeaving.current = true;
    setLeaving(null);
    if (destination.startsWith("__history__:")) (window as Window & { navigation?: HistoryNavigation }).navigation?.traverseTo(destination.slice("__history__:".length));
    else {
      const anchor = leaveTrigger.current;
      // Replay the confirmed link so sidebar menus also finish their normal close action.
      if (anchor instanceof HTMLAnchorElement && anchor.href === new URL(destination, location.href).href) anchor.click();
      else router.push(destination);
      router.refresh();
    }
  }
  async function save(mode: "draft" | "publish", destination?: string) {
    if (submitting.current || !formRef.current?.reportValidity()) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const parsed = eventFieldsInput.safeParse(fields);
      if (!parsed.success) {
        setErrors(Object.fromEntries(parsed.error.issues.map(issue => [issue.path.join("."), issue.message])));
        throw new Error("Check the highlighted fields and schedule before saving.");
      }
      if (mode === "publish") {
        const required: Record<string, string> = {};
        if (!fields.summary.trim()) required.summary = "Add a summary before publishing.";
        if (fields.type !== "meeting" && !fields.organiser.trim()) required.organiser = "Add an organiser before publishing.";
        if (fields.type !== "meeting" && !descriptionCount(fields.body)) required.body = "Add a description before publishing.";
        if (fields.type === "meeting" && !fields.meetingSiteUrl) required.meetingSiteUrl = "Add a meeting-site URL.";
        if (fields.location.type !== "online" && !fields.location.venue.trim()) required["location.venue"] = "Add a venue before publishing.";
        if (fields.location.type !== "physical" && !fields.location.platform.trim()) required["location.platform"] = "Add an online platform before publishing.";
        if (Object.keys(required).length) { setErrors(required); throw new Error("Complete the highlighted fields before publishing."); }
      }
      setErrors({});
      const payloadFields = parsed.data;
      const fingerprint = mode + ":" + (version ?? 0) + ":" + eventDraftFingerprint(payloadFields);
      if (!actionKey.current || actionKey.current.fingerprint !== fingerprint) actionKey.current = { fingerprint, id: crypto.randomUUID() };
      const response = await fetch("/api/admin/events" + (id ? "/" + id : ""), {
        method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: payloadFields, mode, confirm: true, ...(id ? { version, mutationId: actionKey.current.id } : { requestId }) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !/^[0-9a-f-]{36}$/.test(result?.id ?? "")) throw new Error(result?.error || "The save could not be confirmed. Check the latest version before retrying.");
      setSavedKey(eventDraftFingerprint(payloadFields));
      if (result.cacheRefresh === "unconfirmed") adminToast.warning(mode === "publish" ? "Event published" : "Draft saved", "The website cache refresh could not be confirmed.");
      else adminToast.success(mode === "publish" ? "Event published" : "Draft saved");
      actionKey.current = null;
      allowLeaving.current = true;
      navigate(destination ?? "/admin/publishing/events/" + result.id + "?saved=1");
    } catch (failure) {
      const message = failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "The save could not be confirmed. Your content remains in the editor; check the saved version before retrying.";
      setError(message); requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); adminToast.error("Couldn’t save changes");
    } finally { submitting.current = false; setBusy(false); }
  }
  function saveDraft(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("draft"); }
  const state = dirty ? "Unsaved changes" : hasUnpublishedChanges ? "Unpublished changes" : status === "published" ? "Published" : status === "unpublished" ? "Unpublished" : id ? "Draft saved" : "New draft";
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/admin/publishing/events" className="underline underline-offset-4">All events</Link>
      <p ref={statusRef} tabIndex={-1} role="status" className="rounded-sm text-sm text-secondary focus-visible:outline-2 focus-visible:outline-accent">{state}</p>
    </div>
    <form ref={formRef} onSubmit={saveDraft} aria-busy={busy} className="space-y-6">
      <Card><CardHeader><h2 className="font-semibold">Event content</h2><p className="text-secondary">Save a working draft or publish directly. An existing published version stays live until you publish changes.</p></CardHeader>
        <CardContent><fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Event fields</legend>
          <EventFieldsForm initial={initial} fields={fields} setFields={setFields} errors={errors} busy={busy} />
        </fieldset></CardContent></Card>
      {error ? <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy || overLimit || (!!id && !dirty)}>{busy ? "Saving…" : "Save as draft"}</Button>
        <Button type="button" disabled={busy || overLimit} onClick={() => void save("publish")}>{status === "published" ? "Publish changes" : "Publish"}</Button>
        {id && !dirty ? <Button asChild variant="outline"><Link href={"/admin/publishing/events/" + id + "?preview=1"}>Preview saved draft</Link></Button> : null}
        {id && published && !dirty ? <Button asChild variant="outline"><Link href={"/admin/publishing/events/" + id + "?preview=published"}>Published preview</Link></Button> : null}
      </div>
    </form>
    {id && version && status === "published" ? <Card><CardHeader><h2 className="font-semibold">Publication</h2><p className="text-secondary">Unpublishing removes the event from public pages but retains its latest published snapshot.</p></CardHeader><CardContent><ResearchAction endpoint={"/api/admin/events/" + id + "/publication"} payload={{ action: "unpublish", version, mutationId: requestId }} title="Unpublish" description="Remove this event from Events and the homepage. You can publish it again later." disabled={busy || dirty} /></CardContent></Card> : null}
    {id && version ? <DeleteEvent id={id} version={version} title={initial.title} /> : null}
    <Dialog open={leaving !== null} onOpenChange={value => { if (!busy && !value) setLeaving(null); }}>
      <DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); leaveTrigger.current?.focus(); }}>
        <DialogTitle className="text-xl font-semibold">Save your changes?</DialogTitle>
        <DialogDescription className="mt-3 text-secondary">You have unsaved changes.</DialogDescription>
        {error ? <p role="alert" className="mt-4 text-red-800">{error}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Keep editing</Button></DialogClose>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => { if (leaving) navigate(leaving); }}>Discard changes</Button>
          <Button type="button" disabled={busy || overLimit} onClick={() => { if (leaving) void save("draft", leaving); }}>{busy ? "Saving…" : "Save as draft"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
