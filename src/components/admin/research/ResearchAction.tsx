"use client";
import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
export function ResearchAction({ endpoint, payload, title, description, disabled = false, destructive = false, children, onSuccess }: { endpoint: string; payload: object; title: string; description: string; disabled?: boolean; destructive?: boolean; children?: ReactNode; onSuccess?: () => void }) {
  const router = useRouter(), trigger = useRef<HTMLButtonElement>(null), cancel = useRef<HTMLButtonElement>(null), submitting = useRef(false);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function save() {
    if (submitting.current) return; submitting.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, confirm: true }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.message) throw new Error(result?.error || "This change could not be confirmed. Refresh and review before retrying.");
      setMessage(result.message);
      const label = endpoint.includes("/news/") ? (title === "Unpublish" ? "Article unpublished" : "Article published") : "Changes saved";
      if (result.cacheRefresh === "unconfirmed") adminToast.warning(label, "The public cache refresh could not be confirmed."); else adminToast.success(label);
      setOpen(false); onSuccess?.(); router.refresh();
    } catch (failure) { setError(failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "This change could not be confirmed. Refresh and review before retrying."); adminToast.error("Couldn’t save changes"); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <div className="space-y-2"><Button ref={trigger} type="button" variant={destructive ? "destructive" : "outline"} disabled={disabled || busy} onClick={() => { setError(""); setOpen(true); }}>{title}</Button>{message ? <p role="status" className="max-w-prose text-secondary">{message}</p> : null}<Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}><DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}><DialogTitle className="text-xl font-semibold">{title}?</DialogTitle><DialogDescription className="mt-3 text-secondary">{description}</DialogDescription>{children ? <div className="mt-4 break-words">{children}</div> : null}{error ? <p role="alert" className="mt-4 text-red-800">{error}</p> : null}<div className="mt-6 flex flex-wrap justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="button" variant={destructive ? "destructive" : "default"} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Confirm"}</Button></div></DialogContent></Dialog></div>;
}
