import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/site/ui/Container";
import { newsCategoryLabel } from "@/lib/content/homepage-selections";
import { newsEditorialDate } from "@/lib/timezones";
import { publishedNewsListing } from "@/lib/news/public";
import { newsCanonical } from "@/lib/news/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News | NOSEE", description: "Read the latest published news from NOSEE.", alternates: { canonical: newsCanonical("/news") }, robots: { index: false, follow: false } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewsPage({ searchParams }: Props) {
  const params = await searchParams, raw = params.page;
  const pageValue = Array.isArray(raw) ? raw.at(-1) : raw;
  const page = pageValue && /^[1-9]\d{0,5}$/.test(pageValue) ? Math.min(100000, Number(pageValue)) : 1;
  let unavailable = false;
  let result: Awaited<ReturnType<typeof publishedNewsListing>> = { rows: [], page: 1, pages: 1, total: 0 };
  if (process.env.DATABASE_URL) {
    try { result = await publishedNewsListing(page); }
    catch { unavailable = true; console.error("Public News listing unavailable."); }
  }
  return <div className="pt-[var(--expanded-navbar-offset)] pb-20">
    <Container className="pt-10 lg:pt-6">
      <header className="max-w-3xl border-b border-line-mild pb-8 lg:pb-12">
        <h1 className="font-heading text-[40px] leading-[48px] font-semibold text-primary lg:text-5xl">News</h1>
        <p className="mt-4 text-base leading-7 text-secondary lg:text-xl">Updates, research developments and activities from NOSEE.</p>
      </header>
      {!result.rows.length ? <section className="py-16" aria-live="polite">
        <h2 className="font-heading text-2xl font-semibold">{unavailable ? "News is temporarily unavailable" : "No published news yet"}</h2>
        <p className="mt-3 max-w-xl text-secondary">{unavailable ? "Please try again later." : "Published articles will appear here when they are available."}</p>
      </section> : <section aria-label="Published news" className="grid gap-6 py-10 md:grid-cols-2 lg:grid-cols-3">
        {result.rows.map(article => <article key={article.slug} className="flex min-w-0 flex-col overflow-hidden border border-line-mild bg-default">
          {article.image ? <Image src={article.image} alt={article.image_alt} width={720} height={440} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full object-cover" /> : null}
          <div className="flex grow flex-col p-5 md:p-6">
            <p className="text-xs font-medium text-brand">{newsCategoryLabel(article.category)}</p>
            <h2 className="mt-3 font-heading text-2xl font-semibold leading-snug"><Link href={"/news/"+article.slug} className="hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{article.title}</Link></h2>
            <p className="mt-3 grow text-base leading-7 text-secondary">{article.excerpt}</p>
            <time className="mt-6 border-t border-line-soft pt-4 text-sm text-secondary" dateTime={article.published_at}>{newsEditorialDate(article.published_at, article.editorial_timezone)}</time>
          </div>
        </article>)}
      </section>}
      {result.pages > 1 ? <nav aria-label="News pagination" className="flex items-center justify-between gap-4 border-t border-line-mild pt-6">
        <span className="text-sm text-secondary">Page {result.page} of {result.pages}</span>
        <div className="flex gap-3">
          {result.page > 1 ? <Link href={"/news?page="+(result.page - 1)} className="border border-line-strong px-4 py-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent">Previous</Link> : null}
          {result.page < result.pages ? <Link href={"/news?page="+(result.page + 1)} className="border border-line-strong px-4 py-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent">Next</Link> : null}
        </div>
      </nav> : null}
    </Container>
  </div>;
}
