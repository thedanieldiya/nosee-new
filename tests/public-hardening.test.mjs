import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import sharp from "sharp";
import { render } from "./helpers/render-site.mjs";
import { approvedBadgeContrast } from "./helpers/public-hardening-exceptions.mjs";
const { publicImageWidths, imageSourceSet } = await import("../src/lib/content/public-images.ts");
const { HomeHero } = await import("../src/components/site/sections/HomeHero.tsx");
const { ResponsiveImage } = await import("../src/components/site/ui/ResponsiveImage.tsx");
const { NoScriptNavigation } = await import("../src/components/site/layout/NoScriptNavigation.tsx");
const { SiteFooter } = await import("../src/components/site/layout/SiteFooter.tsx");
const { eventTypes } = await import("../src/lib/content/events-listing.ts");

test("responsive candidates decode, preserve the exact source aspect and never upscale", async () => {
  for (const [src, widths] of Object.entries(publicImageWidths)) {
    const original = await sharp(new URL("../public" + src, import.meta.url).pathname).metadata();
    for (const format of ["avif", "webp"]) {
      for (const candidate of imageSourceSet(src, format).split(", ")) {
        const [url, descriptor] = candidate.split(" "), width = Number(descriptor.slice(0, -1));
        const file = new URL("../public" + url, import.meta.url);
        const metadata = await sharp(file.pathname).metadata();
        assert.equal(metadata.format, format === "avif" ? "heif" : "webp");
        assert.equal(metadata.width, width);
        assert.equal(metadata.height * original.width, metadata.width * original.height);
        assert.ok(width <= original.width && widths.includes(width));
        assert.ok(statSync(file).size > 0);
      }
    }
  }
});
test("hero discovers one preferred responsive preload and keeps both frames ready without original PNG preloads", () => {
  const html = render(HomeHero);
  assert.equal((html.match(/rel="preload"/g) ?? []).length, 1);
  assert.match(html, /type="image\/avif"[^>]*imageSrcSet=/);
  assert.match(html, /imageSizes="\(min-width: 1024px\) 100vw, 968px"/);
  assert.equal((html.match(/loading="eager" decoding="async"/g) ?? []).length, 2);
  assert.match(html, /fetchPriority="low"/);
  assert.doesNotMatch(html, /as="image" href="\/media\/home/);
});
test("native picture retains intrinsic attributes and original fallback; unknown images work without variants", () => {
  const props = { src: "/media/trending/trending1.png", alt: "Original description", width: 642, height: 642, sizes: "50vw", className: "size-full object-cover" };
  const html = render(ResponsiveImage, props);
  assert.match(html, /<picture class="contents"/);
  assert.match(html, /type="image\/avif"/); assert.match(html, /type="image\/webp"/);
  assert.match(html, /src="\/media\/trending\/trending1.png" loading="lazy" decoding="async"/);
  for (const attribute of ['alt="Original description"', 'width="642"', 'height="642"']) assert.ok(html.includes(attribute));
  assert.doesNotMatch(render(ResponsiveImage, { ...props, src: "/other.png" }), /picture|source/);
});
test("only the approved footer and meeting badge foregrounds change", () => {
  assert.match(render(SiteFooter), /data-site-footer/);
  assert.match(render(SiteFooter), /bg-primary font-body text-tertiary/);
  assert.equal(eventTypes.meeting.tag_classes, "bg-brand/10 text-[#0b5025]");
  const input = { tag_classes: "bg-brand/10 text-brand", title: "bg-brand/10 text-brand", child: { text: "unchanged" } };
  assert.deepEqual(approvedBadgeContrast(input), { ...input, tag_classes: "bg-brand/10 text-[#0b5025]" });
  assert.equal(input.tag_classes, "bg-brand/10 text-brand");
});
test("native navigation uses details semantics, no duplicate submenu IDs or fake dialog", () => {
  const html = render(NoScriptNavigation, { primary: [], utility: [] });
  assert.match(html, /<noscript>/); assert.match(html, /<details[^>]*data-native-navigation/);
  assert.match(html, /<summary aria-label="Navigation menu"/);
  assert.doesNotMatch(html, /role="dialog"|aria-modal=|id="mobile-submenu/);
  const navigation = readFileSync(new URL("../src/components/site/layout/SiteNavigation.tsx", import.meta.url), "utf8");
  assert.match(navigation, /data-mobile-menu-close-icon hidden/);
  assert.doesNotMatch(navigation, /className="[^"]*\bhidden\b[^"]*"[^>]*data-mobile-menu-close-icon/);
});
