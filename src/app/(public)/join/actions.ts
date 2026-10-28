"use server";
import { headers } from "next/headers";
import { submitMembershipApplication, ApplicationError, PolicyChangedError } from "@/lib/membership/service";
import { createApplicationToken, applicationTokenContext } from "@/lib/membership/form-guard";
import { emptyApplicationValues, membershipConsent, type ApplicationFormState } from "@/lib/membership/options";
import { publishedPrivacyPolicy } from "@/lib/privacy/public";
export async function submitApplication(_previous: ApplicationFormState, form: FormData): Promise<ApplicationFormState> {
  const text = (name: string, max: number) => typeof form.get(name) === "string" ? String(form.get(name)).slice(0, max) : "";
  const values = { firstName: text("firstName", 81), lastName: text("lastName", 81), email: text("email", 255), careerStage: text("careerStage", 80), researchInterests: form.getAll("researchInterests").filter((value): value is string => typeof value === "string").slice(0, 6), why: text("why", 2001), consent: form.get("consent") === "yes" };
  try {
    const allowed = ["firstName", "lastName", "email", "careerStage", "researchInterests", "why", "consent", "formToken", "website"];
    if ([...form.keys()].some(key => !key.startsWith("$ACTION_") && !allowed.includes(key))) throw new ApplicationError("Use the application form's listed fields only.");
    await submitMembershipApplication({ ...values, formToken: text("formToken", 201), website: text("website", 100) }, new Headers(await headers()));
    return { success: true, formToken: "", values: emptyApplicationValues, errors: {} };
  } catch (error) {
    const policy = await publishedPrivacyPolicy();
    const presented = applicationTokenContext(text("formToken",201));
    const changed = error instanceof PolicyChangedError || !!(policy && presented && (policy.version !== presented.privacyVersion || membershipConsent.version !== presented.consentVersion));
    if (changed || !policy || !presented) values.consent = false;
    const failure = changed && policy ? new PolicyChangedError() : error;
    return { formToken: policy ? createApplicationToken(Date.now(),policy.version) : "", policy, values, errors: { ...(error instanceof ApplicationError ? error.errors : {}), ...(failure instanceof PolicyChangedError ? failure.errors : {}) }, message: failure instanceof ApplicationError ? failure.message : "Membership applications are currently unavailable. Your application has not been confirmed; please try again later." };
  }
}
