import type { NewsRecord } from "@/lib/content/news";
import { Container } from "@/components/site/ui/Container";
import { TrendingNewsCard } from "@/components/site/cards/TrendingNewsCard";

export function HomeTrendingNews({ articles }: { articles: readonly NewsRecord[] }) {
  if (!articles.length) return null;
  return <section className="bg-surface py-10 md:py-16" aria-labelledby="trending-news-heading" data-trending-news-section data-reveal-section>
    <Container><div className="flex flex-col gap-8 md:gap-12">
      <h2 id="trending-news-heading" className="text-center font-heading text-[28px] leading-8 font-semibold md:text-5xl md:leading-[56px]" data-reveal-heading>What’s Trending</h2>
      <div className="flex flex-col gap-4 md:gap-8 xl:grid xl:grid-cols-2" data-trending-news-layout data-reveal-group>
        <div className="aspect-square" data-trending-news-featured data-reveal-item><TrendingNewsCard article={articles[0]} variant="featured" /></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8" data-trending-news-compact-grid>
          {articles.slice(1).map(article => <div key={article.slug} data-reveal-item><TrendingNewsCard article={article} variant="compact" /></div>)}
        </div>
      </div>
    </div></Container>
  </section>;
}
