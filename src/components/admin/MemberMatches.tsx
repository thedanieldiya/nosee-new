"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MemberMatch } from "@/lib/membership/members";
import { memberMatchQuery } from "@/lib/membership/match-query";
import { memberStatuses } from "@/lib/membership/member-options";
type Matches = { duplicate: MemberMatch | null; suggestions: MemberMatch[] };
export function useMemberMatches(firstName: string, lastName: string, email: string, exclude = "", enabled = true) {
  const query = useMemo(() => enabled ? memberMatchQuery(firstName, lastName, email, exclude) : null, [firstName, lastName, email, exclude, enabled]);
  const [result, setResult] = useState<{ query: typeof query; data?: Matches; error?: boolean } | null>(null);
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/membership/members/matches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(query), signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.suggestions) || !(data.duplicate === null || typeof data.duplicate?.id === "string")) throw new Error();
        if (!controller.signal.aborted) setResult({ query, data });
      } catch { if (!controller.signal.aborted) setResult({ query, error: true }); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  // Query identity also distinguishes A → B → A, so old results never look current.
  if (!query) return { status: "idle" as const, data: null };
  if (result?.query !== query) return { status: "loading" as const, data: null };
  if (result.error) return { status: "error" as const, data: null };
  return { status: "ready" as const, data: result.data! };
}
export function MemberMatches({ matches }: { matches: ReturnType<typeof useMemberMatches> }) {
  return <div aria-live="polite" className="min-h-6 space-y-3" data-member-matches>
    {matches.status === "idle" ? <p className="text-xs text-secondary">Matches are checked automatically after a full email or at least two characters in both names.</p> : null}
    {matches.status === "loading" ? <p className="text-xs text-secondary">Checking possible matches…</p> : null}
    {matches.status === "error" ? <p className="text-secondary">Possible matches could not be checked. No match result is available. Saving still checks email uniqueness; change the details or reopen the review to retry.</p> : null}
    {matches.status === "ready" && !matches.data.duplicate && !matches.data.suggestions.length ? <p className="text-xs text-secondary">No matches found for the checked details. Saving checks again.</p> : null}
    {matches.data?.duplicate ? <div className="rounded-md border border-line-strong p-3"><p className="font-medium">A member with this normalized email already exists.</p><p className="mt-2" data-member-private>{matches.data.duplicate.firstName} {matches.data.duplicate.lastName} · {matches.data.duplicate.email} · {matches.data.duplicate.affiliation || "Affiliation not recorded"} · {memberStatuses[matches.data.duplicate.status]} · Joined {matches.data.duplicate.joinDate}</p><Link href={`/admin/membership/members/${matches.data.duplicate.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">Review existing member (opens in a new tab)</Link></div> : null}
    {matches.data?.suggestions.length ? <div><h3 className="font-medium">Possible name matches — review each identity</h3><p className="mt-1 text-secondary">Similar names can belong to different people. A different email can identify a distinct member. Up to 10 matches are shown; names alone never merge people.</p><ul className="mt-2 space-y-2">{matches.data.suggestions.map(person => <li key={person.id} className="break-words"><Link href={`/admin/membership/members/${person.id}`} target="_blank" rel="noopener noreferrer" className="underline">{person.firstName} {person.lastName}</Link><span data-member-private> · {person.email} · {person.affiliation || "Affiliation not recorded"} · {memberStatuses[person.status]}</span></li>)}</ul></div> : null}
  </div>;
}
