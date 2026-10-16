import type { NewsRecord } from "../content/news.ts";
// Delay loading the server-only database reader when no database is configured.
export async function homepageNews(): Promise<NewsRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  try { return await (await import("./public.ts")).publishedNewsFeed(); }
  catch { console.error("Published news feed unavailable."); return []; } // Public homepage remains readable; no fixture fallback or private error output.
}
