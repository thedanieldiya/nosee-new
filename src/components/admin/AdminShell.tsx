"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Home from "@mingcute/react/core-regular/home-2";
import Group from "@mingcute/react/core-regular/group";
import Flask from "@mingcute/react/core-regular/flask";
import News from "@mingcute/react/core-regular/news";
import Globe from "@mingcute/react/core-regular/earth";
import Settings from "@mingcute/react/core-regular/settings-3";
import Menu from "@mingcute/react/core-regular/menu";
import Down from "@mingcute/react/core-regular/down";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { roleLabels, type Principal, type adminNavigation } from "@/lib/admin/policy";
const icons = { home: Home, members: Group, research: Flask, publishing: News, website: Globe, settings: Settings };
export function AdminShell({ principal, navigation, children }: { principal: Principal; navigation: ReturnType<typeof adminNavigation>; children: ReactNode }) {
  const pathname = usePathname(), [open, setOpen] = useState(false), [leaving, setLeaving] = useState(false), [error, setError] = useState("");
  async function signOut() {
    setLeaving(true); setError("");
    try {
      const response = await fetch("/api/admin/auth/sign-out", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error();
      window.location.assign(new URL("/admin/sign-in", window.location.origin).href);
    } catch { setError("Unable to sign out. Please try again."); setLeaving(false); }
  }
  function links() { return <nav aria-label="Administration" className="space-y-1">{navigation.map((item, index) => {
    const Icon = item.icon ? icons[item.icon as keyof typeof icons] : null;
    const selected = item.href === "/admin" ? pathname === "/admin" : item.permission === "publishing" ? pathname.startsWith("/admin/publishing/") : item.permission === "membership" ? pathname.startsWith("/admin/membership/") : pathname.startsWith(item.href);
    const classes = `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${selected ? "bg-[#e7f3eb] text-[#0b5025]" : "text-secondary"}`;
    return <div key={item.href}>{index > 0 && item.permission === "account" ? <p className="mt-7 mb-2 px-3 text-xs font-medium text-secondary">Settings</p> : null}{item.available ? <Link href={item.href} aria-current={selected ? "page" : undefined} onClick={() => setOpen(false)} className={`${classes} hover:bg-black/5 hover:text-primary`}>{Icon ? <Icon size={20} aria-hidden="true" focusable="false" data-admin-icon={item.icon} /> : null}{item.label}</Link> : <span aria-disabled="true" data-nav-target={item.href} className={`${classes} cursor-not-allowed`}>
      {Icon ? <Icon size={20} aria-hidden="true" focusable="false" data-admin-icon={item.icon} /> : null}<span>{item.label}</span><span className="ml-auto text-[10px] font-normal">Soon</span></span>}</div>;
  })}</nav>; }
  return <div className="admin min-h-screen bg-[#f1f1f1] text-sm text-primary">
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line-mild bg-default px-4 lg:px-6">
      <div className="flex items-center gap-3"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" aria-label="Open navigation" className="size-11 px-0 lg:hidden"><Menu size={22} aria-hidden="true" focusable="false" data-admin-icon="menu" /></Button></SheetTrigger><SheetContent><SheetTitle className="mb-1 px-3 pt-2 font-heading text-lg font-semibold">NOSEE</SheetTitle><SheetDescription className="mb-7 px-3 text-sm text-secondary">Administration</SheetDescription>{links()}</SheetContent></Sheet><Link href="/admin" className="font-heading text-xl font-bold tracking-tight text-brand">NOSEE <span className="ml-2 text-sm font-medium tracking-normal text-secondary">Admin</span></Link></div>
      <div className="flex items-center gap-2 sm:gap-5"><Link href="/" target="_blank" rel="noopener noreferrer" className="hidden rounded-md px-2 py-2 text-secondary hover:text-primary sm:block">View website</Link><DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" aria-label={`${principal.firstName[0]}${principal.lastName[0]} ${principal.firstName} ${principal.lastName}: Account menu`} className="gap-2 px-2"><span className="flex size-8 items-center justify-center rounded-full bg-[#e7f3eb] text-xs font-semibold text-[#0b5025]" aria-hidden="true">{principal.firstName[0]}{principal.lastName[0]}</span>{" "}<span className="hidden max-w-40 truncate sm:inline">{principal.firstName} {principal.lastName}</span><Down size={16} aria-hidden="true" focusable="false" data-admin-icon="down" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><div className="border-b border-line-mild px-3 py-3"><p className="font-medium">{principal.firstName} {principal.lastName}</p><p className="mt-1 text-xs text-secondary">{roleLabels[principal.role]}</p></div><DropdownMenuItem asChild><Link href="/admin/settings/general">Account settings</Link></DropdownMenuItem><DropdownMenuItem disabled={leaving} onSelect={() => void signOut()}>{leaving ? "Signing out…" : "Sign out"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    </header><aside className="fixed top-16 bottom-0 left-0 hidden w-60 overflow-y-auto border-r border-line-mild bg-surface p-4 lg:block">{links()}</aside>
    <div className="pt-16 lg:pl-60">{error ? <p role="alert" className="m-5 rounded-md border border-red-700 bg-default p-3 text-red-800">{error}</p> : null}{children}</div>
  </div>;
}
