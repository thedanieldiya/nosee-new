"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { researchDeletionPhrase } from "@/lib/research/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export function DeleteResearchGroup({ id, version, name }: { id: string; version: number; name: string }) {
  const router = useRouter(), trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null), submitting = useRef(false);
  const [open, setOpen] = useState(false), [phrase, setPhrase] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const required = researchDeletionPhrase(name);
  async function remove() {
    if (submitting.current || phrase !== required) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/research/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phrase, version }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The research group could not be deleted.");
      if (result.id !== id) throw new Error("Deletion could not be confirmed. Check the directory before retrying.");
      if (result.cacheRefresh === "unconfirmed") { setError(result.message); return; }
      setOpen(false); router.push("/admin/research"); router.refresh();
    } catch (failure) {
      setError(failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "Deletion could not be confirmed. Reload and check the directory before retrying.");
    } finally { submitting.current = false; setBusy(false); }
  }
  return <div className="border-t border-line-mild pt-6">
    <p className="mb-4 text-secondary">Members, separate administrator accounts and history are retained.</p>
    <Button ref={trigger} type="button" variant="destructive" onClick={() => { setPhrase(""); setError(""); setOpen(true); }}>Delete research group</Button>
    <Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}>
      <DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <DialogTitle className="text-xl font-semibold">Delete research group?</DialogTitle>
        <DialogDescription className="mt-3 text-secondary">This will remove {name} and revoke its Group Lead’s access to this group. Members will remain in the member directory. This action cannot be undone.</DialogDescription>
        <form className="mt-5 space-y-5" aria-busy={busy} onSubmit={event => { event.preventDefault(); void remove(); }}>
          <div className="space-y-2"><label htmlFor="group-delete-phrase" className="block font-medium">To confirm, type “{required}”</label><Input id="group-delete-phrase" value={phrase} onChange={event => setPhrase(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} aria-describedby={error ? "group-delete-error" : undefined} /></div>
          {error ? <p id="group-delete-error" role="alert" className="text-red-800">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" variant="destructive" disabled={busy || phrase !== required}>{busy ? "Deleting…" : "Delete research group"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
