"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Field, Select } from "./ManagementShared";
import { roleLabels } from "@/lib/admin/policy";
import type { DirectoryRow } from "@/lib/admin/management-queries";
async function submit(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to complete this request.");
  return result;
}
function RoleOptions() { return <><option value="editor">Editor</option><option value="super_admin">Super Admin</option><option value="research_group_lead" disabled>Research Group Lead — assign from Research</option></>; }
export function InvitationForm({ configured }: { configured: boolean }) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const router = useRouter();
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage(""); const form = event.currentTarget, data = new FormData(form);
    try { const result = await submit("/api/admin/administrators", { action: "invite", firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), role: data.get("role") }); setMessage(result.message); form.reset(); setOpen(false); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to invite."); } finally { setPending(false); }
  }
  return <div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button disabled={!configured} aria-describedby={!configured ? "email-configuration" : undefined}>Invite administrator</Button></DialogTrigger><DialogContent><DialogTitle className="text-xl font-semibold">Invite administrator</DialogTitle><DialogDescription className="mt-2 mb-6 text-secondary">The recipient will receive an account setup email. The invitation expires in 48 hours.</DialogDescription><form onSubmit={invite} aria-busy={pending} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="First name" id="invite-first"><Input id="invite-first" name="firstName" required maxLength={80} disabled={pending} /></Field><Field label="Last name" id="invite-last"><Input id="invite-last" name="lastName" required maxLength={80} disabled={pending} /></Field></div><Field label="Email" id="invite-email"><Input id="invite-email" name="email" type="email" required maxLength={254} disabled={pending} /></Field><Field label="Access role" id="invite-role"><Select id="invite-role" name="role" defaultValue="editor" disabled={pending} aria-describedby="invite-lead"><RoleOptions /></Select></Field><p id="invite-lead" className="text-xs text-secondary">Invite Group Leads from their Research group after explicitly selecting an Active NOSEE member.</p>{error ? <p role="alert" className="text-red-800">{error}</p> : null}<div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button variant="outline" disabled={pending}>Cancel</Button></DialogClose><Button type="submit" disabled={pending}>{pending ? "Sending invitation…" : "Send invitation"}</Button></div></form></DialogContent></Dialog><p role="status" className="mt-3 text-secondary">{message}</p></div>;
}
export function AdministratorActions({ row, self, configured }: { row: DirectoryRow; self: boolean; configured: boolean }) {
  const [open, setOpen] = useState(false), [action, setAction] = useState(""), [role, setRole] = useState(row.role), [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const router = useRouter(), invitation = row.kind === "invitation", trigger = useRef<HTMLElement | null>(null);
  const label = action === "change-role" ? "Change role" : action === "deactivate" ? "Deactivate account" : action === "activate" ? "Reactivate account" : action === "revoke" ? "Revoke invitation" : "Resend invitation";
  async function confirm(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try { const result = await submit("/api/admin/administrators", { action, id: row.id, ...(action === "change-role" ? { role } : {}) }); setMessage(result.message); setOpen(false); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update."); } finally { setPending(false); }
  }
  const unavailable = invitation && row.status === "revoked";
  function start(value: string) { trigger.current = document.activeElement as HTMLElement; setAction(value); setError(""); setOpen(true); }
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{invitation ? <><Button variant="outline" disabled={!configured || unavailable || pending} onClick={() => start("resend")}>Resend</Button><Button variant="outline" disabled={unavailable || pending} onClick={() => start("revoke")}>Revoke</Button></> : <><Button variant="outline" disabled={self || pending} onClick={() => start("change-role")}>Change role</Button><Button variant="outline" disabled={self || pending} onClick={() => start(row.status === "active" ? "deactivate" : "activate")}>{row.status === "active" ? "Deactivate" : "Reactivate"}</Button></>}</div>{self ? <p className="text-xs text-secondary">Your account · self changes are protected</p> : null}<p role="status" className="text-xs text-secondary">{message}</p><Dialog open={open} onOpenChange={setOpen}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}><DialogTitle className="text-xl font-semibold">{label}</DialogTitle><DialogDescription className="mt-2 mb-6 text-secondary">{row.firstName} {row.lastName} · {row.email}. {invitation ? action === "revoke" ? "The invitation code will stop working." : "A new email will be attempted. The previous code will stop working." : "Previous sessions will be revoked. The administrator must sign in again when access is active."}</DialogDescription><form onSubmit={confirm} aria-busy={pending} className="space-y-5">{action === "change-role" ? <><Field label="New access role" id={`role-${row.id}`}><Select id={`role-${row.id}`} value={role} onChange={event => setRole(event.target.value as DirectoryRow["role"])} disabled={pending} aria-describedby={`lead-${row.id}`}><RoleOptions /></Select></Field><p id={`lead-${row.id}`} className="text-xs text-secondary">Assign Group Leads from Research with an explicitly reviewed member and group. Current role: {roleLabels[row.role]}.</p></> : null}{error ? <p role="alert" className="text-red-800">{error}</p> : null}<div className="flex flex-wrap justify-end gap-3"><DialogClose asChild><Button variant="outline" disabled={pending}>Cancel</Button></DialogClose><Button type="submit" disabled={pending || (action === "change-role" && (role === row.role || role === "research_group_lead"))}>{pending ? "Updating…" : label}</Button></div></form></DialogContent></Dialog></div>;
}
export function AcceptInvitationForm({ available }: { available: boolean }) {
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); const form = event.currentTarget, data = new FormData(form);
    try {
      if (data.get("password") !== data.get("confirmation")) throw new Error("Passwords must match.");
      const result = await submit("/api/admin/accept-invitation", { code: data.get("code"), password: data.get("password"), confirmation: data.get("confirmation") }); form.reset(); setMessage(result.message);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to set up account."); } finally { setPending(false); }
  }
  if (message) return <div className="space-y-5"><p role="status">{message}</p><Button asChild><Link href="/admin/sign-in">Continue to sign in</Link></Button></div>;
  return <form onSubmit={accept} aria-busy={pending} className="space-y-5">{!available ? <p role="status">Account setup is currently unavailable. Please try again later.</p> : null}<Field label="Invitation code" id="accept-code"><Input id="accept-code" name="code" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} required minLength={43} maxLength={43} disabled={!available || pending} aria-describedby="accept-code-help" /></Field><p id="accept-code-help" className="text-xs text-secondary">Enter the one-time code from your invitation email. The code expires after 48 hours.</p><Field label="New password" id="accept-password"><Input id="accept-password" name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} disabled={!available || pending} aria-describedby="accept-password-help" /></Field><Field label="Confirm password" id="accept-confirmation"><Input id="accept-confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={15} maxLength={128} disabled={!available || pending} /></Field><p id="accept-password-help" className="text-xs text-secondary">Use 15–128 characters. A long, unique passphrase is recommended.</p>{error ? <p role="alert" className="text-red-800">{error}</p> : null}<Button type="submit" disabled={!available || pending} className="w-full">{pending ? "Setting up account…" : "Set up account"}</Button></form>;
}
