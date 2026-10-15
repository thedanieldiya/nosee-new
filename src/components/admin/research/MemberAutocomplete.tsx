"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { EligibleMember } from "@/lib/research/options";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function MemberAutocomplete({ groupId, purpose = "member", selected, onSelect }: { groupId: string; purpose?: "member" | "lead"; selected: EligibleMember | null; onSelect: (value: EligibleMember | null) => void }) {
  const id = useId(), [query, setQuery] = useState(""), [state, setState] = useState<{ query: string; rows?: EligibleMember[]; error?: boolean } | null>(null), [expanded, setExpanded] = useState(false), [active, setActive] = useState(-1), input = useRef<HTMLInputElement>(null);
  const term = query.trim(), loading = term.length >= 2 && state?.query !== term, rows = !loading && state?.query === term ? state.rows ?? [] : [];
  useEffect(() => {
    if (selected || term.length < 2) return;
    const controller = new AbortController(), timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/research/${groupId}/eligible-members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: term, purpose }), signal: controller.signal });
        const result = await response.json(); if (!response.ok || !Array.isArray(result.rows)) throw new Error();
        if (!controller.signal.aborted) { setState({ query: term, rows: result.rows }); setActive(-1); }
      } catch { if (!controller.signal.aborted) setState({ query: term, error: true }); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [groupId, purpose, term, selected]);
  function choose(person: EligibleMember) { onSelect(person); setExpanded(false); setQuery(""); setState(null); }
  const open = !selected && expanded && rows.length > 0;
  return <div className="space-y-2"><label htmlFor={id} className="block font-medium">{purpose === "lead" ? "NOSEE member identity" : "Find an existing member"}</label><Input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={selected ? undefined : `${id}-results`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-help`} autoComplete="off" value={selected ? `${selected.firstName} ${selected.lastName}` : query} readOnly={!!selected} onFocus={() => setExpanded(true)} onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setExpanded(false); }} onChange={event => { setQuery(event.target.value); setState(null); setExpanded(true); setActive(-1); }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); setExpanded(false); return; }
    if (!rows.length || selected) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); setExpanded(true); setActive(index => event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? (index + 1) % rows.length : (index <= 0 ? rows.length : index) - 1); }
    else if (event.key === "Enter" && open && active >= 0) { event.preventDefault(); choose(rows[active]); }
  }} />
    <p id={`${id}-help`} className="text-xs text-secondary">Search at least two characters of a name or affiliation. Only Active, non-deleted NOSEE members are eligible.</p>
    {selected ? <div><p className="text-secondary">{selected.affiliation || "Affiliation not recorded"}</p><Button type="button" variant="ghost" onClick={() => { onSelect(null); setState(null); setQuery(""); input.current?.focus(); }}>Change selected member</Button></div> : <><p role="status" className="text-secondary">{loading ? "Checking eligible members…" : state?.error ? "Eligible members could not be checked. Change the search to retry." : term.length >= 2 && state?.rows?.length === 0 ? "No eligible members found." : ""}</p><ul id={`${id}-results`} role="listbox" aria-label="Eligible NOSEE members" className={open ? "max-h-64 overflow-y-auto rounded-md border border-line-strong bg-default" : "hidden"}>{rows.map((person, index) => <li key={person.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index} className={`cursor-pointer break-words p-3 ${active === index ? "bg-surface" : ""}`} onMouseDown={event => event.preventDefault()} onClick={() => choose(person)}>{person.firstName} {person.lastName}<span className="mt-1 block text-xs text-secondary">{person.affiliation || "Affiliation not recorded"} · {person.id}</span></li>)}</ul></>}
  </div>;
}
