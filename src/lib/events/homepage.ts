// Match News: do not load the database reader when public configuration is absent.
export async function homepageEvents() {
  if (!process.env.DATABASE_URL) return [];
  return (await import("./public.ts")).homepageEvents();
}
