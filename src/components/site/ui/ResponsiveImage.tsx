/* eslint-disable @next/next/no-img-element -- Native picture keeps these images server-only. */
import type { ComponentPropsWithoutRef } from "react";
import { imageSourceSet } from "@/lib/content/public-images";

export function ResponsiveImage({ src, alt, sizes, loading = "lazy", decoding = "async", ...props }: ComponentPropsWithoutRef<"img"> & { src: string; alt: string; sizes: string }) {
  const avif = imageSourceSet(src, "avif"), webp = imageSourceSet(src, "webp");
  const image = <img {...props} alt={alt} src={src} loading={loading} decoding={decoding} />;
  return avif ? <picture className="contents">
    <source type="image/avif" srcSet={avif} sizes={sizes} />
    <source type="image/webp" srcSet={webp} sizes={sizes} />
    {image}
  </picture> : image;
}
