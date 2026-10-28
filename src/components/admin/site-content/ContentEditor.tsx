"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fingerprint,
  heroFieldsInput,
  profileFieldsInput,
  profileName,
  type HeroFields,
  type ProfileFields,
} from "@/lib/site-content/input";
import { HeroFieldsForm, ProfileFieldsForm } from "./Fields";
import { DeleteProfile } from "./DeleteProfile";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { adminToast } from "@/components/admin/AdminToasts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
type HistoryNavigation = EventTarget & { traverseTo(key: string): unknown };
type HistoryEvent = Event & {
  navigationType: string;
  destination: { key: string; url: string; sameDocument: boolean };
};

import { privacyFieldsInput } from "@/lib/privacy/input";
import { privacyFingerprint, type PrivacyFields } from "@/lib/privacy/content";
import { DescriptionEditor } from "@/components/admin/research/DescriptionEditor";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/ManagementShared";
type Fields = HeroFields | ProfileFields | PrivacyFields;
const contentFingerprint = (value: Fields) =>
  "body" in value ? privacyFingerprint(value) : fingerprint(value);

export function ContentEditor({
  kind,
  initial,
  published = null,
  id,
  version = 0,
  status = "draft",
  requestId,
  focusSaved = false,
  children,
}: {
  kind: "hero" | "profile" | "privacy";
  initial: Fields;
  published?: Fields | null;
  id?: string;
  version?: number;
  status?: string;
  requestId: string;
  focusSaved?: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter(),
    [fields, setFields] = useState(initial),
    [savedKey, setSavedKey] = useState(contentFingerprint(initial)),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [leaving, setLeaving] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [publishing, setPublishing] = useState(false),
    [approved, setApproved] = useState(false);
  const publishCancel = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    submitting = useRef(false),
    allowLeaving = useRef(false),
    leaveTrigger = useRef<HTMLElement | null>(null),
    actionKey = useRef<{ fingerprint: string; id: string } | null>(null);
  const dirty = contentFingerprint(fields) !== savedKey,
    hasUnpublishedChanges =
      !!published &&
      contentFingerprint(initial) !== contentFingerprint(published);
  const root = "/admin/website/site-content",
    directory = root + "/leadership-profiles",
    locationPath =
      kind === "privacy"
        ? root + "/privacy"
        : kind === "hero"
          ? root + "/homepage"
          : directory + (id ? "/" + id : "/new");
  useEffect(() => {
    if (focusSaved) statusRef.current?.focus();
  }, [focusSaved]);
  useEffect(() => {
    if (!dirty) return;
    // Window capture catches Next.js sidebar and in-editor links before client navigation.
    const warn = (event: BeforeUnloadEvent) => {
      if (allowLeaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const internalClick = (event: MouseEvent) => {
      if (
        allowLeaving.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("target") === "_blank"
      )
        return;
      const href = new URL(anchor.href, window.location.href);
      if (href.origin !== location.origin || href.href === location.href)
        return;
      event.preventDefault();
      event.stopPropagation();
      leaveTrigger.current = anchor;
      setLeaving(href.pathname + href.search + href.hash);
    };
    // Cancel reliable same-document traversals without adding synthetic history entries.
    // Other browsers retain native unload protection and the internal-link guard.
    const navigation = (window as Window & { navigation?: HistoryNavigation })
      .navigation;
    const historyAttempt = (event: Event) => {
      const attempt = event as HistoryEvent;
      if (
        allowLeaving.current ||
        attempt.navigationType !== "traverse" ||
        !attempt.cancelable ||
        !attempt.destination.sameDocument
      )
        return;
      if (new URL(attempt.destination.url).origin !== location.origin) return;
      attempt.preventDefault();
      leaveTrigger.current = null;
      setLeaving("__history__:" + attempt.destination.key);
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("click", internalClick, true);
    navigation?.addEventListener("navigate", historyAttempt);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("click", internalClick, true);
      navigation?.removeEventListener("navigate", historyAttempt);
    };
  }, [dirty]);

  function navigate(destination: string) {
    allowLeaving.current = true;
    setLeaving(null);
    if (destination.startsWith("__history__:"))
      (
        window as Window & { navigation?: HistoryNavigation }
      ).navigation?.traverseTo(destination.slice("__history__:".length));
    else {
      const anchor = leaveTrigger.current;
      // Replay the confirmed link so sidebar menus also finish their normal close action.
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.href === new URL(destination, location.href).href
      )
        anchor.click();
      else router.push(destination);
      router.refresh();
    }
  }

  async function save(mode: "draft" | "publish", destination?: string) {
    if (
      submitting.current ||
      (kind === "privacy" && mode === "publish" && !approved) ||
      !formRef.current?.reportValidity()
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const parsed = (
        kind === "privacy"
          ? privacyFieldsInput
          : kind === "hero"
            ? heroFieldsInput
            : profileFieldsInput
      ).safeParse(fields);
      if (!parsed.success) {
        setErrors(
          Object.fromEntries(
            parsed.error.issues.map((i) => [i.path.join("."), i.message]),
          ),
        );
        throw Error("Check the highlighted fields before saving.");
      }
      if (
        kind === "hero" &&
        mode === "publish" &&
        !(parsed.data as HeroFields).length
      )
        throw Error("Keep at least one valid slide before publishing.");
      setErrors({});
      const key = mode + ":" + version + ":" + contentFingerprint(parsed.data);
      if (!actionKey.current || actionKey.current.fingerprint !== key)
        actionKey.current = { fingerprint: key, id: crypto.randomUUID() };
      const response = await fetch(
          "/api/admin/site-content/" +
            (kind === "privacy"
              ? "privacy"
              : kind === "hero"
                ? "homepage"
                : "leadership-profiles" + (id ? "/" + id : "")),
          {
            method: kind !== "profile" || id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: parsed.data,
              mode,
              version,
              mutationId:
                !id && kind === "profile" ? requestId : actionKey.current.id,
              confirm: true,
              ...(kind === "privacy" && mode === "publish"
                ? { approvedForPublication: true }
                : {}),
            }),
          },
        ),
        result = await response.json().catch(() => null);
      if (!response.ok || !result?.id)
        throw Error(
          result?.error ||
            "The save could not be confirmed. Review the saved version before retrying.",
        );
      setSavedKey(contentFingerprint(parsed.data));
      const title =
        mode === "publish"
          ? kind === "privacy"
            ? "Privacy policy published"
            : kind === "hero"
              ? "Hero published"
              : "Profile published"
          : "Draft saved";
      if (result.cacheRefresh === "unconfirmed")
        adminToast.warning(
          title,
          "The website cache refresh could not be confirmed.",
        );
      else adminToast.success(title);
      actionKey.current = null;
      navigate(
        destination ??
          (kind !== "profile" ? locationPath : directory + "/" + result.id) +
            "?saved=1",
      );
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message !== "Failed to fetch"
          ? failure.message
          : "The save could not be confirmed. Your content remains in the editor; review the saved version before retrying.",
      );
      adminToast.error("Couldn’t save changes");
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void save("draft");
  }
  return (
    <>
      <div className="flex flex-wrap justify-between gap-3">
        {kind === "profile" && (
          <Link href={directory} className="underline">
            All leadership profiles
          </Link>
        )}
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="text-sm text-secondary"
        >
          {dirty
            ? "Unsaved changes"
            : hasUnpublishedChanges
              ? "Unpublished changes"
              : version === 0
                ? "Not saved"
                : status === "published"
                  ? "Published"
                  : status === "unpublished"
                    ? "Unpublished"
                    : "Draft saved"}
        </p>
      </div>
      <form
        ref={formRef}
        onSubmit={submit}
        className="space-y-6"
        aria-busy={busy}
      >
        <Card>
          <CardHeader>
            <h2 className="font-semibold">
              {kind === "privacy"
                ? "Policy wording"
                : kind === "hero"
                  ? "Hero slides"
                  : "Public profile content"}
            </h2>
            <p className="text-secondary">
              Save a draft or publish the current fields. Saved drafts leave the
              live snapshot unchanged.
            </p>
            {kind === "hero" && version === 0 && (
              <p className="text-sm text-secondary">
                The first save initializes editable slides while retaining the
                current live hero.
              </p>
            )}
            {kind === "profile" && (
              <p className="text-sm text-secondary">
                The first profile publication switches About from development
                placeholders to published profiles. No member or account is
                created.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <fieldset disabled={busy} className="space-y-5">
              <legend className="sr-only">Content fields</legend>
              {kind === "privacy" ? (
                <>
                  <Field id="privacy-title" label="Page title">
                    <Input
                      id="privacy-title"
                      value={(fields as PrivacyFields).title}
                      maxLength={160}
                      aria-invalid={!!errors.title}
                      aria-describedby={
                        errors.title ? "privacy-title-error" : undefined
                      }
                      onChange={(e) =>
                        setFields({
                          ...(fields as PrivacyFields),
                          title: e.target.value,
                        })
                      }
                    />
                    {errors.title && (
                      <p
                        id="privacy-title-error"
                        className="text-sm text-red-800"
                      >
                        {errors.title}
                      </p>
                    )}
                  </Field>
                  <Field id="privacy-date" label="Effective date (optional)">
                    <Input
                      id="privacy-date"
                      type="date"
                      value={(fields as PrivacyFields).effectiveDate}
                      aria-invalid={!!errors.effectiveDate}
                      aria-describedby={
                        errors.effectiveDate ? "privacy-date-error" : undefined
                      }
                      onChange={(e) =>
                        setFields({
                          ...(fields as PrivacyFields),
                          effectiveDate: e.target.value,
                        })
                      }
                    />
                    {errors.effectiveDate && (
                      <p
                        id="privacy-date-error"
                        className="text-sm text-red-800"
                      >
                        Use a real calendar date.
                      </p>
                    )}
                  </Field>
                  <p className="text-sm text-secondary">
                    Publication is immediate. The effective date is displayed as
                    a calendar date; it does not schedule publication.
                  </p>
                  <DescriptionEditor
                    id="privacy-body"
                    label="Policy body"
                    initial={(fields as PrivacyFields).body}
                    onChange={(body) =>
                      setFields({ ...(fields as PrivacyFields), body })
                    }
                    disabled={busy}
                    validationError={errors.body}
                  />
                </>
              ) : kind === "hero" ? (
                <HeroFieldsForm
                  fields={fields as HeroFields}
                  onChange={setFields}
                  errors={errors}
                />
              ) : (
                <ProfileFieldsForm
                  fields={fields as ProfileFields}
                  onChange={setFields}
                  errors={errors}
                  busy={busy}
                  isNew={!id}
                />
              )}
            </fieldset>
          </CardContent>
        </Card>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-4 text-red-900"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy || (version > 0 && !dirty)}>
            {busy ? "Saving…" : "Save as draft"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              if (kind === "privacy") {
                setError("");
                setApproved(false);
                setPublishing(true);
              } else void save("publish");
            }}
          >
            {status === "published" ? "Publish changes" : "Publish"}
          </Button>
          {version > 0 && (
            <Button asChild variant="outline">
              <Link href={locationPath + "?preview=1"}>
                Preview saved draft
              </Link>
            </Button>
          )}
        </div>
      </form>
      {kind === "profile" && id && status === "published" && (
        <ResearchAction
          endpoint={
            "/api/admin/site-content/leadership-profiles/" + id + "/publication"
          }
          payload={{ action: "unpublish", version }}
          title="Unpublish"
          description="Remove this profile from About. Its working copy and member identity remain intact."
          disabled={busy || dirty}
        />
      )}
      {children}
      {kind === "profile" && id && (
        <DeleteProfile
          id={id}
          version={version}
          title={profileName(initial as ProfileFields)}
        />
      )}
      <Dialog
        open={publishing}
        onOpenChange={(open) => {
          if (!busy) setPublishing(open);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            publishCancel.current?.focus();
          }}
        >
          <DialogTitle>Publish privacy policy?</DialogTitle>
          <DialogDescription className="mt-3">
            This replaces the policy on the website and Join form. Applicants
            with an older version must review the updated wording and confirm
            consent again. Publish only wording approved by the organisation.
          </DialogDescription>
          <label className="mt-5 flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={approved}
              disabled={busy}
              onChange={(e) => setApproved(e.target.checked)}
              className="mt-1 size-5 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <span>I confirm this wording is approved for publication.</span>
          </label>
          {error && (
            <p role="alert" className="mt-4 text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button
                ref={publishCancel}
                type="button"
                variant="outline"
                disabled={busy}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={busy || !approved}
              onClick={() => void save("publish")}
            >
              {busy ? "Publishing…" : "Publish policy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={leaving !== null}
        onOpenChange={(v) => {
          if (!busy && !v) setLeaving(null);
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            cancel.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            leaveTrigger.current?.focus();
          }}
        >
          <DialogTitle>Save your changes?</DialogTitle>
          <DialogDescription className="mt-3">
            You have unsaved changes.
          </DialogDescription>
          {error && (
            <p role="alert" className="mt-4 text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button
                ref={cancel}
                type="button"
                variant="outline"
                disabled={busy}
              >
                Keep editing
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (leaving) navigate(leaving);
              }}
            >
              Discard changes
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                if (leaving) void save("draft", leaving);
              }}
            >
              Save as draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
