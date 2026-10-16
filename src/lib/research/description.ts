// Shared server/editor contract; deliberately independent of Tiptap and the DOM.
export const descriptionLimit = 6000;
export type DescriptionMark = { type: "bold" } | { type: "italic" } | { type: "link"; attrs: { href: string } };
export type DescriptionNode = { type: "doc" | "paragraph" | "heading" | "bulletList" | "orderedList" | "listItem" | "hardBreak" | "text"; content?: DescriptionNode[]; text?: string; marks?: DescriptionMark[]; attrs?: { level?: number; start?: number; type?: null } };
export type DescriptionDocument = DescriptionNode & { type: "doc" };
export type Description = string | DescriptionDocument;
const controls = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;
export function safeResearchLink(value: string) {
  if (!value || value.length > 2048 || /[\s\x00-\x1f\x7f\\]/.test(value)) return false;
  try { const url = new URL(value); return ["https:", "http:", "mailto:"].includes(url.protocol) && !url.username && !url.password && (url.protocol !== "mailto:" || !!url.pathname); } catch { return false; }
}
export function descriptionText(value: Description | DescriptionNode): string {
  if (typeof value === "string") return value.replace(/\r\n?/g, "\n");
  if (value.type === "text") return value.text ?? "";
  if (value.type === "hardBreak") return "\n";
  return (value.content ?? []).map(descriptionText).join(["paragraph", "heading"].includes(value.type) ? "" : "\n");
}
export function descriptionCount(value: Description) {
  return Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(descriptionText(value))).length;
}
export function descriptionDocument(value: Description): DescriptionDocument {
  if (typeof value !== "string") return value;
  const lines = value.replace(/\r\n?/g, "\n").split("\n"), content: DescriptionNode[] = [];
  lines.forEach((line, index) => { if (index) content.push({ type: "hardBreak" }); if (line) content.push({ type: "text", text: line }); });
  return { type: "doc", content: [{ type: "paragraph", ...(content.length ? { content } : {}) }] };
}
export function validateDescription(value: unknown): Description {
  const fail = (): never => { throw new Error("Use supported description formatting and safe links, within 6,000 visible characters."); };
  if (typeof value === "string") { if (value.length > 48000 || controls.test(value) || descriptionCount(value) > descriptionLimit) fail(); return value; }
  let nodes = 0;
  function object(raw: unknown): Record<string, unknown> { if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail(); return raw as Record<string, unknown>; }
  function keys(raw: Record<string, unknown>, allowed: string[]) { if (Object.keys(raw).some(key => !allowed.includes(key))) fail(); }
  function visit(raw: unknown, parent: string, depth: number): DescriptionNode {
    if (++nodes > 1200 || depth > 10) fail();
    const node = object(raw), type = node.type;
    const allowed = parent === "root" ? ["doc"] : parent === "paragraph" || parent === "heading" ? ["text", "hardBreak"] : parent === "bulletList" || parent === "orderedList" ? ["listItem"] : parent === "listItem" ? ["paragraph", "bulletList", "orderedList"] : ["paragraph", "heading", "bulletList", "orderedList"];
    if (typeof type !== "string" || !allowed.includes(type)) return fail();
    keys(node, ["type", ...(type === "text" ? ["text", "marks"] : type === "hardBreak" ? [] : ["content", ...(["heading", "orderedList"].includes(type) ? ["attrs"] : [])])]);
    if (type === "text") {
      if (typeof node.text !== "string" || !node.text || node.text.length > 48000 || controls.test(node.text)) return fail();
      const marks: DescriptionMark[] = [], seen = new Set();
      if (node.marks !== undefined) {
        if (!Array.isArray(node.marks) || node.marks.length > 3) fail();
        for (const rawMark of node.marks as unknown[]) {
          const mark = object(rawMark); if (!["bold", "italic", "link"].includes(String(mark.type)) || seen.has(mark.type)) fail(); seen.add(mark.type);
          keys(mark, mark.type === "link" ? ["type", "attrs"] : ["type"]);
          if (mark.type === "link") { const attrs = object(mark.attrs); keys(attrs, ["href"]); if (typeof attrs.href !== "string" || !safeResearchLink(attrs.href)) return fail(); marks.push({ type: "link", attrs: { href: attrs.href } }); }
          else marks.push({ type: mark.type as "bold" | "italic" });
        }
      }
      return { type: "text", text: node.text, ...(marks.length ? { marks } : {}) };
    }
    if (type === "hardBreak") return { type };
    const attrs = node.attrs === undefined ? {} : object(node.attrs);
    if (type === "heading") { keys(attrs, ["level"]); if (![2, 3].includes(Number(attrs.level)) || typeof attrs.level !== "number") fail(); }
    if (type === "orderedList") { keys(attrs, ["start", "type"]); if (attrs.type != null || (attrs.start !== undefined && (!Number.isInteger(attrs.start) || Number(attrs.start) < 1 || Number(attrs.start) > 9999))) fail(); }
    if (node.content !== undefined && !Array.isArray(node.content)) fail();
    const children = ((node.content ?? []) as unknown[]).map(child => visit(child, type, depth + 1));
    if (["doc", "bulletList", "orderedList", "listItem"].includes(type) && !children.length) fail();
    if (type === "listItem" && children[0]?.type !== "paragraph") fail();
    return { type: type as DescriptionNode["type"], ...(children.length ? { content: children } : {}), ...(type === "heading" ? { attrs: { level: Number(attrs.level) } } : type === "orderedList" && attrs.start !== undefined ? { attrs: { start: Number(attrs.start) } } : {}) };
  }
  const doc = visit(value, "root", 0) as DescriptionDocument;
  if (JSON.stringify(doc).length > 96000 || descriptionCount(doc) > descriptionLimit) fail();
  return doc;
}
