/** Enforce certificate and hostname verification without editing provider-managed env vars. */
export function verifiedPostgresUrl(value: string): string | null {
  try {
    const database = new URL(value);
    if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.hostname) return null;
    if (["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) return value;

    // A remote URL must explicitly opt into verified TLS. Vercel/Neon supplies
    // sslmode=require; upgrade that mode before node-postgres parses the URL.
    if (database.searchParams.getAll("sslmode").length !== 1 || database.searchParams.has("ssl")) return null;
    const mode = database.searchParams.get("sslmode");
    if (mode === "verify-full") return value;
    if (mode !== "require") return null;
    database.searchParams.set("sslmode", "verify-full");
    return database.toString();
  } catch {
    return null;
  }
}

export function safePostgresUrl(value: string) {
  return verifiedPostgresUrl(value) !== null;
}

export function parseAdminConfig(environment: Record<string, string | undefined>) {
  const { DATABASE_URL: databaseUrl, BETTER_AUTH_SECRET: secret, ADMIN_ORIGIN: origin } = environment;
  const verifiedDatabaseUrl = verifiedPostgresUrl(databaseUrl ?? "");
  if (!verifiedDatabaseUrl || !secret || secret.length < 32 || !origin) return null;
  try {
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.origin !== origin || url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
    return { databaseUrl: verifiedDatabaseUrl, secret, origin, secureCookies: url.protocol === "https:" };
  } catch { return null; }
}
