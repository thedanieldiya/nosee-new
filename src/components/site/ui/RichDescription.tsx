import { Fragment, type ReactNode } from "react";
import { descriptionDocument, validateDescription, type Description, type DescriptionNode } from "@/lib/research/description";
export function RichDescription({ value }: { value: Description }) {
  const document = descriptionDocument(validateDescription(value));
  function render(node: DescriptionNode, key: number): ReactNode {
    const children = node.content?.map(render);
    switch (node.type) {
      case "text": { let text: ReactNode = node.text; for (const mark of node.marks ?? []) text = mark.type === "bold" ? <strong>{text}</strong> : mark.type === "italic" ? <em>{text}</em> : <a href={mark.attrs.href} rel="noopener noreferrer">{text}</a>; return <Fragment key={key}>{text}</Fragment>; }
      case "hardBreak": return <br key={key} />;
      case "paragraph": return <p key={key}>{children ?? <br />}</p>;
      case "heading": return node.attrs?.level === 2 ? <h2 key={key}>{children}</h2> : <h3 key={key}>{children}</h3>;
      case "bulletList": return <ul key={key}>{children}</ul>;
      case "orderedList": return <ol key={key} start={node.attrs?.start}>{children}</ol>;
      case "listItem": return <li key={key}>{children}</li>;
      default: return <Fragment key={key}>{children}</Fragment>;
    }
  }
  return <div className="research-description">{document.content?.map(render)}</div>;
}
