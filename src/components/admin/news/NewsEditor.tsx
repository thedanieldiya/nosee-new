"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { newsCategories, editableNewsFields, type NewsFields } from "@/lib/news/options";
import { editorialZones } from "@/lib/news/input";
import { draftFingerprint, hasUnpublishedNewsChanges } from "@/lib/news/draft-state";
import { editorialInstant, editorialLocal, editorialZone } from "@/lib/timezones";
import { descriptionCount, descriptionLimit } from "@/lib/research/description";
import { newsCategoryLabel } from "@/lib/content/homepage-selections";
import { DescriptionEditor } from "@/components/admin/research/DescriptionEditor";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { DeleteArticle } from "@/components/admin/news/DeleteArticle";
import { adminToast } from "@/components/admin/AdminToasts";
import { Field, Select } from "@/components/admin/ManagementShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

type Props = { initial: NewsFields; id?: string; version?: number; status?: string; requestId: string; published?: NewsFields | null; focusSaved?: boolean };
type HistoryNavigation = EventTarget & { traverseTo(key: string): unknown };
type HistoryEvent = Event & { navigationType: string; destination: { key: string; url: string; sameDocument: boolean } };
export function NewsEditor({ initial, id, version, status = "draft", requestId, published = null, focusSaved = false }: Props) {
  const router = useRouter(), timeZone = editorialZone(initial.publicationTimezone);
  const initialTime = editorialLocal(initial.publicationDate, timeZone);
  const baseline = { ...editableNewsFields(initial), publicationTimezone: timeZone };
  const [fields, setFields] = useState<NewsFields>(baseline);
  const [date, setDate] = useState(initialTime.date), [time, setTime] = useState(initialTime.time);
  const [savedKey, setSavedKey] = useState(draftFingerprint(baseline));
  const [leaving, setLeaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null), cancel = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null), submitting = useRef(false), allowLeaving = useRef(false);
  const actionKey = useRef<{ fingerprint: string; id: string } | null>(null), leaveTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => { if (focusSaved) statusRef.current?.focus(); }, [focusSaved]);

  const zone = editorialZone(fields.publicationTimezone);
  const temporalEdited = date !== initialTime.date || time !== initialTime.time || zone !== timeZone;
  let instant: string;
  try { instant = temporalEdited ? editorialInstant(date, time, zone) : initial.publicationDate; }
  catch { instant = date + " " + time + " " + zone; }
  const candidate = { ...fields, publicationDate: instant, publicationTimezone: zone };
  const candidateKey = draftFingerprint(candidate);
  const dirty = candidateKey !== savedKey;
  const hasUnpublishedChanges = status === "published" && hasUnpublishedNewsChanges(initial, published);
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
      const resolved = temporalEdited ? editorialInstant(date, time, zone) : initial.publicationDate;
      const payloadFields = { ...fields, publicationDate: resolved, publicationTimezone: zone };
      const fingerprint = mode + ":" + (version ?? 0) + ":" + draftFingerprint(payloadFields);
      if (!actionKey.current || actionKey.current.fingerprint !== fingerprint) actionKey.current = { fingerprint, id: crypto.randomUUID() };
      const response = await fetch("/api/admin/news" + (id ? "/" + id : ""), {
        method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: payloadFields, mode, confirm: true, ...(id ? { version, mutationId: actionKey.current.id } : { requestId }) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !/^[0-9a-f-]{36}$/.test(result?.id ?? "")) throw new Error(result?.error || "The save could not be confirmed. Check the latest version before retrying.");
      setSavedKey(draftFingerprint(payloadFields));
      if (result.cacheRefresh === "unconfirmed") adminToast.warning(mode === "publish" ? "Article published" : "Draft saved", "The website cache refresh could not be confirmed.");
      else adminToast.success(mode === "publish" ? "Article published" : "Draft saved");
      actionKey.current = null;
      allowLeaving.current = true;
      navigate(destination ?? "/admin/publishing/news/" + result.id + "?saved=1");
    } catch (failure) {
      const message = failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "The save could not be confirmed. Your content remains in the editor; check the saved version before retrying.";
      setError(message); adminToast.error("Couldn’t save changes");
    } finally { submitting.current = false; setBusy(false); }
  }
  function saveDraft(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save("draft"); }
  const state = dirty ? "Unsaved changes" : hasUnpublishedChanges ? "Unpublished changes" : status === "published" ? "Published" : status === "unpublished" ? "Unpublished" : id ? "Draft saved" : "New draft";
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/admin/publishing/news" className="underline underline-offset-4">All news</Link>
      <p ref={statusRef} tabIndex={-1} role="status" className="rounded-sm text-sm text-secondary focus-visible:outline-2 focus-visible:outline-accent">{state}</p>
    </div>
    <form ref={formRef} onSubmit={saveDraft} aria-busy={busy} className="space-y-6">
      <Card><CardHeader><h2 className="font-semibold">Article content</h2><p className="text-secondary">Save a working draft or publish directly. An existing published version stays live until you publish changes.</p></CardHeader>
        <CardContent><fieldset disabled={busy} className="space-y-5"><legend className="sr-only">News article fields</legend>
          <Field id="news-title" label="Title (required)"><Input id="news-title" required maxLength={160} value={fields.title} onChange={event => setFields(value => ({ ...value, title: event.target.value }))} /></Field>
          <Field id="news-category" label="Category"><Select id="news-category" value={fields.category} onChange={event => setFields(value => ({ ...value, category: event.target.value as NewsFields["category"] }))}>{newsCategories.map(category => <option key={category} value={category}>{newsCategoryLabel(category)}</option>)}</Select></Field>
          <Field id="news-excerpt" label="Short summary"><Textarea id="news-excerpt" maxLength={400} rows={3} value={fields.excerpt} onChange={event => setFields(value => ({ ...value, excerpt: event.target.value }))} /><p className="text-xs text-secondary">Up to 400 characters. A summary is required to publish.</p></Field>
          <DescriptionEditor id="news-body" label="Article body" initial={initial.body} disabled={busy} onChange={body => setFields(value => ({ ...value, body }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="news-date" label="Date"><Input id="news-date" type="date" required value={date} onChange={event => setDate(event.target.value)} /></Field>
            <Field id="news-time" label="Time"><Input id="news-time" type="time" required step={1} value={time} onChange={event => setTime(event.target.value)} /></Field>
          </div>
          <Field id="news-time-zone" label="Time zone"><Select id="news-time-zone" value={zone} onChange={event => setFields(value => ({ ...value, publicationTimezone: event.target.value }))}>
            {editorialZones.map(item => <option key={item} value={item}>{item === "Africa/Lagos" ? "WAT (UTC+01:00) — Africa/Lagos" : item === "UTC" ? "UTC (UTC+00:00)" : item === "Africa/Accra" ? "GMT (UTC+00:00) — Africa/Accra" : item === "Europe/London" ? "Europe/London (seasonal)" : "America/New_York (seasonal)"}</option>)}
          </Select></Field>
          <p className="text-sm text-secondary">Publication date uses the selected time zone. Future dates can be saved as drafts, not published. There is no scheduled publishing.</p>
          <label className="flex items-center gap-3"><input type="checkbox" checked={fields.featured} onChange={event => setFields(value => ({ ...value, featured: event.target.checked }))} className="size-5 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />Featured</label>
          <p className="text-sm text-secondary">Cover uploads are not yet available. You can publish without an image.</p>
        </fieldset></CardContent></Card>
      {error ? <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy || overLimit || (!!id && !dirty)}>{busy ? "Saving…" : "Save as draft"}</Button>
        <Button type="button" disabled={busy || overLimit} onClick={() => void save("publish")}>{status === "published" ? "Publish changes" : "Publish"}</Button>
        {id && !dirty ? <Button asChild variant="outline"><Link href={"/admin/publishing/news/" + id + "?preview=1"}>Preview saved draft</Link></Button> : null}
        {id && published && !dirty ? <Button asChild variant="outline"><Link href={"/admin/publishing/news/" + id + "?preview=published"}>Published preview</Link></Button> : null}
      </div>
    </form>
    {id && version && status === "published" ? <Card><CardHeader><h2 className="font-semibold">Publication</h2><p className="text-secondary">Unpublishing removes the article from public pages but retains its latest published snapshot.</p></CardHeader><CardContent><ResearchAction endpoint={"/api/admin/news/" + id + "/publication"} payload={{ action: "unpublish", version, mutationId: requestId }} title="Unpublish" description="Remove this article from News and the homepage. You can publish it again later." disabled={busy || dirty} /></CardContent></Card> : null}
    {id && version ? <DeleteArticle id={id} version={version} title={initial.title} /> : null}
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
