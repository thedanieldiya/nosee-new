// Loaded explicitly by the isolated local test-server command only; no provider environment keys.
import { createGalleryTestStorage } from "./gallery-test-storage.mjs";
globalThis[Symbol.for("nosee.isolated-media-test-storage")] =
  await createGalleryTestStorage("/tmp/nosee-a11-private/storage");
