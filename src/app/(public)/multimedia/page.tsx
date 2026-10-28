/* eslint-disable @next/next/no-img-element -- Own-origin bounded, authenticated-by-publication image delivery. */
import Link from "next/link";
import { Container } from "@/components/site/ui/Container";
import { publishedGallery } from "@/lib/gallery/public";
import { publicGalleryQuery } from "@/lib/gallery/input";
import { newsCanonical } from "@/lib/news/seo";
import { GalleryPagination } from "@/components/site/gallery/GalleryPagination";
import { PhotoViewer } from "@/components/site/gallery/PhotoViewer";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Gallery | NOSEE",
  robots: { index: false, follow: false },
  alternates: { canonical: newsCanonical("/multimedia") },
};
export default async function Gallery({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams,
    parsed = publicGalleryQuery.safeParse(raw),
    q = parsed.success ? parsed.data : publicGalleryQuery.parse({}),
    data = await publishedGallery(q);
  return (
    <div className="pt-[var(--expanded-navbar-offset)] pb-24">
      <Container className="pt-10 lg:pt-6">
        <h1 className="font-heading text-4xl font-semibold lg:text-5xl">
          Gallery
        </h1>
        <form method="get" className="my-10 flex flex-wrap items-end gap-5">
          <div className="min-w-0 grow">
            <label htmlFor="gallery-q" className="mb-2 block font-medium">
              Search Gallery
            </label>
            <input
              id="gallery-q"
              name="q"
              maxLength={120}
              defaultValue={q.q}
              className="min-h-11 w-full rounded-sm border border-line-strong px-3 focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <div>
            <label htmlFor="gallery-kind" className="mb-2 block font-medium">
              Show
            </label>
            <select
              id="gallery-kind"
              name="kind"
              defaultValue={q.kind}
              className="min-h-11 rounded-sm border border-line-strong px-3"
            >
              <option value="">Photos and albums</option>
              <option value="photo">Standalone photos</option>
              <option value="album">Albums</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-11 rounded-sm bg-brand px-6 py-3 font-medium text-inverse focus-visible:outline-2 focus-visible:outline-accent"
          >
            Search
          </button>
          <Link
            href="/multimedia"
            className="inline-flex min-h-11 items-center text-brand underline"
          >
            Clear
          </Link>
        </form>
        {!parsed.success && (
          <p role="alert" className="mb-6">
            Those filters could not be used. Showing the first page.
          </p>
        )}
        {data.rows.length ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.rows.map((r) => (
              <article key={r.id} className="min-w-0">
                {r.kind === "album" ? (
                  <>
                    <Link
                      href={"/multimedia/" + r.slug}
                      className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                    >
                      {r.imagesAvailable ? (
                        <img
                          src={r.image.thumbUrl}
                          alt={r.alt}
                          width={r.image.thumbWidth}
                          height={r.image.thumbHeight}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <p className="flex aspect-square items-center justify-center bg-surface p-4 text-secondary">
                          Photographs are temporarily unavailable.
                        </p>
                      )}
                      <h2 className="mt-4 break-words font-heading text-xl font-semibold">
                        {r.title}
                      </h2>
                    </Link>
                    {r.date && (
                      <time
                        dateTime={r.date}
                        className="mt-2 block text-sm text-secondary"
                      >
                        {r.date}
                      </time>
                    )}
                    <p className="mt-2 text-sm text-secondary">Album</p>
                  </>
                ) : r.imagesAvailable ? (
                  <PhotoViewer
                    single
                    photos={[
                      {
                        id: r.id,
                        label: r.title,
                        caption: r.title,
                        alt: r.alt,
                        image: r.image,
                      },
                    ]}
                  />
                ) : (
                  <>
                    <h2 className="break-words text-xl font-medium">
                      {r.title}
                    </h2>
                    <p className="mt-3 text-secondary">
                      Photograph temporarily unavailable.
                    </p>
                  </>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="my-16 text-lg text-secondary">
            No photographs or albums are published yet.
          </p>
        )}
        <GalleryPagination
          path="/multimedia"
          {...data}
          query={{ q: q.q, kind: q.kind }}
        />
      </Container>
    </div>
  );
}
