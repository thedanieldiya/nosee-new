import Image from "next/image";
import { DescriptionView } from "@/components/admin/research/DescriptionView";
import { descriptionText } from "@/lib/research/description";
import type { NewsContent } from "@/lib/news/options";
import { newsCategoryLabel } from "@/lib/content/homepage-selections";
import { dateTime } from "@/components/admin/ManagementShared";
export function NewsContentView({ content }: { content: NewsContent }) {
  return <article className="space-y-5 break-words"><h2 className="font-heading text-2xl font-semibold">{content.title}</h2><p className="text-sm text-secondary">{newsCategoryLabel(content.category)} · {dateTime(content.publicationDate)}{content.featured ? " · Featured" : ""}</p>{content.coverImage ? <Image src={content.coverImage} alt={content.coverAlt} width={1000} height={600} className="max-h-96 w-full rounded-md object-cover" /> : null}{content.excerpt ? <p className="text-lg leading-relaxed">{content.excerpt}</p> : null}{descriptionText(content.body) ? <DescriptionView value={content.body} /> : <p className="text-secondary">No article body saved.</p>}</article>;
}
