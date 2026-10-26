// Use the same configured origin as the application; never invent a canonical host.
export function newsCanonical(path: string) {
  const configured = process.env.ADMIN_ORIGIN;
  if (!configured) return undefined;
  try {
    const origin = new URL(configured);
    if (origin.origin !== configured || (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)))) return undefined;
    return new URL(path, origin.origin).href;
  } catch { return undefined; }
}
