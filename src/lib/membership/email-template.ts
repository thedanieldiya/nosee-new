import type { MembershipEmailKind } from "./email-options.ts";
type Input = { kind: MembershipEmailKind; firstName: string; applicationId: string; origin: string; templateVersion?: number };
export function renderMembershipEmail(input: Input) {
  const origin = new URL(input.origin);
  if (origin.protocol !== "https:" || origin.origin !== input.origin || !/^[0-9a-f-]{36}$/.test(input.applicationId)) throw new Error("Invalid membership email destination.");
  const version = input.templateVersion ?? 1;
  if (version !== 1 && !(version === 2 && input.kind === "approval")) throw new Error("Unknown membership email template version.");
  const copy = {
    receipt: { subject: "We received your NOSEE membership application", heading: "Application received", paragraphs: ["We have received your NOSEE membership application. It was recorded as pending review when received.", "Applying does not create a dashboard account. This acknowledgement confirms receipt of your application; it does not confirm membership approval."] },
    admin_alert: { subject: "New NOSEE membership application", heading: "New membership application", paragraphs: ["A new NOSEE membership application has been received for review.", "Open the application in the administration workspace to check its current status and review the submitted details. Super Admin access is required."] },
    approval: { subject: "Your NOSEE membership application has been approved", heading: "Application approved", paragraphs: ["Your NOSEE membership application has been approved.", "This message confirms the application decision. Creating a member record is a separate administrative step; this approval does not create a dashboard account or publish a public profile."] },
    rejection: { subject: "Update on your NOSEE membership application", heading: "Application update", paragraphs: ["Thank you for your interest in NOSEE. Following review, your membership application has not been approved."] },
  }[input.kind];
  if (version === 2) copy.paragraphs = ["Your NOSEE membership application has been approved, and your membership was set to Active at approval.", "This does not create an administrator account, dashboard access or a public profile."];
  const url = `${origin.origin}/admin/membership/applications/${input.applicationId}`, greeting = input.kind === "admin_alert" ? "Hello," : `Hello ${input.firstName},`;
  const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
  const link = input.kind === "admin_alert" ? `\n\nReview application: ${url}` : "";
  const text = `NOSEE\n\n${copy.heading}\n\n${greeting}\n\n${copy.paragraphs.join("\n\n")}${link}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.subject}</title></head><body style="margin:0;background:#ffffff;color:#171717;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:16px;line-height:1.6"><main><table role="presentation" style="border-collapse:collapse;width:100%"><tr><td style="padding:32px 20px"><table role="presentation" align="center" style="border-collapse:collapse;width:100%;max-width:580px"><tr><td style="padding-bottom:20px;border-bottom:3px solid #13853D;font-family:'Ubuntu Sans',Arial,sans-serif;font-size:22px;font-weight:700">NOSEE</td></tr><tr><td style="padding-top:28px"><h1 style="margin:0 0 24px;font-family:'Ubuntu Sans',Arial,sans-serif;font-size:28px;line-height:1.2">${copy.heading}</h1><p style="margin:0 0 16px;overflow-wrap:anywhere">${escape(greeting)}</p>${copy.paragraphs.map(paragraph => `<p style="margin:0 0 20px">${escape(paragraph)}</p>`).join("")}${input.kind === "admin_alert" ? `<p style="margin:24px 0 0;overflow-wrap:anywhere"><a href="${escape(url)}" style="color:#171717;font-weight:600">Review application in NOSEE administration</a></p>` : ""}</td></tr></table></td></tr></table></main></body></html>`;
  return { subject: copy.subject, html, text };
}
