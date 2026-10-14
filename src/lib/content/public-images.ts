// Exact-aspect variants of the eight homepage rasters; originals remain fallbacks.
export const publicImageWidths: Readonly<Record<string, readonly number[]>> = {
  "/media/home/hero-1.png": [1008, 1440],
  "/media/home/hero-2.jpg": [1112, 1668, 2224, 3336],
  "/media/monitoringDashboards/fRegionObservations.png": [300, 600],
  "/media/monitoringDashboards/rangeError.png": [300, 600],
  "/media/monitoringDashboards/tecDifference.png": [300, 600],
  "/media/trending/trending1.png": [321, 642],
  "/media/trending/trending2.png": [310],
  "/media/trending/trending3.png": [310],
};

export function imageSourceSet(src: string, format: "avif" | "webp") {
  const name = src.split("/").at(-1)!.replace(/\.[^.]+$/, "");
  return publicImageWidths[src]?.map(width => `/media/optimized/${name}-${width}.${format} ${width}w`).join(", ");
}
