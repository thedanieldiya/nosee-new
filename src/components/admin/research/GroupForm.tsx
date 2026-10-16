"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DeleteIcon from "@mingcute/react/core-regular/delete-2";
import { descriptionCount, descriptionLimit, type Description } from "@/lib/research/description";
import { DescriptionEditor } from "./DescriptionEditor";
import { type GroupContent } from "@/lib/research/options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Field } from "@/components/admin/ManagementShared";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
export function GroupForm({ initial, requestId, id, version }: { initial: GroupContent; requestId: string; id?: string; version?: number }) {
  const router = useRouter(), [objectives, setObjectives] = useState(initial.objectives.map((value, index) => ({ value, key: index }))), [description, setDescription] = useState<Description>(initial.description), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [content, setContent] = useState<Pick<GroupContent, "name" | "introduction" | "description" | "objectives"> | null>(null);
  const nextObjective = useRef(initial.objectives.length), addObjective = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false), cancel = useRef<HTMLButtonElement>(null), trigger = useRef<HTMLButtonElement>(null);
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget), text = (key: string) => String(form.get(key) ?? "");
    if (descriptionCount(description) > descriptionLimit) return;
    setContent({ name: text("name"), introduction: text("introduction"), description, objectives: objectives.map(item => item.value) }); setError(""); setOpen(true);
  }
  async function save() {
    if (submitting.current) return; submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/research${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, confirm: true, ...(id ? { version } : { requestId }) }) });
      const result = await response.json().catch(() => null); if (!response.ok || !/^[0-9a-f-]{36}$/.test(result?.id ?? "")) throw new Error(result?.error || "The save could not be confirmed. Refresh and review before retrying.");
      setOpen(false); router.push(`/admin/research/${result.id}`); router.refresh();
    } catch (failure) { setError(failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "The save could not be confirmed. Refresh and review before retrying."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <><form onSubmit={review} className="space-y-6" aria-busy={busy}><Card><CardHeader><h2 className="font-semibold">Group content</h2><p className="text-secondary">Save a private working copy, then review and publish from Content. Saving does not replace an existing published version.</p></CardHeader><CardContent><fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Research group fields</legend><Field id="research-name" label="Group name (required)"><Input id="research-name" name="name" required maxLength={120} defaultValue={initial.name} /></Field><Field id="research-intro" label="Short introduction"><Textarea id="research-intro" name="introduction" maxLength={400} rows={3} defaultValue={initial.introduction} /></Field><DescriptionEditor initial={initial.description} onChange={setDescription} disabled={busy} /><fieldset className="space-y-3"><legend className="mb-3 font-medium">Objectives / focus areas</legend>{objectives.map((item, index) => <div key={item.key}><label htmlFor={`research-objective-${item.key}`} className="mb-2 block font-medium">Focus area {index + 1}</label><div className="flex items-center gap-2"><Input id={`research-objective-${item.key}`} name="objectives" required maxLength={240} value={item.value} onChange={event => setObjectives(values => values.map(value => value.key === item.key ? { ...value, value: event.target.value } : value))} /><Button type="button" variant="ghost" className="size-11 min-h-11 p-0 text-red-800 hover:bg-red-50" aria-label={`Remove focus area ${index + 1}`} onClick={() => { const remaining = objectives.filter(value => value.key !== item.key), focus = remaining[index] ?? remaining[index - 1]; setObjectives(remaining); requestAnimationFrame(() => focus ? document.getElementById(`research-objective-${focus.key}`)?.focus() : addObjective.current?.focus()); }}><DeleteIcon size={20} color="currentColor" aria-hidden="true" /></Button></div></div>)}<Button ref={addObjective} type="button" variant="outline" disabled={objectives.length >= 8} onClick={() => { const key = nextObjective.current++; setObjectives(values => [...values, { key, value: "" }]); requestAnimationFrame(() => document.getElementById(`research-objective-${key}`)?.focus()); }}>Add focus area</Button></fieldset><div className="space-y-3"><p className="text-sm text-secondary">Cover uploads are not available yet. You can save and publish without an image.</p>{initial.coverImage ? <Image src={initial.coverImage} alt={initial.coverAlt} width={800} height={450} className="max-h-56 w-full rounded-md object-cover" /> : null}</div></fieldset></CardContent></Card><div className="flex flex-wrap gap-3"><Button ref={trigger} type="submit" disabled={busy || descriptionCount(description) > descriptionLimit}>{id ? "Save changes" : "Save draft"}</Button><Button asChild variant="outline"><Link href={id ? `/admin/research/${id}` : "/admin/research"}>Cancel</Link></Button></div></form><Dialog open={open} onOpenChange={value => { if (!submitting.current) setOpen(value); }}><DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}><DialogTitle className="text-xl font-semibold">Save private content?</DialogTitle><DialogDescription className="mt-3 text-secondary">Save this working copy. Review it before publishing; no group members or Lead permissions change.</DialogDescription><p className="mt-4 break-words">{content?.name}</p>{error ? <p role="alert" className="mt-4 text-red-800">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><DialogClose asChild><Button ref={cancel} type="button" variant="outline" disabled={busy}>Cancel</Button></DialogClose><Button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Confirm save"}</Button></div></DialogContent></Dialog></>;
}
