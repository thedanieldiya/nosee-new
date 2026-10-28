import Link from "next/link";
import { requirePermission } from "@/lib/admin/session";
import { galleryDirectory } from "@/lib/gallery/service";
import { galleryQuery } from "@/lib/gallery/input";
import {
  Field,
  Select,
  Pagination,
  dateTime,
} from "@/components/admin/ManagementShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ResearchAction } from "@/components/admin/research/ResearchAction";
import { mediaStorage } from "@/lib/media/storage";
export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };
export default async function GalleryDirectory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const a = await requirePermission("website"),
    p = galleryQuery.safeParse(await searchParams);
  if (!p.success)
    return (
      <main id="main-content" className="p-5">
        <h1>Gallery</h1>
        <p role="alert">Invalid Gallery filters.</p>
        <Link href="/admin/website/site-content/gallery">Clear filters</Link>
      </main>
    );
  const q = p.data,
    data = await galleryDirectory(a, q),
    root = "/admin/website/site-content/gallery";
  return (
    <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={root + "/photos/new"}>Add photo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={root + "/albums/new"}>Add album</Link>
          </Button>
        </div>
      </div>
      {!mediaStorage() && (
        <p
          role="status"
          className="rounded-md border border-line-mild p-4 text-secondary"
        >
          Uploads are not configured. Album metadata drafts work; image
          publication requires durable private storage.
        </p>
      )}
      <nav
        aria-label="Gallery collections"
        className="flex flex-wrap gap-5 text-sm"
      >
        {[
          ["All items", ""],
          ["Photos", "photo"],
          ["Albums", "album"],
        ].map(([label, kind]) => (
          <Link
            key={label}
            href={root + (kind ? "?kind=" + kind : "")}
            aria-current={q.kind === kind ? "page" : undefined}
            className="inline-flex min-h-11 items-center underline"
          >
            {label}
          </Link>
        ))}
      </nav>
      <Card>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 grow">
              <Field id="gallery-q" label="Search Gallery">
                <Input
                  id="gallery-q"
                  name="q"
                  maxLength={120}
                  defaultValue={q.q}
                />
              </Field>
            </div>
            <Field id="gallery-kind" label="Type">
              <Select id="gallery-kind" name="kind" defaultValue={q.kind}>
                <option value="">Photos and albums</option>
                <option value="photo">Standalone photos</option>
                <option value="album">Albums</option>
              </Select>
            </Field>
            <Field id="gallery-status" label="Status">
              <Select id="gallery-status" name="status" defaultValue={q.status}>
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </Select>
            </Field>
            <Button type="submit">Search</Button>
            <Button asChild variant="outline">
              <Link href={root}>Clear</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        {data.rows.length ? (
          <ul className="divide-y divide-line-mild">
            {data.rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap justify-between gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-semibold">
                    <Link
                      href={
                        root +
                        (r.kind === "photo" ? "/photos/" : "/albums/") +
                        r.id
                      }
                      className="underline"
                    >
                      {r.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-secondary">
                    {r.kind === "photo" ? "Standalone photo" : "Album"} ·{" "}
                    {r.count} {r.count === 1 ? "image" : "images"} · Updated{" "}
                    {dateTime(r.updatedAt)}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span>
                      {r.status === "published"
                        ? "Published"
                        : r.status === "unpublished"
                          ? "Unpublished"
                          : "Draft"}
                    </span>
                    {r.hasUnpublishedChanges && (
                      <span className="rounded-md border border-line-mild px-2 py-0.5 text-xs text-secondary">
                        Unpublished changes
                      </span>
                    )}
                  </p>
                </div>
                <ResearchAction
                  endpoint={"/api/admin/gallery/" + r.id + "/publication"}
                  payload={{
                    action: r.status === "published" ? "unpublish" : "publish",
                    version: r.version,
                  }}
                  title={r.status === "published" ? "Unpublish" : "Publish"}
                  description="Publish the latest saved Gallery snapshot, or remove its public eligibility. Publication requires finalized validated images."
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-secondary">
            No Gallery items match these filters.
          </p>
        )}
        <Pagination path={root} query={q} {...data} />
      </Card>
    </main>
  );
}
