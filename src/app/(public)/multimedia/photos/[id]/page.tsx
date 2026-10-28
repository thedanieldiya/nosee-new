import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/ui/Container";
import { publishedGalleryRecord } from "@/lib/gallery/public";
import { PhotoViewer } from "@/components/site/gallery/PhotoViewer";
import { newsCanonical } from "@/lib/news/seo";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const r = await publishedGalleryRecord((await params).id, "photo");
  return {
    title: r ? r.title + " | NOSEE" : "Page not found — NOSEE",
    robots: { index: false, follow: false },
    alternates: r
      ? { canonical: newsCanonical("/multimedia/photos/" + r.id) }
      : undefined,
  };
}
export default async function Photo({ params }: Props) {
  const r = await publishedGalleryRecord((await params).id, "photo");
  if (!r) notFound();
  return (
    <div className="pt-[var(--expanded-navbar-offset)] pb-24">
      <Container className="pt-10 lg:pt-6">
        <Link href="/multimedia" className="text-brand underline">
          Back to Gallery
        </Link>
        <h1 className="my-10 max-w-4xl break-words font-heading text-3xl font-semibold">
          {r.title}
        </h1>
        {r.imagesAvailable ? (
          <div className="max-w-3xl">
            <PhotoViewer single photos={r.photos} />
          </div>
        ) : (
          <p className="text-secondary">Photograph temporarily unavailable.</p>
        )}
      </Container>
    </div>
  );
}
