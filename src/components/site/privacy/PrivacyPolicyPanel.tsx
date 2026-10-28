"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";
import type { PublishedPolicy } from "@/lib/privacy/content";
export function PrivacyPolicyPanel({
  policy,
  onPolicy,
  onUnavailable,
}: {
  policy: PublishedPolicy | null;
  onPolicy: (policy: PublishedPolicy, token: string) => void;
  onUnavailable: () => void;
}) {
  const [open, setOpen] = useState(false),
    [checking, setChecking] = useState(false),
    [failure, setFailure] = useState(""),
    [attempt, setAttempt] = useState(0),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLAnchorElement>(null),
    closeButton = useRef<HTMLButtonElement>(null),
    backdropPress = useRef(false),
    callbacks = useRef({ onPolicy, onUnavailable });
  useEffect(() => {
    callbacks.current = { onPolicy, onUnavailable };
  });
  function outside(element: HTMLDialogElement, x: number, y: number) {
    const r = element.getBoundingClientRect();
    return x < r.left || x > r.right || y < r.top || y > r.bottom;
  }
  useEffect(() => {
    if (!open || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    const previous = document.documentElement.style.overflow,
      opener = trigger.current;
    document.documentElement.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.documentElement.style.overflow = previous;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 15000);
    let closed = false;
    void fetch("/api/privacy", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.policy || typeof data.formToken !== "string")
          throw Error();
        if (!controller.signal.aborted) {
          callbacks.current.onPolicy(data.policy, data.formToken);
          setChecking(false);
        }
      })
      .catch(() => {
        if (controller.signal.aborted && closed) return;
        setFailure(
          "The privacy policy is temporarily unavailable. Close or try again.",
        );
        setChecking(false);
        callbacks.current.onUnavailable();
      })
      .finally(() => clearTimeout(timer));
    return () => {
      closed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, attempt]);
  function retry() {
    setChecking(true);
    setFailure("");
    setAttempt((v) => v + 1);
  }
  return (
    <>
      <a
        ref={trigger}
        href="/privacy"
        className="text-brand underline underline-offset-4"
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            typeof HTMLDialogElement === "undefined" ||
            !HTMLDialogElement.prototype.showModal
          )
            return;
          event.preventDefault();
          setChecking(true);
          setFailure("");
          setOpen(true);
        }}
      >
        privacy policy
      </a>
      {open
        ? createPortal(
            <dialog
              ref={dialog}
              aria-labelledby="join-privacy-title"
              aria-busy={checking}
              className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[2px] border border-line-strong bg-default p-5 text-primary shadow-xl backdrop:bg-black/50 sm:p-8"
              onClose={() => setOpen(false)}
              onPointerDown={(event) => {
                backdropPress.current =
                  event.target === event.currentTarget &&
                  outside(event.currentTarget, event.clientX, event.clientY);
              }}
              onClick={(event) => {
                if (
                  backdropPress.current &&
                  event.target === event.currentTarget &&
                  outside(event.currentTarget, event.clientX, event.clientY)
                )
                  event.currentTarget.close();
                backdropPress.current = false;
              }}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const controls = [
                    ...event.currentTarget.querySelectorAll<HTMLElement>(
                      'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
                    ),
                  ].filter((c) => c.getClientRects().length),
                  first = controls[0],
                  last = controls.at(-1);
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="join-privacy-title"
                  className="font-heading text-2xl font-semibold"
                >
                  {policy?.title ?? "Privacy policy"}
                </h2>
                <button
                  ref={closeButton}
                  type="button"
                  aria-label="Close privacy policy"
                  className="min-h-11 shrink-0 border border-line-strong px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  onClick={() => dialog.current?.close()}
                >
                  Close
                </button>
              </div>
              {checking ? (
                <p role="status" className="mt-4">
                  Checking the published policy…
                </p>
              ) : failure ? (
                <div className="mt-4">
                  <p role="alert">{failure}</p>
                  <button
                    type="button"
                    className="mt-4 min-h-11 border border-line-strong px-4 py-2"
                    onClick={retry}
                  >
                    Try again
                  </button>
                </div>
              ) : policy ? (
                <>
                  {policy.effectiveDate && (
                    <p className="mt-4 text-secondary">
                      Effective{" "}
                      <time dateTime={policy.effectiveDate}>
                        {policy.effectiveDate}
                      </time>
                    </p>
                  )}
                  <PrivacyPolicyContent body={policy.body} />
                </>
              ) : null}
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
