import Link from 'next/link';import {randomUUID} from 'node:crypto';
import {requirePermission} from '@/lib/admin/session';import {getHero} from '@/lib/site-content/service';
import {ContentEditor} from '@/components/admin/site-content/ContentEditor';import {HomeHero} from '@/components/site/sections/HomeHero';
export const dynamic='force-dynamic';export const metadata={title:'Homepage hero'};
export default async function HeroPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const actor=await requirePermission('website'),r=await getHero(actor),q=await searchParams;
if(q.preview==='1')return <main id="main-content" className="space-y-6 p-5"><Link className="underline" href="/admin/website/site-content/homepage">Back to editor</Link><h1 className="text-2xl font-semibold">Saved hero preview</h1><p className="text-secondary">Private working collection. Public visitors see the published snapshot.</p><HomeHero items={r.fields} /></main>;
return <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8"><h1 className="text-2xl font-semibold">Homepage</h1><ContentEditor key={r.version} kind="hero" id="homepage" initial={r.fields} published={r.publishedContent} version={r.version} status="published" requestId={randomUUID()} focusSaved={q.saved==='1'} /></main>;}
