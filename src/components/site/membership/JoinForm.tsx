"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitApplication } from "@/app/(public)/join/actions";
import {
  careerStages,
  researchInterests,
  emptyApplicationValues,
  membershipConsent,
  type ApplicationFormState,
} from "@/lib/membership/options";
import { PrivacyPolicyPanel } from "@/components/site/privacy/PrivacyPolicyPanel";
import { buttonClasses } from "@/components/site/ui/ButtonLink";
import type { PublishedPolicy } from "@/lib/privacy/content";
const control =
  "mt-2 block min-h-11 w-full rounded-[2px] border border-line-strong bg-default px-3 py-2 text-base text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-surface disabled:text-secondary aria-invalid:border-red-700";
export function JoinForm({
  formToken,
  available,
  policy,
}: {
  formToken: string;
  available: boolean;
  policy: PublishedPolicy | null;
}) {
  const initial: ApplicationFormState = {
    formToken,
    values: emptyApplicationValues,
    errors: {},
  };
  const [state, action, pending] = useActionState(
      submitApplication,
      initial,
      "/join",
    ),
    summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.message || state.success) summary.current?.focus();
  }, [state]);
  if (state.success)
    return (
      <div
        ref={summary}
        tabIndex={-1}
        role="status"
        className="border-t-4 border-brand bg-surface p-6 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <h2 className="font-heading text-2xl font-semibold">
          Application received
        </h2>
        <p className="mt-4">
          Your application has been received for review. This submission does
          not create an account or grant membership.
        </p>
        <p className="mt-3 text-secondary">
          This page confirms receipt only; it does not confirm email delivery.
          Pending applications expire after 30 days; expiry changes their status
          and does not delete the application.
        </p>
      </div>
    );
  return (
    <ApplicationFields
      key={state.formToken}
      state={state}
      action={action}
      pending={pending}
      available={available}
      initialPolicy={state.policy === undefined ? policy : state.policy}
      summary={summary}
    />
  );
}
function ApplicationFields({
  state,
  action,
  pending,
  available,
  initialPolicy,
  summary,
}: {
  state: ApplicationFormState;
  action: (form: FormData) => void;
  pending: boolean;
  available: boolean;
  initialPolicy: PublishedPolicy | null;
  summary: React.RefObject<HTMLDivElement | null>;
}) {
  const [policy, setPolicy] = useState(initialPolicy),
    [formToken, setFormToken] = useState(state.formToken),
    [consent, setConsent] = useState(state.values.consent),
    [notice, setNotice] = useState(""),
    [policyUnavailable, setPolicyUnavailable] = useState(false);
  function updatePolicy(next: PublishedPolicy, token: string) {
    if (next.version !== policy?.version) {
      setPolicy(next);
      setFormToken(token);
      setConsent(false);
      setNotice(
        "The privacy policy has changed. Review this version and confirm consent again.",
      );
    }
    setPolicyUnavailable(false);
  }
  function error(name: string) {
    return state.errors[name] ? (
      <p id={`${name}-error`} className="mt-2 text-sm text-red-800">
        {state.errors[name]}
      </p>
    ) : null;
  }
  const described = (name: string) =>
    state.errors[name] ? `${name}-error` : undefined;
  return (
    <form action={action} className="space-y-6" aria-busy={pending}>
      {state.message ? (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="border border-red-700 p-4 text-red-800 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <p>{state.message}</p>
          {Object.keys(state.errors).length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(state.errors)
                .filter(([name]) => name !== "form" && name !== "website")
                .map(([name, message]) => (
                  <li key={name}>
                    <a
                      href={`#join-${name}`}
                      className="underline underline-offset-4"
                    >
                      {message}
                    </a>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {!available ? (
        <p role="status" className="border border-line-strong bg-surface p-4">
          Membership applications are currently unavailable. Please try again
          later.
        </p>
      ) : null}
      {notice && (
        <p role="status" className="border border-line-strong bg-surface p-4">
          {notice}
        </p>
      )}
      {policyUnavailable && (
        <p role="alert">
          The privacy policy could not be checked. Open it again to retry before
          submitting.
        </p>
      )}
      <input type="hidden" name="formToken" value={formToken} />
      <div hidden aria-hidden="true">
        <label htmlFor="join-website">Leave this field empty</label>
        <input
          id="join-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <fieldset
        disabled={!available || pending || !policy || policyUnavailable}
        className="space-y-6"
      >
        <legend className="sr-only">
          Membership application — all fields required
        </legend>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            ["firstName", "First name", "given-name"],
            ["lastName", "Last name", "family-name"],
          ].map(([name, label, auto]) => (
            <div key={name}>
              <label htmlFor={`join-${name}`} className="font-medium">
                {label} <span className="text-secondary">(required)</span>
              </label>
              <input
                id={`join-${name}`}
                name={name}
                required
                maxLength={80}
                autoComplete={auto}
                defaultValue={state.values[name as "firstName" | "lastName"]}
                className={control}
                aria-invalid={!!state.errors[name]}
                aria-describedby={described(name)}
              />
              {error(name)}
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="join-email" className="font-medium">
            Email <span className="text-secondary">(required)</span>
          </label>
          <input
            id="join-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={state.values.email}
            className={control}
            aria-invalid={!!state.errors.email}
            aria-describedby={described("email")}
          />
          {error("email")}
        </div>
        <div>
          <label htmlFor="join-careerStage" className="font-medium">
            Career stage <span className="text-secondary">(required)</span>
          </label>
          <select
            id="join-careerStage"
            name="careerStage"
            required
            defaultValue={state.values.careerStage}
            className={control}
            aria-invalid={!!state.errors.careerStage}
            aria-describedby={described("careerStage")}
          >
            <option value="">Choose your career stage</option>
            {Object.entries(careerStages).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {error("careerStage")}
        </div>
        <fieldset
          id="join-researchInterests"
          aria-describedby={`research-help${state.errors.researchInterests ? " researchInterests-error" : ""}`}
          aria-invalid={!!state.errors.researchInterests}
        >
          <legend className="font-medium">
            Research interest areas{" "}
            <span className="text-secondary">(required)</span>
          </legend>
          <p id="research-help" className="mt-2 text-sm text-secondary">
            Select at least one.
          </p>
          <div className="mt-3 space-y-2">
            {Object.entries(researchInterests).map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-start gap-3 py-2"
              >
                <input
                  name="researchInterests"
                  type="checkbox"
                  value={value}
                  defaultChecked={state.values.researchInterests.includes(
                    value,
                  )}
                  className="mt-1 size-5 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {error("researchInterests")}
        </fieldset>
        <div>
          <label htmlFor="join-why" className="font-medium">
            Why do you want to join NOSEE?{" "}
            <span className="text-secondary">(required)</span>
          </label>
          <textarea
            id="join-why"
            name="why"
            rows={6}
            required
            maxLength={2000}
            defaultValue={state.values.why}
            className={control}
            aria-invalid={!!state.errors.why}
            aria-describedby={`why-help${state.errors.why ? " why-error" : ""}`}
          />
          <p id="why-help" className="mt-2 text-sm text-secondary">
            Use at most 2,000 characters.
          </p>
          {error("why")}
        </div>
        <div className="border-t border-line-mild pt-5">
          <label
            htmlFor="join-consent"
            className="flex min-h-11 cursor-pointer items-start gap-3"
          >
            <input
              id="join-consent"
              name="consent"
              type="checkbox"
              value="yes"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 size-5 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-invalid={!!state.errors.consent}
              aria-describedby={`consent-help${state.errors.consent ? " consent-error" : ""}`}
            />
            <span>
              {membershipConsent.text}{" "}
              <span className="text-secondary">(required)</span>
            </span>
          </label>
          {error("consent")}
          <div id="consent-help" className="mt-3 text-sm text-secondary">
            Read the{" "}
            <PrivacyPolicyPanel
              policy={policy}
              onPolicy={updatePolicy}
              onUnavailable={() => setPolicyUnavailable(true)}
            />
            .
            {policy?.isPlaceholder
              ? " Its text is currently a development placeholder awaiting approval. Use test information until the final policy is published."
              : null}
          </div>
        </div>
        <button
          type="submit"
          className={buttonClasses({ className: "w-full sm:w-auto" })}
        >
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </fieldset>
    </form>
  );
}
