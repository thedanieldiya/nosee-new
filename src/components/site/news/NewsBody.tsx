import { Fragment, type ReactNode } from "react";
import { descriptionDocument, validateDescription, type Description, type DescriptionNode } from "@/lib/research/description";

// The same allowlisted document as private previews, without admin components or Tiptap.
export function NewsBody({ value }: { value: Description }) {
  const document = descriptionDocument(validateDescription(value));
  function render(node: DescriptionNode, key: number): ReactNode {
    const children = node.content?.map(render);
    switch (node.type) {
      case "text": {
        let content: ReactNode = node.text;
        for (const mark of node.marks ?? []) content = mark.type === "bold" ? <strong>{content}</strong>
          : mark.type === "italic" ? <em>{content}</em>
          : <a className="text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent" href={mark.attrs.href} rel="noopener noreferrer">{content}</a>;
        return <Fragment key={key}>{content}</Fragment>;
      }
      case "hardBreak": return <br key={key} />;
      case "paragraph": return <p key={key} className="my-5 text-base leading-8 md:text-lg">{children ?? <br />}</p>;
      case "heading": return node.attrs?.level === 2
        ? <h2 key={key} className="mt-10 mb-4 font-heading text-2xl font-semibold leading-tight">{children}</h2>
        : <h3 key={key} className="mt-8 mb-3 font-heading text-xl font-semibold leading-snug">{children}</h3>;
      case "bulletList": return <ul key={key} className="my-5 list-disc space-y-2 pl-6 leading-8">{children}</ul>;
      case "orderedList": return <ol key={key} start={node.attrs?.start} className="my-5 list-decimal space-y-2 pl-6 leading-8">{children}</ol>;
      case "listItem": return <li key={key}>{children}</li>;
      default: return <Fragment key={key}>{children}</Fragment>;
    }
  }
  return <div className="min-w-0 break-words">{document.content?.map(render)}</div>;
}
