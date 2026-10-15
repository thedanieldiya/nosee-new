"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";
export function PrivacyPolicyPanel() {
  const [open, setOpen] = useState(false), dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLAnchorElement>(null), closeButton = useRef<HTMLButtonElement>(null), backdropPress = useRef(false);
  function outside(element: HTMLDialogElement, x: number, y: number) {
    const rect = element.getBoundingClientRect();
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  }
  useEffect(() => {
    if (!open || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    const previous = document.documentElement.style.overflow, opener = trigger.current;
    document.documentElement.style.overflow = "hidden"; closeButton.current?.focus();
    return () => { document.documentElement.style.overflow = previous; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [open]);
  return <><a ref={trigger} href="/privacy" className="text-brand underline underline-offset-4" onClick={event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return;
    event.preventDefault(); setOpen(true);
  }}>privacy policy</a>{open ? createPortal(<dialog ref={dialog} aria-labelledby="join-privacy-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[2px] border border-line-strong bg-default p-5 text-primary shadow-xl backdrop:bg-black/50 sm:p-8" onClose={() => setOpen(false)} onPointerDown={event => { backdropPress.current = event.target === event.currentTarget && outside(event.currentTarget, event.clientX, event.clientY); }} onClick={event => {
    if (backdropPress.current && event.target === event.currentTarget && outside(event.currentTarget, event.clientX, event.clientY)) event.currentTarget.close();
    backdropPress.current = false;
  }} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(control => control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><div className="flex items-start justify-between gap-4"><h2 id="join-privacy-title" className="font-heading text-2xl font-semibold">Privacy policy</h2><button ref={closeButton} type="button" aria-label="Close privacy policy" className="min-h-11 shrink-0 border border-line-strong px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => dialog.current?.close()}>Close</button></div><PrivacyPolicyContent /></dialog>, document.body) : null}</>;
}
