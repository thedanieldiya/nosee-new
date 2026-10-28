import "server-only";
export type StoredObject = {
  bytes: number;
  sha256: string;
  contentType: "image/webp";
};
export interface PrivateMediaStorage {
  readonly id: string;
  // Implementations must write immutable, private objects and verify the checksum/size.
  putPrivate(
    key: string,
    body: Uint8Array,
    metadata: StoredObject,
  ): Promise<void>;
  statPrivate(key: string): Promise<StoredObject | null>;
  readPrivate(key: string, maxBytes: number): Promise<Uint8Array>;
}
const testKey = Symbol.for("nosee.isolated-media-test-storage");
export function mediaStorage(): PrivateMediaStorage | null {
  // No durable adapter has been selected. Test code is never imported by the application.
  const env = Reflect.get(process, "env") as NodeJS.ProcessEnv;
  if (env.NODE_ENV !== "test" || env.VERCEL) return null;
  try {
    const db = new URL(env.DATABASE_URL ?? ""),
      origin = new URL(env.ADMIN_ORIGIN ?? "");
    if (
      db.hostname !== "127.0.0.1" ||
      db.port !== "55433" ||
      db.pathname !== "/nosee_admin01_test" ||
      origin.hostname !== "127.0.0.1"
    )
      return null;
  } catch {
    return null;
  }
  return (
    (globalThis as typeof globalThis & { [testKey]?: PrivateMediaStorage })[
      testKey
    ] ?? null
  );
}
