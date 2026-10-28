import type { Metadata } from "next";
import Link from "next/link";
import { PublicationDate } from "@/components/site/publications/PublicationDate";
import { Container } from "@/components/site/ui/Container";
import { publishedPublications,publicPublicationQuery } from "@/lib/publications/public";
import { publicationTypes } from "@/lib/publications/input";
import { researchInterests } from "@/lib/membership/options";
import { newsCanonical } from "@/lib/news/seo";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Publications | NOSEE",alternates:{canonical:newsCanonical("/publications")},robots:{index:false,follow:false}};
export default async function PublicationsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=publicPublicationQuery.safeParse(await searchParams);
 if(!query.success)return <div className="pt-[var(--expanded-navbar-offset)] pb-20"><Container className="pt-10"><h1 className="font-heading text-4xl font-semibold">Publications</h1><p className="mt-6">Invalid search or filters.</p><Link className="underline text-brand" href="/publications">Clear filters</Link></Container></div>;
 const data=await publishedPublications(query.data),q=query.data;
 const href=(page:number)=>"/publications?"+new URLSearchParams({q:q.q,type:q.type,area:q.area,page:String(page)});
 return <div className="pt-[var(--expanded-navbar-offset)] pb-24"><Container className="pt-10 lg:pt-6"><header className="max-w-3xl"><p className="text-sm font-medium text-brand">Research outputs</p><h1 className="mt-3 font-heading text-4xl leading-tight font-semibold lg:text-5xl">Publications</h1></header>
 <form action="/publications" method="get" aria-label="Filter publications" className="mt-10 flex flex-wrap items-end gap-4 border-y border-line-mild py-6">
 <div className="min-w-0 grow"><label htmlFor="publication-search" className="block text-sm text-secondary">Search publications</label><input id="publication-search" name="q" type="search" maxLength={120} defaultValue={q.q} className="mt-2 h-11 w-full rounded-sm border border-line-strong px-3 focus-visible:outline-2 focus-visible:outline-accent" /></div>
 <div><label htmlFor="publication-filter-type" className="block text-sm text-secondary">Type</label><select id="publication-filter-type" name="type" defaultValue={q.type} className="mt-2 h-11 max-w-full rounded-sm border border-line-strong px-3 focus-visible:outline-2 focus-visible:outline-accent"><option value="">All types</option>{publicationTypes.map(t=><option key={t} value={t}>{t.replaceAll("-"," ")}</option>)}</select></div>
 <div className="min-w-0"><label htmlFor="publication-filter-area" className="block text-sm text-secondary">Research area</label><select id="publication-filter-area" name="area" defaultValue={q.area} className="mt-2 h-11 max-w-full rounded-sm border border-line-strong px-3 focus-visible:outline-2 focus-visible:outline-accent"><option value="">All areas</option>{Object.entries(researchInterests).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div><button type="submit" className="min-h-11 rounded-sm bg-brand px-5 font-medium text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Search</button>
 </form>
 {data.rows.length?<ol className="divide-y divide-line-mild">{data.rows.map(c=><li key={c.slug} className="py-8 lg:py-10"><p className="text-sm text-secondary">{c.type.replaceAll("-"," ")} · <PublicationDate value={c.publicationDate} /></p><h2 className="mt-3 max-w-4xl break-words font-heading text-2xl leading-8 font-medium lg:text-3xl lg:leading-10"><Link className="rounded-sm hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href={"/publications/"+c.slug}>{c.title}</Link></h2>{c.authors.length>0&&<p className="mt-3 max-w-4xl text-secondary">{c.authors.join("; ")}</p>}{c.source&&<p className="mt-2 italic text-secondary">{c.source}</p>}</li>)}</ol>:<p className="py-16 text-center text-xl text-secondary">No published publications match these filters.</p>}
 {data.pages>1&&<nav aria-label="Publication pages" className="mt-8 flex items-center justify-between border-t border-line-mild pt-6">{data.page>1?<Link href={href(data.page-1)} className="underline text-brand">Previous</Link>:<span/>}<p>Page {data.page} of {data.pages}</p>{data.page<data.pages?<Link href={href(data.page+1)} className="underline text-brand">Next</Link>:<span/>}</nav>}
 </Container></div>;
}
