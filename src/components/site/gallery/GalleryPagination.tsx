import Link from "next/link";
export function GalleryPagination({
  path,
  page,
  pages,
  query = {},
}: {
  path: string;
  page: number;
  pages: number;
  query?: Record<string, string>;
}) {
  const href = (p: number) =>
    path + "?" + new URLSearchParams({ ...query, page: String(p) });
  return (
    <nav
      aria-label="Gallery pagination"
      className="mt-12 flex flex-wrap items-center justify-between gap-5 border-t border-line-mild pt-6"
    >
      <p className="text-sm text-secondary">
        Page {page} of {pages}
      </p>
      <div className="flex gap-6">
        {page > 1 && (
          <Link
            className="inline-flex min-h-11 items-center text-brand underline"
            href={href(page - 1)}
          >
            Previous page
          </Link>
        )}
        {page < pages && (
          <Link
            className="inline-flex min-h-11 items-center text-brand underline"
            href={href(page + 1)}
          >
            Next page
          </Link>
        )}
      </div>
    </nav>
  );
}
