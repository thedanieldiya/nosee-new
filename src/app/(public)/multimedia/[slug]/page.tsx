import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/Container";
import { publishedGalleryRecord } from "@/lib/gallery/public";
import { PhotoViewer } from "@/components/site/gallery/PhotoViewer";
import { GalleryPagination } from "@/components/site/gallery/GalleryPagination";
import { newsCanonical } from "@/lib/news/seo";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props) {
  const r = await publishedGalleryRecord((await params).slug, "album");
  return {
    title: r ? r.title + " | NOSEE" : "Page not found — NOSEE",
    robots: { index: false, follow: false },
    alternates: r
      ? { canonical: newsCanonical("/multimedia/" + r.slug) }
      : undefined,
  };
}
export default async function Album({ params, searchParams }: Props) {
  const { slug } = await params,
    q = await searchParams,
    page =
      typeof q.page === "string" && /^\d{1,6}$/.test(q.page)
        ? Number(q.page)
        : 1,
    r = await publishedGalleryRecord(slug, "album", page);
  if (!r) notFound();
  return (
    <div className="pt-[var(--expanded-navbar-offset)] pb-24">
      <Container className="pt-10 lg:pt-6">
        <Link href="/multimedia" className="text-brand underline">
          Back to Gallery
        </Link>
        <header className="my-10">
          <h1 className="break-words font-heading text-4xl font-semibold lg:text-5xl">
            {r.title}
          </h1>
          {r.date && (
            <p className="mt-5 text-secondary">
              <time dateTime={r.date}>{r.date}</time>
            </p>
          )}
          {r.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-line break-words text-lg leading-8 text-secondary">
              {r.description}
            </p>
          )}
          {r.event && (
            <p className="mt-5">
              <Link
                href={"/events/" + r.event.slug}
                className="text-brand underline"
              >
                {r.event.title}
              </Link>
            </p>
          )}
        </header>
        {r.imagesAvailable ? (
          <PhotoViewer photos={r.photos} />
        ) : (
          <p className="my-16 text-secondary">
            Photographs are temporarily unavailable.
          </p>
        )}
        <GalleryPagination path={"/multimedia/" + slug} {...r} />
      </Container>
    </div>
  );
}
