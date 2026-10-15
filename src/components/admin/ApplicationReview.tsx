"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
export function ApplicationReview({ id, pending: eligible }: { id: string; pending: boolean }) {
  const [open, setOpen] = useState(false), [decision, setDecision] = useState<"approved" | "rejected">("approved"), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const trigger = useRef<HTMLElement | null>(null), router = useRouter();
  function start(value: "approved" | "rejected") { trigger.current = document.activeElement as HTMLElement; setDecision(value); setError(""); setOpen(true); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/membership/applications/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note: form.get("note") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "The decision could not be saved.");
      setMessage(result.message); setOpen(false); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "The decision could not be saved."); } finally { setBusy(false); }
  }
  const action = decision === "approved" ? "Approve" : "Reject";
  return <div className="space-y-4"><div className="flex flex-wrap gap-3"><Button disabled={!eligible || busy} onClick={() => start("approved")}>Approve</Button><Button variant="outline" disabled={!eligible || busy} onClick={() => start("rejected")}>Reject</Button></div><p className="text-sm text-secondary">Only pending applications before their expiry deadline can be reviewed. A decision does not create a member record, account or email.</p><p role="status">{message}</p><Dialog open={open} onOpenChange={setOpen}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}><DialogTitle className="text-xl font-semibold">{action} application</DialogTitle><DialogDescription className="mt-2 mb-6 text-secondary">This decision is final for this application. Submitted details remain read-only. Your internal note is private and will not be copied into the Activity log.</DialogDescription><form onSubmit={save} aria-busy={busy} className="space-y-5"><div><label htmlFor="review-note" className="font-medium">Internal review note / reason</label><Textarea id="review-note" name="note" rows={5} required maxLength={2000} disabled={busy} aria-describedby="review-note-help" className="mt-2" /><p id="review-note-help" className="mt-2 text-xs text-secondary">Required, up to 2,000 characters.</p></div>{error ? <p role="alert" className="text-red-800">{error}</p> : null}<div className="flex justify-end gap-3"><DialogClose asChild><Button variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" disabled={busy}>{busy ? "Saving…" : `${action} application`}</Button></div></form></DialogContent></Dialog></div>;
}
