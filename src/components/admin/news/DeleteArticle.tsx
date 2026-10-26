"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { newsDeletionPhrase } from "@/lib/news/options";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

export function DeleteArticle({ id, version, title }: { id: string; version: number; title: string }) {
  const router = useRouter(), trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null), submitting = useRef(false);
  const [open, setOpen] = useState(false), [phrase, setPhrase] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const required = newsDeletionPhrase(title);
  async function remove() {
    if (submitting.current || phrase !== required) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/news/" + id, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phrase, version, mutationId: crypto.randomUUID() }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.id !== id) throw new Error(result?.error || "Deletion could not be confirmed. Check the news directory before retrying.");
      if (result.cacheRefresh === "unconfirmed") adminToast.warning("Article deleted", "The website cache refresh could not be confirmed.");
      else adminToast.success("Article deleted");
      setOpen(false); router.replace("/admin/publishing/news"); router.refresh();
    } catch (failure) {
      const message = failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "Deletion could not be confirmed. Check the directory before retrying.";
      setError(message); adminToast.error("Couldn’t delete article");
    } finally { submitting.current = false; setBusy(false); }
  }
  return <section className="border-t border-line-mild pt-8" aria-labelledby="delete-article-heading">
    <h2 id="delete-article-heading" className="font-semibold">Delete article</h2>
    <p className="my-3 text-secondary">Deletion removes the article from the website. Its URL is reserved, and administrative history is retained.</p>
    <Button ref={trigger} type="button" variant="destructive" onClick={() => { setPhrase(""); setError(""); setOpen(true); }}>Delete article</Button>
    <Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}>
      <DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
        <DialogTitle className="text-xl font-semibold">Delete article?</DialogTitle>
        <DialogDescription className="mt-3 text-secondary">This cannot be undone. If published, the article will be removed from the public website. An audit record and reserved URL will be retained.</DialogDescription>
        <form className="mt-5 space-y-5" aria-busy={busy} onSubmit={event => { event.preventDefault(); void remove(); }}>
          <div className="space-y-2"><label htmlFor="news-delete-phrase" className="block font-medium">To confirm, type “{required}”</label><Input id="news-delete-phrase" value={phrase} onChange={event => setPhrase(event.target.value)} disabled={busy} autoComplete="off" spellCheck={false} aria-describedby={error ? "news-delete-error" : undefined} /></div>
          {error ? <p id="news-delete-error" role="alert" className="text-red-800">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="submit" variant="destructive" disabled={busy || phrase !== required}>{busy ? "Deleting…" : "Delete article"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}
