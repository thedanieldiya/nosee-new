import type { Metadata } from "next";
import { ArrowRight } from "@/components/site/ui/ArrowRight";
import { ButtonLink } from "@/components/site/ui/ButtonLink";
import { Container } from "@/components/site/ui/Container";

export const metadata: Metadata = {
  title: "NOSEE — Foundation Preview",
  description: "Temporary review specimen for the NOSEE design-system foundation.",
  robots: { index: false, follow: false },
};

const colors = [
  ["Brand", "#13853d", "bg-brand"],
  ["Accent", "#1e4ec4", "bg-accent"],
  ["Primary", "#171717", "bg-primary"],
  ["Secondary", "#5c5c5c", "bg-secondary"],
  ["Tertiary", "#a3a3a3", "bg-tertiary"],
  ["Disabled", "#d1d1d1", "bg-disabled"],
  ["Default / inverse", "#ffffff", "bg-default"],
  ["Surface", "#f7f7f7", "bg-surface"],
] as const;

export default function FoundationPreview() {
  return (
    // Preview-only spacing: keep the specimen below the unchanged overlaid source header.
    <div className="pt-[var(--expanded-navbar-offset)]" data-foundation-preview-offset>
    <Container className="py-10 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-medium tracking-[0.04em] text-brand uppercase">Temporary review page</p>
        <h1 className="mt-4 text-[36px] leading-[42px] font-semibold lg:text-[56px] lg:leading-[64px]">
          NOSEE — Foundation Preview
        </h1>
        <p className="mt-5 text-base leading-7 text-secondary">
          A specimen of the original fonts, colors and public controls. This is not the NOSEE homepage.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3" aria-label="Preview sections">
        <ButtonLink href="#typography">Typography <ArrowRight /></ButtonLink>
        <ButtonLink href="#tokens" variant="stroke">Colors</ButtonLink>
        <ButtonLink href="#controls" variant="text">Controls</ButtonLink>
      </div>

      <section id="typography" aria-labelledby="typography-heading" className="mt-16 scroll-mt-8 border-t border-line-mild pt-8">
        <h2 id="typography-heading" className="text-[28px] leading-8 font-medium">Typography</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm text-secondary">Ubuntu Sans · headings</p>
            <p className="mt-3 font-heading text-2xl leading-8 font-medium">Research, data and collaboration.</p>
            <p className="mt-2 font-heading text-2xl leading-8 font-semibold">A shared scientific perspective.</p>
          </div>
          <div>
            <p className="text-sm text-secondary">IBM Plex Sans · body and controls</p>
            <p className="mt-3 text-base leading-7">Readable public content, with local fonts and native links.</p>
            <p className="mt-2 text-base leading-7 font-medium">Medium-weight supporting text.</p>
            <p className="mt-2 text-base leading-7 italic">An italic source or publication credit.</p>
          </div>
        </div>
      </section>

      <section id="tokens" aria-labelledby="tokens-heading" className="mt-16 scroll-mt-8 border-t border-line-mild pt-8">
        <h2 id="tokens-heading" className="text-[28px] leading-8 font-medium">Source colors</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colors.map(([name, value, background]) => (
            <li key={name}>
              <span aria-hidden="true" className={`block h-16 border border-line-mild ${background}`} />
              <p className="mt-3 text-sm font-medium">{name}</p>
              <p className="text-sm text-secondary">{value}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {(["soft", "mild", "strong"] as const).map((line) => (
            <p key={line} className={`border-t pt-3 text-sm text-secondary ${
              line === "soft" ? "border-line-soft" : line === "mild" ? "border-line-mild" : "border-line-strong"
            }`}>
              Line {line} · black at {line === "soft" ? "5" : line === "mild" ? "10" : "20"}%
            </p>
          ))}
        </div>
      </section>

      <section id="controls" aria-labelledby="controls-heading" className="mt-16 scroll-mt-8 border-t border-line-mild pt-8">
        <h2 id="controls-heading" className="text-[28px] leading-8 font-medium">Public action links</h2>
        <p className="mt-3 text-base leading-7 text-secondary">Native links with source sizes, variants and keyboard focus. Each enabled specimen links to a section on this page.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="#typography" size="sm">Small · 36px</ButtonLink>
          <ButtonLink href="#typography">Base · 44px</ButtonLink>
          <ButtonLink href="#typography" size="lg">Large · 48px <ArrowRight /></ButtonLink>
          <ButtonLink href="#controls" disabled>Disabled link</ButtonLink>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {(["primary", "secondary", "destructive"] as const).map((intent) => (
            <div key={intent}>
              <h3 className="text-lg leading-7 font-medium capitalize">{intent}</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {(["fill", "stroke", "text"] as const).map((variant) => (
                  <ButtonLink key={variant} href="#controls" intent={intent} variant={variant}>
                    {variant.charAt(0).toUpperCase() + variant.slice(1)} <ArrowRight />
                  </ButtonLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
    </div>
  );
}
