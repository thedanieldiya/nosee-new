"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Close from "@mingcute/react/core-regular/close";
type Level = "success" | "error" | "info" | "warning";
type Notification = { id: number; level: Level; title: string; description?: string };
const EVENT = "nosee:admin-toast";
let nextId = 0;
export const adminToast = {
  show(level: Level, title: string, description?: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: ++nextId, level, title, description } satisfies Notification }));
  },
  success(title: string, description?: string) { this.show("success", title, description); },
  error(title: string, description?: string) { this.show("error", title, description); },
  info(title: string, description?: string) { this.show("info", title, description); },
  warning(title: string, description?: string) { this.show("warning", title, description); },
};
const borders: Record<Level, string> = { success: "border-l-brand", error: "border-l-red-700", info: "border-l-blue-700", warning: "border-l-amber-700" };
function Toast({ item, dismiss }: { item: Notification; dismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  useEffect(() => {
    if (hovered || focused) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.level === "error" ? 12000 : 7000);
    return () => window.clearTimeout(timer);
  }, [item.id, item.level, hovered, focused, dismiss]);
  return <div role={item.level === "error" ? "alert" : "status"} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} className={"pointer-events-auto flex w-full items-start gap-3 rounded-md border border-line-mild border-l-4 bg-default p-4 text-primary shadow-lg " + borders[item.level]}>
    <div className="min-w-0 grow"><p className="font-semibold">{item.title}</p>{item.description ? <p className="mt-1 text-sm leading-6 text-secondary">{item.description}</p> : null}</div>
    <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="flex size-11 shrink-0 items-center justify-center rounded text-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-accent"><Close size={20} aria-hidden="true" focusable="false" /></button>
  </div>;
}
export function AdminToasts() {
  const [items, setItems] = useState<Notification[]>([]);
  const dismiss = useCallback((id: number) => setItems(current => current.filter(item => item.id !== id)), []);
  const last = useRef<{ text: string; when: number }>({ text: "", when: 0 });
  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<Notification>).detail;
      if (!detail || !["success", "error", "info", "warning"].includes(detail.level) || !detail.title) return;
      const signature = detail.level + ":" + detail.title + ":" + (detail.description ?? ""), now = Date.now();
      if (signature === last.current.text && now - last.current.when < 1200) return;
      last.current = { text: signature, when: now };
      setItems(current => [...current.slice(-2), detail]);
    };
    window.addEventListener(EVENT, handle);
    return () => window.removeEventListener(EVENT, handle);
  }, []);
  return <section className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:w-[360px]" aria-label="Notifications">
    {items.map(item => <Toast key={item.id} item={item} dismiss={dismiss} />)}
  </section>;
}
