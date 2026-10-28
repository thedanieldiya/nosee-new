import Link from "next/link";
import { researchInterests } from "@/lib/membership/options";
import { requirePermission } from "@/lib/admin/session";
import { publicationsDirectory } from "@/lib/publications/service";
import { publicationQuery, publicationTypes } from "@/lib/publications/input";
import { publicationsPage } from "@/lib/publications/page";
import { Field, Select, Pagination, dateTime } from "@/components/admin/ManagementShared";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "Publications" };
export const dynamic = "force-dynamic";
export default async function PublicationsDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), query = publicationQuery.safeParse(await searchParams);
  if (!query.success) return <main id="main-content" className="p-5"><h1 className="text-2xl font-semibold">Publications</h1><p role="alert" className="my-5">Invalid search, status or page.</p><Link href="/admin/publishing/publications" className="underline">Clear filters</Link></main>;
  const data = await publicationsPage(() => publicationsDirectory(actor, query.data));
  return <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8 lg:p-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Publications</h1><Button asChild><Link href="/admin/publishing/publications/new">Add publication</Link></Button></div>
    <Card><CardContent><form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 grow"><Field id="publications-q" label="Search publications"><Input id="publications-q" name="q" maxLength={120} defaultValue={query.data.q} /></Field></div>
      <div className="min-w-40"><Field id="publications-status" label="Status"><Select id="publications-status" name="status" defaultValue={query.data.status}>
        <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option>
      </Select></Field></div><Field id="publications-type" label="Type"><Select id="publications-type" name="type" defaultValue={query.data.type}><option value="">All types</option>{publicationTypes.map(t => <option key={t} value={t}>{t}</option>)}</Select></Field>
      <Field id="publications-area" label="Research area"><Select id="publications-area" name="area" defaultValue={query.data.area}><option value="">All areas</option>{Object.entries(researchInterests).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Select></Field><Button type="submit">Search</Button><Button asChild variant="outline"><Link href="/admin/publishing/publications">Clear</Link></Button>
    </form></CardContent></Card>
    <Card aria-label="Publications">
      {data.rows.length ? <ul className="divide-y divide-line-mild">
        {data.rows.map(publication => <li key={publication.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-semibold"><Link href={"/admin/publishing/publications/" + publication.id} className="underline underline-offset-4">{publication.title}</Link></h2>
            <p className="mt-2 text-sm text-secondary">Updated {dateTime(publication.updatedAt)}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium"><span>{publication.status === "published" ? "Published" : publication.status === "unpublished" ? "Unpublished" : "Draft"}</span>{publication.hasUnpublishedChanges ? <span className="rounded-md border border-line-mild px-2 py-0.5 text-xs text-secondary">Unpublished changes</span> : null}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResearchAction endpoint={"/api/admin/publications/" + publication.id + "/publication"} payload={{ action: publication.status === "published" ? "unpublish" : "publish", version: publication.version }} title={publication.status === "published" ? "Unpublish" : "Publish"} description={publication.status === "published" ? "Remove the public publication while retaining its working copy and snapshot." : "Publish the latest saved working copy to the website."} />
            <Button asChild variant="outline"><Link href={"/admin/publishing/publications/" + publication.id + "#delete-publication-heading"}>Delete</Link></Button>
          </div>
        </li>)}
      </ul> : <p className="p-5 text-secondary">No publications match these filters.</p>}
      <Pagination path="/admin/publishing/publications" query={{ q: query.data.q, status: query.data.status, type: query.data.type, area: query.data.area }} {...data} />
    </Card>
  </main>;
}
