import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/Container";
import { NewsBody } from "@/components/site/news/NewsBody";
import { newsCategoryLabel } from "@/lib/content/homepage-selections";
import { newsEditorialDate } from "@/lib/timezones";
import { publishedNewsArticle } from "@/lib/news/public";
import { newsCanonical } from "@/lib/news/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = process.env.DATABASE_URL ? await publishedNewsArticle(slug) : null;
  if (!article) return { title: "Page not found | NOSEE", robots: { index: false, follow: false } };
  return { title: article.title + " | NOSEE", description: article.excerpt, alternates: { canonical: newsCanonical("/news/" + article.slug) }, robots: { index: false, follow: false } };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = process.env.DATABASE_URL ? await publishedNewsArticle(slug) : null;
  if (!article) notFound();
  return <div className="pt-[var(--expanded-navbar-offset)] pb-24">
    <Container className="pt-10 lg:pt-6">
      <article className="mx-auto max-w-[52rem]">
        <Link href="/news" className="inline-flex text-sm font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">Back to News</Link>
        <header className="mt-8 border-b border-line-mild pb-8">
          <p className="text-sm font-medium text-brand">{newsCategoryLabel(article.category)}</p>
          <h1 className="mt-4 break-words font-heading text-4xl font-semibold leading-tight lg:text-5xl">{article.title}</h1>
          <time dateTime={article.publicationDate} className="mt-6 block text-sm text-secondary">{newsEditorialDate(article.publicationDate, article.publicationTimezone)}</time>
          {article.excerpt ? <p className="mt-7 text-lg leading-8 text-secondary">{article.excerpt}</p> : null}
        </header>
        {article.coverImage ? <Image src={article.coverImage} alt={article.coverAlt} width={1200} height={720} className="my-8 h-auto w-full object-cover" sizes="(min-width: 1024px) 830px, 100vw" /> : null}
        <div className="pt-2"><NewsBody value={article.body} /></div>
        <nav aria-label="Article navigation" className="mt-16 border-t border-line-mild pt-6"><Link href="/news" className="font-medium text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">More news</Link></nav>
      </article>
    </Container>
  </div>;
}
