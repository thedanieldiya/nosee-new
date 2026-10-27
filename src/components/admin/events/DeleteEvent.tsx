"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { eventDeletionPhrase } from "@/lib/events/content";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export function DeleteEvent({ id, version, title }: { id: string; version: number; title: string }) {
  const router = useRouter(), trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null), submitting = useRef(false);
  const mutationId = useRef<string>("");
  const [open, setOpen] = useState(false), [phrase, setPhrase] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const required = eventDeletionPhrase(title);
  async function remove() {
    if (submitting.current || phrase !== required) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/events/" + id, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phrase, version, confirm: true, mutationId: mutationId.current }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.id !== id) throw new Error(result?.error || "Deletion could not be confirmed. Check the events directory before retrying.");
      if (result.cacheRefresh === "unconfirmed") adminToast.warning("Event deleted", "The website cache refresh could not be confirmed.");
      else adminToast.success("Event deleted");
      setOpen(false); router.replace("/admin/publishing/events"); router.refresh();
    } catch (failure) {
      const message = failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "Deletion could not be confirmed. Check the directory before retrying.";
      setError(message); adminToast.error("Couldn’t delete event");
    } finally { submitting.current = false; setBusy(false); }
  }
  return <section className="border-t border-line-mild pt-8" aria-labelledby="delete-event-heading">
    <h2 id="delete-event-heading" className="font-semibold">Delete event</h2>
    <p className="my-3 text-secondary">Deletion removes the event from the website. Its URL is reserved, and administrative history is retained.</p>
    <Button ref={trigger} type="button" variant="destructive" onClick={() => { mutationId.current = crypto.randomUUID(); setPhrase(""); setError(""); setOpen(true); }}>Delete event</Button>
    <Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}>
      <DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <DialogTitle className="text-xl font-semibold">Delete event?</DialogTitle>
        <DialogDescription className="mt-3 text-secondary">This cannot be undone. If published, the event will be removed from the public website. An audit record and reserved URL will be retained.</DialogDescription>
        <form className="mt-5 space-y-5" aria-busy={busy} onSubmit={event => { event.preventDefault(); void remove(); }}>
          <div className="space-y-2"><label htmlFor="event-delete-phrase" className="block font-medium">To confirm, type “{required}”</label><Input id="event-delete-phrase" value={phrase} onChange={event => setPhrase(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} aria-describedby={error ? "event-delete-error" : undefined} /></div>
          {error ? <p id="event-delete-error" role="alert" className="text-red-800">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" variant="destructive" disabled={busy || phrase !== required}>{busy ? "Deleting…" : "Delete event"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
