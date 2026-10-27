"use client";
import { useRef, useState, type ComponentProps } from "react";
import Eye from "@mingcute/react/core-regular/eye";
import EyeClose from "@mingcute/react/core-regular/eye-close";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "./utils";

export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type" | "ref">) {
  const input = useRef<HTMLInputElement>(null), [visible, setVisible] = useState(false);
  function toggle() {
    const field = input.current;
    if (!field) return;
    const focused = document.activeElement === field;
    const start = field.selectionStart, end = field.selectionEnd, direction = field.selectionDirection;
    setVisible(value => !value);
    requestAnimationFrame(() => {
      if (focused) field.focus({ preventScroll: true });
      // Some browsers do not expose password selection; keep native behavior there.
      if (start !== null && end !== null) try { field.setSelectionRange(start, end, direction ?? undefined); } catch { /* Unsupported selection API. */ }
    });
  }
  const Icon = visible ? Eye : EyeClose;
  return <div className="relative">
    <Input {...props} ref={input} type={visible ? "text" : "password"} className={cn("pr-12", className)} />
    <Button type="button" variant="ghost" disabled={props.disabled} aria-label={visible ? "Hide password" : "Show password"} aria-controls={props.id} onPointerDown={event => { if (event.button === 0) event.preventDefault(); }} onClick={toggle} className="absolute inset-y-0 right-0 size-11 p-0 text-secondary hover:text-primary">
      <Icon size={20} color="currentColor" aria-hidden="true" focusable="false" />
    </Button>
  </div>;
}
