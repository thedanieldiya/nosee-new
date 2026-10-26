"use client";
import { adminToast } from "@/components/admin/AdminToasts";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
async function submit(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.message || "Unable to complete this request.");
  return result;
}
export function SignInForm({ available }: { available: boolean }) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try { await submit("/api/admin/auth/sign-in/email", "POST", { email: data.get("email"), password: data.get("password") }); window.location.assign(new URL("/admin", window.location.origin).href); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to sign in."); setPending(false); }
  }
  return <form onSubmit={signIn} className="space-y-5" aria-busy={pending}>{!available ? <p role="status" className="rounded-md border border-line-mild bg-surface p-3 text-secondary">Administrator sign-in is currently unavailable. Please contact your administrator.</p> : null}<div className="space-y-2"><label htmlFor="admin-email" className="font-medium">Email</label><Input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={!available || pending} /></div><div className="space-y-2"><label htmlFor="admin-password" className="font-medium">Password</label><Input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={!available || pending} aria-describedby={error ? "sign-in-error" : undefined} /></div>{error ? <p id="sign-in-error" role="alert" className="text-sm text-red-800">{error}</p> : null}<Button type="submit" disabled={!available || pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button></form>;
}
export function ProfileForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const router = useRouter(), [pending, setPending] = useState(false), [message, setMessage] = useState("") , [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError(""); const data = new FormData(event.currentTarget);
    try { await submit("/api/admin/profile", "PATCH", { firstName: data.get("firstName"), lastName: data.get("lastName") }); setMessage("Account details saved."); adminToast.success("Changes saved"); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to save."); adminToast.error("Couldn’t save changes"); } finally { setPending(false); }
  }
  return <form onSubmit={save} aria-busy={pending} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="first-name" className="font-medium">First name</label><Input id="first-name" name="firstName" autoComplete="given-name" defaultValue={firstName} required maxLength={80} disabled={pending} aria-invalid={!!error} aria-describedby={error ? "profile-error" : undefined} /></div><div className="space-y-2"><label htmlFor="last-name" className="font-medium">Last name</label><Input id="last-name" name="lastName" autoComplete="family-name" defaultValue={lastName} required maxLength={80} disabled={pending} aria-invalid={!!error} aria-describedby={error ? "profile-error" : undefined} /></div></div><div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button><p role="status" className="text-secondary">{message}</p></div>{error ? <p id="profile-error" role="alert" className="text-red-800">{error}</p> : null}</form>;
}
export function PasswordForm() {
  const [pending, setPending] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  async function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); setError(""); const form = event.currentTarget, data = new FormData(form);
    try {
      if (data.get("newPassword") !== data.get("confirmation")) throw new Error("New passwords do not match.");
      await submit("/api/admin/auth/change-password", "POST", { currentPassword: data.get("currentPassword"), newPassword: data.get("newPassword") });
      form.reset(); setMessage("Password updated. Other sessions have been signed out."); adminToast.success("Password updated");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to update password."); adminToast.error("Couldn’t update password"); } finally { setPending(false); }
  }
  return <form onSubmit={change} aria-busy={pending} className="space-y-5"><div className="space-y-2"><label htmlFor="current-password" className="font-medium">Current password</label><Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} disabled={pending} /></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="new-password" className="font-medium">New password</label><Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={15} maxLength={128} required disabled={pending} aria-describedby="password-guidance" /></div><div className="space-y-2"><label htmlFor="confirm-password" className="font-medium">Confirm password</label><Input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={15} maxLength={128} required disabled={pending} /></div></div><p id="password-guidance" className="text-xs text-secondary">Use 15–128 characters. A long, unique passphrase is recommended.</p><div className="flex flex-wrap items-center gap-4"><Button type="submit" variant="outline" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button><p role="status" className="text-secondary">{message}</p></div>{error ? <p role="alert" className="text-red-800">{error}</p> : null}</form>;
}
