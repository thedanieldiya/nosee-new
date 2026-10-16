"use client";
import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import { UndoRedo } from "@tiptap/extensions";
import BoldIcon from "@mingcute/react/core-regular/bold";
import ItalicIcon from "@mingcute/react/core-regular/italic";
import BulletIcon from "@mingcute/react/core-regular/list-check";
import NumberIcon from "@mingcute/react/core-regular/list-ordered";
import LinkIcon from "@mingcute/react/core-regular/link";
import UnlinkIcon from "@mingcute/react/core-regular/unlink";
import UndoIcon from "@mingcute/react/core-regular/back";
import RedoIcon from "@mingcute/react/core-regular/forward";
import { descriptionDocument, descriptionCount, descriptionLimit, safeResearchLink, type Description, type DescriptionDocument } from "@/lib/research/description";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/admin/ManagementShared";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

const SafeLink = Link.extend({ addAttributes() { return { href: { default: null, parseHTML: element => element.getAttribute("href") } }; } });
export function DescriptionEditor({ initial, onChange, disabled, label = "Full description", id = "research-description" }: { initial: Description; onChange: (value: DescriptionDocument) => void; disabled: boolean; label?: string; id?: string }) {
  const [count, setCount] = useState(descriptionCount(initial)), [linkOpen, setLinkOpen] = useState(false), [href, setHref] = useState(""), [linkError, setLinkError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [Document, Paragraph, Text, HardBreak, Heading.configure({ levels: [2, 3] }), Bold, Italic, BulletList, OrderedList, ListItem, UndoRedo, SafeLink.configure({ autolink: false, linkOnPaste: false, openOnClick: false, isAllowedUri: safeResearchLink, HTMLAttributes: { target: null, rel: "noopener noreferrer" } })],
    content: descriptionDocument(initial), editable: !disabled,
    editorProps: { attributes: { id, role: "textbox", "aria-multiline": "true", "aria-labelledby": `${id}-label`, "aria-describedby": `${id}-count`, class: "research-description min-h-56 p-3 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2" } },
    onUpdate: ({ editor }) => { const doc = editor.getJSON() as DescriptionDocument; setCount(descriptionCount(doc)); onChange(doc); },
  });
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  const state = useEditorState({ editor, selector: ({ editor }) => editor ? { bold: editor.isActive("bold"), italic: editor.isActive("italic"), bullet: editor.isActive("bulletList"), ordered: editor.isActive("orderedList"), link: editor.isActive("link"), level: editor.isActive("heading", { level: 2 }) ? "2" : editor.isActive("heading", { level: 3 }) ? "3" : "paragraph", undo: editor.can().undo(), redo: editor.can().redo() } : null });
  function saveLink() {
    if (!safeResearchLink(href)) { setLinkError("Use a complete https://, http:// or mailto: address without spaces."); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run(); setLinkOpen(false);
  }
  return <div className="space-y-2"><label id={`${id}-label`} htmlFor={id} className="block font-medium">{label}</label><div className="overflow-hidden rounded-md border border-line-strong bg-default">
    <div role="group" aria-label="Description formatting" className="flex flex-wrap items-center gap-1 border-b border-line-mild bg-surface p-2">
      <label className="sr-only" htmlFor={`${id}-style`}>Text style</label><Select id={`${id}-style`} className="w-auto min-w-0" disabled={!editor || disabled} value={state?.level ?? "paragraph"} onChange={event => { if (event.target.value === "paragraph") editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().setHeading({ level: Number(event.target.value) as 2 | 3 }).run(); }}><option value="paragraph">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option></Select>
      {[
        { label: "Bold", Icon: BoldIcon, pressed: state?.bold, action: () => editor?.chain().focus().toggleBold().run() },
        { label: "Italic", Icon: ItalicIcon, pressed: state?.italic, action: () => editor?.chain().focus().toggleItalic().run() },
        { label: "Bulleted list", Icon: BulletIcon, pressed: state?.bullet, action: () => editor?.chain().focus().toggleBulletList().run() },
        { label: "Numbered list", Icon: NumberIcon, pressed: state?.ordered, action: () => editor?.chain().focus().toggleOrderedList().run() },
        { label: "Edit link", Icon: LinkIcon, pressed: state?.link, action: () => { setHref(editor?.getAttributes("link").href ?? ""); setLinkError(""); setLinkOpen(true); } },
        { label: "Remove link", Icon: UnlinkIcon, unavailable: !state?.link, action: () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() },
        { label: "Undo", Icon: UndoIcon, unavailable: !state?.undo, action: () => editor?.chain().focus().undo().run() },
        { label: "Redo", Icon: RedoIcon, unavailable: !state?.redo, action: () => editor?.chain().focus().redo().run() },
      ].map(({ label, Icon, pressed, action, unavailable }) => <Button key={label} type="button" variant="ghost" className="size-11 p-0 aria-pressed:bg-black/10" aria-label={label} title={label} aria-pressed={pressed} disabled={!editor || disabled || unavailable} onClick={action}><Icon size={20} color="currentColor" aria-hidden="true" /></Button>)}
    </div><EditorContent editor={editor} /></div><p id={`${id}-count`} className={count > descriptionLimit ? "text-sm text-red-800" : "text-xs text-secondary"}>{count.toLocaleString("en")} / 6,000 visible characters{count > descriptionLimit ? ". Shorten the description before saving." : ". Line breaks count; formatting does not."}</p>
    <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); editor?.commands.focus(); }}><DialogTitle className="text-xl font-semibold">Edit link</DialogTitle><DialogDescription className="mt-2 text-secondary">Link selected text to a web or email address.</DialogDescription><label htmlFor={`${id}-link`} className="mt-5 block font-medium">Link address</label><Input id={`${id}-link`} className="mt-2" value={href} onChange={event => setHref(event.target.value)} aria-describedby={linkError ? `${id}-link-error` : undefined} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); saveLink(); } }} />{linkError ? <p role="alert" id={`${id}-link-error`} className="mt-3 text-red-800">{linkError}</p> : null}<div className="mt-5 flex justify-end gap-3"><DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose><Button type="button" onClick={saveLink}>Save link</Button></div></DialogContent></Dialog>
  </div>;
}
