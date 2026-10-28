import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {requirePermission} from '@/lib/admin/session';
import {getPrivacy,getPrivacyVersion} from '@/lib/privacy/service';
import {publicationsPage} from '@/lib/publications/page';
import {ContentEditor} from '@/components/admin/site-content/ContentEditor';
import {PrivacyPolicyContent} from '@/components/site/privacy/PrivacyPolicyContent';
import {dateTime} from '@/components/admin/ManagementShared';
export const dynamic='force-dynamic';
export const metadata={title:'Privacy policy'};
const path='/admin/website/site-content/privacy';
export default async function PrivacyEditor({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const actor=await requirePermission('website'),q=await searchParams;
 if(typeof q.publishedVersion==='string'){
  const policy=await publicationsPage(()=>getPrivacyVersion(actor,q.publishedVersion as string));
  return <main id="main-content" className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8"><Link href={path} className="underline">Back to editor</Link><h1 className="text-2xl font-semibold">Presented policy version</h1><p className="break-all text-secondary">{policy.version}{policy.isPlaceholder?' · Development placeholder, approval pending':''}</p><h2 className="text-xl font-semibold">{policy.title}</h2>{policy.effectiveDate&&<p>Effective {policy.effectiveDate}</p>}<PrivacyPolicyContent body={policy.body} /></main>;
 }
 const row=await getPrivacy(actor);
 if(q.preview==='1')return <main id="main-content" className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8"><Link href={path} className="underline">Back to editor</Link><h1 className="text-2xl font-semibold">Saved policy preview</h1><p className="text-secondary">Private working copy. The public policy changes only after explicit publication.</p><h2 className="text-xl font-semibold">{row.fields.title}</h2>{row.fields.effectiveDate&&<p>Effective {row.fields.effectiveDate}</p>}<PrivacyPolicyContent body={row.fields.body} /></main>;
 return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8"><h1 className="text-2xl font-semibold">Privacy policy</h1><p className="text-secondary">Save a working draft, preview it privately and publish approved wording. The currently published policy remains available throughout.</p>{row.isPlaceholder&&<p role="status" className="rounded-md border border-line-mild p-4 text-secondary">The public policy is still the unapproved development placeholder. Keep it until approved replacement wording is supplied. Publishing does not certify legal compliance.</p>}<p className="text-sm text-secondary">Updated {dateTime(row.updatedAt)}{row.publishedAt?' · Published '+dateTime(row.publishedAt):''}</p><ContentEditor key={row.version} kind="privacy" id="privacy" initial={row.fields} published={row.publishedContent} version={row.version} status="published" requestId={randomUUID()} focusSaved={q.saved==='1'} /></main>;
}
