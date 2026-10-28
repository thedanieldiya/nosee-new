import { RichDescription } from "@/components/site/ui/RichDescription";
import { placeholderPrivacyBody } from "@/lib/privacy/content";
import type { Description } from "@/lib/research/description";
export function PrivacyPolicyContent({
  body = placeholderPrivacyBody,
}: {
  body?: Description;
}) {
  if (body === placeholderPrivacyBody)
    return <p className="mt-4 leading-7 text-secondary">{body}</p>;
  return (
    <div className="mt-4 leading-7 text-secondary">
      <RichDescription value={body} />
    </div>
  );
}
