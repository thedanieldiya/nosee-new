import type { Metadata } from "next";
import Link from "next/link";
import { PublicationDate } from "@/components/site/publications/PublicationDate";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/Container";
import { publishedPublication } from "@/lib/publications/public";
import { publicationDateLabel } from "@/lib/publications/content";
import { doiUrl } from "@/lib/publications/doi";
import { researchInterests } from "@/lib/membership/options";
import { newsCanonical } from "@/lib/news/seo";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const c=await publishedPublication((await params).slug);return c?{title:c.title+" | NOSEE",description:c.abstract.slice(0,160)||[c.authors.join("; "),publicationDateLabel(c.publicationDate),c.source].filter(Boolean).join(" · ").slice(0,160),alternates:{canonical:newsCanonical("/publications/"+c.slug)},robots:{index:false,follow:false}}:{title:"Page not found — NOSEE",robots:{index:false,follow:false}};}
export default async function PublicationPage({params}:Props){const c=await publishedPublication((await params).slug);if(!c)notFound();return <div className="pt-[var(--expanded-navbar-offset)] pb-24"><Container className="pt-10 lg:pt-6"><article className="mx-auto max-w-[56rem]">
 <Link href="/publications" className="text-sm font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">Back to publications</Link>
 <header className="mt-8 border-b border-line-mild pb-8"><p className="text-sm font-medium text-brand">{c.type.replaceAll("-"," ")}</p><h1 className="mt-4 break-words font-heading text-4xl leading-tight font-semibold lg:text-5xl">{c.title}</h1>{c.authors.length>0&&<p className="mt-6 text-lg leading-8 text-secondary">{c.authors.join("; ")}</p>}<p className="mt-4 text-secondary"><PublicationDate value={c.publicationDate} />{c.source&&<> · <span className="italic">{c.source}</span></>}</p></header>
 <dl className="space-y-6 border-b border-line-mild py-8">{c.doi&&<div><dt className="text-sm font-medium text-secondary">DOI</dt><dd className="mt-2 break-words"><a href={doiUrl(c.doi)} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">{c.doi}</a></dd></div>}{c.researchAreas.length>0&&<div><dt className="text-sm font-medium text-secondary">Research areas</dt><dd className="mt-2">{c.researchAreas.map(k=>researchInterests[k]).join(" · ")}</dd></div>}{c.group&&<div><dt className="text-sm font-medium text-secondary">Research group</dt><dd className="mt-2">{c.group.name}</dd></div>}</dl>
 {c.abstract&&<section className="mt-10" aria-labelledby="publication-abstract-heading"><h2 id="publication-abstract-heading" className="font-heading text-2xl font-medium">Abstract / summary</h2><p className="mt-5 whitespace-pre-line text-lg leading-8 text-secondary">{c.abstract}</p></section>}
 {(c.referenceUrl||c.doi)&&<div className="mt-10"><a href={c.referenceUrl||doiUrl(c.doi)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-sm bg-brand px-6 py-3 font-medium text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">View publication<span className="sr-only"> (external site)</span></a><p className="mt-3 text-sm text-secondary">Access is provided by the external source.</p></div>}
 </article></Container></div>;}
