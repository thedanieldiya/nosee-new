export function PublicEventPagination({ path, q, type, page, pages, pageParam = "page", otherPage = 1 }: { path: string; q: string; type: string; page: number; pages: number; pageParam?: string; otherPage?: number }) {
  const href = (n: number) => path + "?" + new URLSearchParams({ q, type, [pageParam]: String(n), [pageParam === "page" ? "ongoingPage" : "page"]: String(otherPage) });
  return pages > 1 ? <nav aria-label={pageParam === "ongoingPage" ? "Ongoing event pages" : "Event pages"} className="mt-8 flex items-center justify-between gap-4 border-t border-line-soft py-5">{page > 1 ? <a className="underline" href={href(page - 1)}>Previous</a> : <span />}<p>Page {page} of {pages}</p>{page < pages ? <a className="underline" href={href(page + 1)}>Next</a> : <span />}</nav> : null;
}
