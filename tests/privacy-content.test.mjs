import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { render } from "./helpers/render-site.mjs";
import {
  privacyFieldsInput,
  privacySaveInput,
} from "../src/lib/privacy/input.ts";
import {
  developmentPolicy,
  placeholderPrivacyBody,
  privacyFingerprint,
  isPlaceholderBody,
} from "../src/lib/privacy/content.ts";
import { descriptionDocument } from "../src/lib/research/description.ts";
const { PrivacyPolicyContent } = await import(
  "../src/components/site/privacy/PrivacyPolicyContent.tsx"
);
const fields = (patch = {}) => ({
  title: "Privacy policy",
  body: "Synthetic policy wording for isolated tests.",
  effectiveDate: "",
  ...patch,
});
const save = (patch = {}) => ({
  fields: fields(),
  mode: "draft",
  version: 1,
  mutationId: randomUUID(),
  confirm: true,
  ...patch,
});
test("baseline retains literal placeholder/version and its original public markup without approval callouts", () => {
  assert.equal(developmentPolicy.version, "development-placeholder-v1");
  assert.equal(developmentPolicy.isPlaceholder, true);
  const html = render(PrivacyPolicyContent, {});
  assert.equal(
    html,
    `<p class="mt-4 leading-7 text-secondary">${placeholderPrivacyBody}</p>`,
  );
  assert.doesNotMatch(html, /back to membership|awaiting approval/i);
});
test("drafts support safe rich text, optional calendar date and an empty working body", () => {
  assert.ok(privacyFieldsInput.safeParse(fields({ body: "" })).success);
  assert.ok(
    privacyFieldsInput.safeParse(
      fields({
        effectiveDate: "2028-02-29",
        body: descriptionDocument("Synthetic text"),
      }),
    ).success,
  );
  for (const patch of [
    { effectiveDate: "2026-02-29" },
    { title: "" },
    { title: "x".repeat(161) },
    { body: "x".repeat(6001) },
    {
      body: {
        type: "doc",
        content: [{ type: "image", attrs: { src: "evil" } }],
      },
    },
    { approved: true },
  ])
    assert.equal(privacyFieldsInput.safeParse(fields(patch)).success, false);
});
test("publication requires explicit approval, nonempty wording and cannot approve the known placeholder in any formatting", () => {
  assert.ok(
    privacySaveInput.safeParse(
      save({ mode: "publish", approvedForPublication: true }),
    ).success,
  );
  for (const patch of [
    {},
    { fields: fields({ body: "" }), approvedForPublication: true },
    {
      fields: fields({ body: placeholderPrivacyBody }),
      approvedForPublication: true,
    },
    {
      fields: fields({ body: descriptionDocument(placeholderPrivacyBody) }),
      approvedForPublication: true,
    },
  ])
    assert.equal(
      privacySaveInput.safeParse(save({ mode: "publish", ...patch })).success,
      false,
    );
  assert.equal(
    isPlaceholderBody(descriptionDocument(placeholderPrivacyBody)),
    true,
  );
});
test("canonical revisions normalize plain/rich text and compare title, date, body and formatting", () => {
  const f = fields();
  assert.equal(
    privacyFingerprint(f),
    privacyFingerprint({ ...f, body: descriptionDocument(f.body) }),
  );
  for (const patch of [
    { title: "Changed title" },
    { effectiveDate: "2026-10-28" },
    { body: "Changed wording" },
    {
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: f.body, marks: [{ type: "bold" }] },
            ],
          },
        ],
      },
    },
  ])
    assert.notEqual(
      privacyFingerprint(f),
      privacyFingerprint({ ...f, ...patch }),
    );
});
test("mutation validation rejects missing confirmations, stale invalid versions and arbitrary snapshot/actor/status fields", () => {
  for (const patch of [
    { confirm: false },
    { version: -1 },
    { mutationId: "invalid" },
    { publishedVersion: "forged" },
    { createdBy: randomUUID() },
    { action: "unpublish" },
    { status: "approved" },
  ])
    assert.equal(privacySaveInput.safeParse(save(patch)).success, false);
});
test("public safe rendering escapes text, keeps supported formatting and rejects scripts and unsafe links", () => {
  const body = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Synthetic heading" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "<script>unsafe</script>",
            marks: [{ type: "bold" }],
          },
        ],
      },
    ],
  };
  const html = render(PrivacyPolicyContent, { body });
  assert.match(html, /<h2>Synthetic heading<\/h2>/);
  assert.match(html, /<strong>&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.throws(() =>
    render(PrivacyPolicyContent, {
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Unsafe",
                marks: [
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                ],
              },
            ],
          },
        ],
      },
    }),
  );
});
