import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requirePermission } from "@/lib/admin/session";
import { getNewsArticle } from "@/lib/news/service";
import { newsPage } from "@/lib/news/page";
import { NewsEditor } from "@/components/admin/news/NewsEditor";
import { NewsContentView } from "@/components/admin/news/NewsContentView";
import { Card, CardContent } from "@/components/ui/card";
export const metadata = { title: "News article", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePermission("publishing"), { id } = await params, article = await newsPage(() => getNewsArticle(actor, id)), query = await searchParams, mode = query.preview;
  if (mode === "1" || mode === "published") {
    const content = mode === "published" ? article.publishedContent : article; if (!content) notFound();
    return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><Link href={`/admin/publishing/news/${id}`} className="underline underline-offset-4">Back to editor</Link><h1 className="text-2xl font-semibold">{mode === "published" ? "Published snapshot preview" : "Saved working-copy preview"}</h1><p className="text-secondary">Private preview. Public article pages await an approved design.</p><Card><CardContent><NewsContentView content={content} /></CardContent></Card></main>;
  }
  return <main id="main-content" className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8 lg:p-10"><h1 className="text-2xl font-semibold">Edit article</h1><NewsEditor key={article.version} initial={article} id={id} version={article.version} status={article.status} hasSnapshot={!!article.publishedContent} focusSaved={query.saved === "1"} requestId={randomUUID()} /></main>;
}
