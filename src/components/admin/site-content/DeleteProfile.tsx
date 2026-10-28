"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export function DeleteProfile({ id, version, title }: { id: string; version: number; title: string }) {
  const router = useRouter(), trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null), submitting = useRef(false);
  const mutationId = useRef<string>("");
  const [open, setOpen] = useState(false), [phrase, setPhrase] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const required = `Delete ${title}`;
  async function remove() {
    if (submitting.current || phrase !== required) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/site-content/leadership-profiles/" + id, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phrase, version, confirm: true, mutationId: mutationId.current }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.id !== id) throw new Error(result?.error || "Deletion could not be confirmed. Check the profile directory before retrying.");
      if (result.cacheRefresh === "unconfirmed") adminToast.warning("Profile deleted", "The website cache refresh could not be confirmed.");
      else adminToast.success("Profile deleted");
      setOpen(false); router.replace("/admin/website/site-content/leadership-profiles"); router.refresh();
    } catch (failure) {
      const message = failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "Deletion could not be confirmed. Check the directory before retrying.";
      setError(message); adminToast.error("Couldn’t delete profile");
    } finally { submitting.current = false; setBusy(false); }
  }
  return <section className="border-t border-line-mild pt-8" aria-labelledby="delete-profile-heading">
    <h2 id="delete-profile-heading" className="font-semibold">Delete profile</h2>
    <p className="my-3 text-secondary">Deletion removes the profile from the website. History is retained. Member records remain intact.</p>
    <Button ref={trigger} type="button" variant="destructive" onClick={() => { mutationId.current = crypto.randomUUID(); setPhrase(""); setError(""); setOpen(true); }}>Delete profile</Button>
    <Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}>
      <DialogContent onOpenAutoFocus={profile => { profile.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={profile => { profile.preventDefault(); trigger.current?.focus(); }}>
        <DialogTitle className="text-xl font-semibold">Delete profile?</DialogTitle>
        <DialogDescription className="mt-3 text-secondary">This cannot be undone. If published, the profile will be removed from the public website. History is retained and any identity association is detached safely. Member records are retained.</DialogDescription>
        <form className="mt-5 space-y-5" aria-busy={busy} onSubmit={profile => { profile.preventDefault(); void remove(); }}>
          <div className="space-y-2"><label htmlFor="profile-delete-phrase" className="block font-medium">To confirm, type “{required}”</label><Input id="profile-delete-phrase" value={phrase} onChange={profile => setPhrase(profile.target.value)} disabled={busy} autoComplete="off" spellCheck={false} aria-describedby={error ? "profile-delete-error" : undefined} /></div>
          {error ? <p id="profile-delete-error" role="alert" className="text-red-800">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" variant="destructive" disabled={busy || phrase !== required}>{busy ? "Deleting…" : "Delete profile"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
