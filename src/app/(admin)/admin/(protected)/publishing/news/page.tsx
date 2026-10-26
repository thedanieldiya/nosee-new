import Link from "next/link";
import { requirePermission } from "@/lib/admin/session";
import { newsDirectory } from "@/lib/news/service";
import { newsQuery } from "@/lib/news/input";
import { newsPage } from "@/lib/news/page";
import { Field, Select, Pagination, dateTime } from "@/components/admin/ManagementShared";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "News" };
export const dynamic = "force-dynamic";
export default async function NewsDirectory({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), query = newsQuery.safeParse(await searchParams);
  if (!query.success) return <main id="main-content" className="p-5"><h1 className="text-2xl font-semibold">News</h1><p role="alert" className="my-5">Invalid search, status or page.</p><Link href="/admin/publishing/news" className="underline">Clear filters</Link></main>;
  const data = await newsPage(() => newsDirectory(actor, query.data));
  return <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8 lg:p-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">News</h1><Button asChild><Link href="/admin/publishing/news/new">Add article</Link></Button></div>
    <Card><CardContent><form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 grow"><Field id="news-q" label="Search articles"><Input id="news-q" name="q" maxLength={120} defaultValue={query.data.q} /></Field></div>
      <div className="min-w-40"><Field id="news-status" label="Status"><Select id="news-status" name="status" defaultValue={query.data.status}>
        <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option>
      </Select></Field></div><Button type="submit">Search</Button><Button asChild variant="outline"><Link href="/admin/publishing/news">Clear</Link></Button>
    </form></CardContent></Card>
    <Card aria-label="News articles">
      {data.rows.length ? <ul className="divide-y divide-line-mild">
        {data.rows.map(article => <li key={article.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-semibold"><Link href={"/admin/publishing/news/" + article.id} className="underline underline-offset-4">{article.title}</Link></h2>
            <p className="mt-2 text-sm text-secondary">Updated {dateTime(article.updatedAt)}</p>
            <p className="mt-2 text-sm font-medium">{article.status === "published" ? "Published" : article.status === "unpublished" ? "Unpublished" : "Draft"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ResearchAction endpoint={"/api/admin/news/" + article.id + "/publication"} payload={{ action: article.status === "published" ? "unpublish" : "publish", version: article.version }} title={article.status === "published" ? "Unpublish" : "Publish"} description={article.status === "published" ? "Remove the public article while retaining its working copy and snapshot." : "Publish the latest saved working copy to the website."} />
            <Button asChild variant="outline"><Link href={"/admin/publishing/news/" + article.id + "#delete-article-heading"}>Delete</Link></Button>
          </div>
        </li>)}
      </ul> : <p className="p-5 text-secondary">No articles match these filters.</p>}
      <Pagination path="/admin/publishing/news" query={{ q: query.data.q, status: query.data.status }} {...data} />
    </Card>
  </main>;
}
