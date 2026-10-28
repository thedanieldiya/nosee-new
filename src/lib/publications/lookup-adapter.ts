import { z } from "zod";
import { normalizeDoi } from "./doi.ts";
import { publicationDateInput, lookupMetadataInput, type LookupMetadata } from "./input.ts";
export type LookupResult = { status: "success"; doi: string; provider: "crossref" | "datacite"; retrievedAt: string; metadata: LookupMetadata } | { status: "no_match" | "failure" | "rate_limited"; doi: string; message: string; retryAfter?: number };
const sourceText = z.string().max(10000), named = z.object({ name: sourceText.optional(), given: sourceText.optional(), family: sourceText.optional() });
const dateParts = z.object({ "date-parts": z.array(z.array(z.number().int()).min(1).max(3)).min(1).max(2) });
const crossrefInput = z.object({ message: z.object({ DOI: z.string(), title: z.array(sourceText).optional(), author: z.array(named).max(200).optional(), type: z.string().optional(), published: dateParts.optional(), issued: dateParts.optional(), "container-title": z.array(sourceText).optional(), publisher: sourceText.optional(), URL: z.string().optional() }) });
const dataciteInput = z.object({ data: z.object({ attributes: z.object({ doi: z.string(), titles: z.array(z.object({ title: sourceText })).optional(), creators: z.array(z.object({ name: sourceText.optional(), givenName: sourceText.optional(), familyName: sourceText.optional() })).max(200).optional(), types: z.object({ resourceTypeGeneral: z.string().optional() }).optional(), publicationYear: z.number().int().optional(), dates: z.array(z.object({ date: z.string(), dateType: z.string() })).optional(), container: z.object({ title: sourceText.optional() }).optional(), publisher: z.union([sourceText, z.object({ name: sourceText })]).optional(), url: z.string().optional() }) }) });
const clean = (s: string | undefined) => s?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || undefined;
function calendar(parts: number[] | undefined) { if (!parts) return undefined; const value = parts.map((n,i) => String(n).padStart(i === 0 ? 4 : 2, "0")).join("-"); return publicationDateInput.safeParse(value).success ? value : undefined; }
function validated(metadata: LookupMetadata) {
  // Invalid or oversized optional provider fields are omitted, never truncated into invented metadata.
  return Object.fromEntries(Object.entries(metadata).flatMap(([key,value]) => { if (value === undefined) return []; const field = lookupMetadataInput.shape[key as keyof LookupMetadata]; const parsed = field.safeParse(value); return parsed.success ? [[key,parsed.data]] : []; })) as LookupMetadata;
}
export function crossrefMetadata(raw: unknown, doi: string): LookupMetadata {
  const m = crossrefInput.parse(raw).message;
  if (normalizeDoi(m.DOI) !== doi) throw new Error("Mismatched DOI.");
  const types: Record<string, LookupMetadata["type"]> = { "journal-article":"journal-article", "proceedings-article":"conference-paper", book:"book", "monograph":"book", "book-chapter":"book-chapter", report:"report", dataset:"dataset", "posted-content":"preprint", dissertation:"thesis", "software":"software" };
  const authors = m.author?.map(a => clean(a.name) ?? clean([a.given,a.family].filter(Boolean).join(" ")));
  return validated({ title: clean(m.title?.[0]), authors: authors?.length && authors.every(Boolean) ? authors as string[] : undefined, type: m.type ? types[m.type] : undefined, publicationDate: calendar((m.published ?? m.issued)?.["date-parts"][0]), source: clean(m["container-title"]?.[0]) ?? clean(m.publisher), referenceUrl: m.URL });
}
export function dataciteMetadata(raw: unknown, doi: string): LookupMetadata {
  const m = dataciteInput.parse(raw).data.attributes;
  if (normalizeDoi(m.doi) !== doi) throw new Error("Mismatched DOI.");
  const types: Record<string, LookupMetadata["type"]> = { JournalArticle:"journal-article", ConferencePaper:"conference-paper", Book:"book", BookChapter:"book-chapter", Report:"report", Dataset:"dataset", Preprint:"preprint", Dissertation:"thesis", Software:"software" };
  const authors = m.creators?.map(a => clean(a.name) ?? clean([a.givenName,a.familyName].filter(Boolean).join(" ")));
  const supplied = m.dates?.find(d => d.dateType === "Issued" && publicationDateInput.safeParse(d.date).success)?.date;
  return validated({ title: clean(m.titles?.[0]?.title), authors: authors?.length && authors.every(Boolean) ? authors as string[] : undefined, type: m.types?.resourceTypeGeneral ? types[m.types.resourceTypeGeneral] : undefined, publicationDate: supplied ?? (m.publicationYear ? String(m.publicationYear) : undefined), source: clean(m.container?.title) ?? clean(typeof m.publisher === "string" ? m.publisher : m.publisher?.name), referenceUrl: m.url });
}
const MAX_BYTES = 262144;
async function provider(provider: "crossref" | "datacite", doi: string, fetcher: typeof fetch, timeoutMs: number) {
  const endpoint = provider === "crossref" ? "https://api.crossref.org/works/" : "https://api.datacite.org/dois/";
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(endpoint + encodeURIComponent(doi), { redirect: "manual", signal: controller.signal, headers: { Accept: "application/json", "User-Agent": "NOSEE-Publications/1.0 (https://github.com/thedanieldiya/nosee-new)" }, cache: "no-store" });
    if (response.status === 404) { await response.body?.cancel(); return null; }
    if (response.status === 429) { await response.body?.cancel(); const seconds = Number(response.headers.get("retry-after")); return { rateLimited: Math.min(300,Math.max(5,Number.isFinite(seconds) ? seconds : 60)) }; }
    if (!response.ok || response.status >= 300 || !response.headers.get("content-type")?.toLowerCase().includes("json")) { await response.body?.cancel(); throw new Error("Provider unavailable."); }
    if (Number(response.headers.get("content-length")) > MAX_BYTES) { await response.body?.cancel(); throw new Error("Response too large."); }
    const reader = response.body?.getReader(); if (!reader) throw new Error("Missing metadata.");
    const chunks: Uint8Array[] = []; let bytes = 0;
    try { while (true) { const {value,done} = await reader.read(); if (done) break; bytes += value.length; if (bytes > MAX_BYTES) throw new Error("Response too large."); chunks.push(value); } }
    finally { await reader.cancel(); }
    const raw: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return { metadata: provider === "crossref" ? crossrefMetadata(raw,doi) : dataciteMetadata(raw,doi) };
  } finally { clearTimeout(timer); }
}
export async function retrieveDoi(raw: string, fetcher: typeof fetch = fetch, timeoutMs = 3000): Promise<LookupResult> {
  const doi = normalizeDoi(raw);
  try {
    for (const name of ["crossref", "datacite"] as const) {
      const result = await provider(name,doi,fetcher,timeoutMs);
      if (!result) continue;
      if ("rateLimited" in result) return { status:"rate_limited", doi, retryAfter:result.rateLimited, message:"The metadata provider is busy. Try again shortly or continue manually." };
      if (!Object.keys(result.metadata).length) return { status:"no_match", doi, message:"No usable citation fields were supplied. Continue manually." };
      return { status:"success",doi,provider:name,retrievedAt:new Date().toISOString(),metadata:result.metadata };
    }
    return { status:"no_match",doi,message:"No matching citation was found. Check the DOI or continue manually." };
  } catch { return { status:"failure",doi,message:"Metadata could not be retrieved. Retry shortly or continue manually; your fields are unchanged." }; }
}
