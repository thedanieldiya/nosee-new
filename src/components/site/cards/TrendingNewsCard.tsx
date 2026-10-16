import type { NewsRecord } from "@/lib/content/news";
import { newsCategoryLabel, newsDateLabel } from "@/lib/content/homepage-selections";
import { ResponsiveImage } from "@/components/site/ui/ResponsiveImage";

export function TrendingNewsCard({ article, variant }: { article: NewsRecord; variant: "featured" | "compact" }) {
  if (!["featured", "compact"].includes(variant)) throw new Error(`Unsupported trending news card variant [${variant}].`);
  const featured = variant === "featured";
  const publishedDate = newsDateLabel(article.published_at);
  return <article className={`group relative aspect-square min-w-0 overflow-hidden bg-primary ${featured ? "md:col-span-2 md:row-span-2 size-full" : ""}`}
    data-trending-news-card data-variant={variant} data-mobile-variant="compact">
    <div
      className="relative block size-full text-inverse">
      {article.image ? <ResponsiveImage src={article.image} sizes={featured ? "(min-width: 1280px) 50vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)" : "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, calc(100vw - 32px)"} alt={article.image_alt} width="642" height="642"
        className="absolute inset-0 size-full object-cover origin-center transition-transform duration-300 group-hover:scale-[1.1] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : null}
      <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-black/10" aria-hidden="true" />
      <span className="sr-only">{newsCategoryLabel(article.category)}. {article.excerpt}</span>
      <time dateTime={article.published_at} className={`absolute top-4 right-4 bg-brand/70 px-3 py-2 font-body text-sm leading-5 font-medium md:top-5 md:right-5 ${featured ? "md:hidden" : ""}`}>{publishedDate}</time>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 md:p-6">
        <h3 className={`break-words font-heading font-medium ${featured ? "text-xl leading-7 md:text-[40px] md:leading-[48px]" : "text-xl leading-7"}`}>{article.title}</h3>
        <span className={`flex min-h-6 items-center gap-4 font-body text-base leading-6 font-medium ${featured ? "justify-start md:justify-between" : "justify-start"}`}>
          {featured && <time dateTime={article.published_at} className="hidden bg-brand/70 px-3 py-2 text-sm leading-5 md:block">{publishedDate}</time>}
        </span>
      </div>
    </div>
  </article>;
}
