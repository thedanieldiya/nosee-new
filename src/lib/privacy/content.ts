import {
  descriptionText,
  descriptionDocument,
  type Description,
} from "../research/description.ts";
import { canonicalContentFingerprint } from "../news/draft-state.ts";
export const placeholderPrivacyVersion = "development-placeholder-v1";
export const placeholderPrivacyBody =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
export type PrivacyFields = {
  title: string;
  body: Description;
  effectiveDate: string;
};
export type PublishedPolicy = PrivacyFields & {
  version: string;
  isPlaceholder: boolean;
  publishedAt: string | null;
};
export const developmentPolicy: PublishedPolicy = {
  version: placeholderPrivacyVersion,
  title: "Privacy policy",
  effectiveDate: "",
  body: placeholderPrivacyBody,
  isPlaceholder: true,
  publishedAt: null,
};
export const privacyFingerprint = (fields: PrivacyFields) =>
  canonicalContentFingerprint({
    ...fields,
    body: descriptionDocument(fields.body),
  });
export const isPlaceholderBody = (body: Description) =>
  descriptionText(body).replace(/\s+/g, " ").trim() === placeholderPrivacyBody;
