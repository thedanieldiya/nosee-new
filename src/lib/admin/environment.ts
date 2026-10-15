export function safePostgresUrl(value: string) {
  try {
    const database = new URL(value);
    return ["postgres:", "postgresql:"].includes(database.protocol) && (["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) || database.searchParams.get("sslmode") === "verify-full");
  } catch { return false; }
}
export function parseAdminConfig(environment: Record<string, string | undefined>) {
  const { DATABASE_URL: databaseUrl, BETTER_AUTH_SECRET: secret, ADMIN_ORIGIN: origin } = environment;
  if (!databaseUrl || !safePostgresUrl(databaseUrl) || !secret || secret.length < 32 || !origin) return null;
  try {
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.origin !== origin || url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
    return { databaseUrl, secret, origin, secureCookies: url.protocol === "https:" };
  } catch { return null; }
}
