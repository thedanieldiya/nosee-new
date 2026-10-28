"use client";
import { useEffect, useId, useRef, useState } from "react";
type EligibleGroup = { id:string; name:string };
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function GroupAutocomplete({ selected, onSelect }: { selected: EligibleGroup | null; onSelect: (value: EligibleGroup | null) => void }) {
  const id = useId(), [query, setQuery] = useState(""), [state, setState] = useState<{ query: string; rows?: EligibleGroup[]; error?: boolean } | null>(null), [expanded, setExpanded] = useState(false), [active, setActive] = useState(-1), input = useRef<HTMLInputElement>(null);
  const term = query.trim(), loading = term.length >= 2 && state?.query !== term, rows = !loading && state?.query === term ? state.rows ?? [] : [];
  useEffect(() => {
    if (selected || term.length < 2) return;
    const controller = new AbortController(), timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/publications/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({q:term}), signal: controller.signal });
        const result = await response.json(); if (!response.ok || !Array.isArray(result.rows)) throw new Error();
        if (!controller.signal.aborted) { setState({ query: term, rows: result.rows }); setActive(-1); }
      } catch { if (!controller.signal.aborted) setState({ query: term, error: true }); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, selected]);
  function choose(person: EligibleGroup) { onSelect(person); setExpanded(false); setQuery(""); setState(null); }
  const open = !selected && expanded && rows.length > 0;
  return <div className="space-y-2"><label htmlFor={id} className="block font-medium">Research group (optional)</label><Input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={selected ? undefined : `${id}-results`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-help`} autoComplete="off" value={selected ? selected.name : query} readOnly={!!selected} onFocus={() => setExpanded(true)} onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setExpanded(false); }} onChange={event => { setQuery(event.target.value); setState(null); setExpanded(true); setActive(-1); }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); setExpanded(false); return; }
    if (!rows.length || selected) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); setExpanded(true); setActive(index => event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? (index + 1) % rows.length : (index <= 0 ? rows.length : index) - 1); }
    else if (event.key === "Enter" && open && active >= 0) { event.preventDefault(); choose(rows[active]); }
  }} />
    <p id={`${id}-help`} className="text-xs text-secondary">Search at least two characters of a group name. Only real, non-deleted groups are available. Public pages show a group name only from its published snapshot.</p>
    {selected ? <div><p className="text-secondary">{selected.name}</p><Button type="button" variant="ghost" onClick={() => { onSelect(null); setState(null); setQuery(""); input.current?.focus(); }}>Change selected group</Button></div> : <><p role="status" className="text-secondary">{loading ? "Checking research groups…" : state?.error ? "Research groups could not be checked. Change the search to retry." : term.length >= 2 && state?.rows?.length === 0 ? "No research groups found." : ""}</p><ul id={`${id}-results`} role="listbox" aria-label="Research groups" className={open ? "max-h-64 overflow-y-auto rounded-md border border-line-strong bg-default" : "hidden"}>{rows.map((person, index) => <li key={person.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index} className={`cursor-pointer break-words p-3 ${active === index ? "bg-surface" : ""}`} onMouseDown={event => event.preventDefault()} onClick={() => choose(person)}>{person.name}</li>)}</ul></>}
  </div>;
}
