/* eslint-disable @next/next/no-img-element -- Preserve source logo sizing. */
import { site } from "@/lib/content/site";
import { Container } from "@/components/site/ui/Container";
import { ButtonLink, buttonClasses } from "@/components/site/ui/ButtonLink";
import { NewsletterController } from "./NewsletterController";

const footerLinkClasses = [
  "relative inline-flex min-h-11 items-center text-tertiary transition-colors hover:text-inverse",
  "focus-visible:text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "lg:min-h-0 lg:after:absolute lg:after:-inset-y-1 lg:after:inset-x-0",
  "lg:after:bg-[linear-gradient(currentColor,currentColor)] lg:after:bg-[length:0_1px] lg:after:bg-left-bottom lg:after:bg-no-repeat",
  "lg:after:transition-[background-size] lg:after:duration-300 lg:hover:after:bg-[length:100%_1px] lg:focus-visible:after:bg-[length:100%_1px]",
].join(" ");
const externalProps = (url: string) => /^https?:\/\//.test(url) ? { target: "_blank", rel: "noopener noreferrer" } : {};

export function SiteFooter() {
  const { description, link_groups, contact, social_links, legal_links, newsletter, support_url, copyright } = site.footer;
  const phoneHref = contact.phone.replace(/[^+\d]/g, "");
  return <footer className="overflow-x-clip bg-primary font-body text-secondary" data-site-footer>
    <Container className="py-16 lg:pt-24 lg:pb-8">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8" data-footer-main>
        <section className="order-1 lg:col-span-3" aria-label="About NOSEE" data-footer-organisation>
          <img src="/logoWhite.png" alt="NOSEE - Network of Space-Earth Environmentalists" width="160" height="48" className="h-auto w-40 max-w-full" />
          {description !== "" && <p className="mt-5 max-w-xs text-sm leading-6 text-tertiary">{description}</p>}
          <ul className="mt-8 flex flex-wrap items-center gap-3" aria-label="Social media">
            {social_links.map((link) => <li key={link.label}>
              <a href={link.url} aria-label={link.label} {...externalProps(link.url)} className="group flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:min-h-0 lg:min-w-0">
                <span aria-hidden="true" className="size-6 bg-tertiary transition-colors group-hover:bg-inverse group-focus-visible:bg-inverse"
                  style={{ WebkitMask: `url('${link.icon}') center / contain no-repeat`, mask: `url('${link.icon}') center / contain no-repeat` }} />
              </a>
            </li>)}
          </ul>
          <ButtonLink href={support_url} intent="secondary" variant="stroke" size="lg" {...externalProps(support_url)} className="mt-8 bg-default px-6 uppercase tracking-[0.02em]">Support NOSEE</ButtonLink>
        </section>
        <section className="order-2 lg:order-4 lg:col-span-4" aria-labelledby="footer-newsletter-heading" data-footer-newsletter>
          <h2 id="footer-newsletter-heading" className="font-heading text-2xl font-semibold text-tertiary lg:text-xl">{newsletter.heading}</h2>
          <p className="mt-4 leading-7">{newsletter.description}</p>
          <form action={newsletter.enabled ? newsletter.action : undefined} method={newsletter.enabled ? "post" : undefined}
            aria-disabled={!newsletter.enabled || undefined} aria-describedby={!newsletter.enabled ? "footer-newsletter-disabled" : undefined}
            className="mt-4 flex min-w-0 border-2 border-default bg-default" aria-label="Newsletter subscription"
            data-newsletter-enabled={String(newsletter.enabled)} data-newsletter-form={newsletter.enabled ? "" : undefined}>
            <label htmlFor="footer-newsletter-email" className="sr-only">{newsletter.label}</label>
            <input id="footer-newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder={newsletter.placeholder}
              disabled={!newsletter.enabled} data-newsletter-email={newsletter.enabled ? "" : undefined}
              className="h-12 min-w-0 flex-1 bg-default px-4 text-primary outline-none placeholder:text-secondary disabled:bg-surface disabled:text-disabled disabled:placeholder:text-disabled" />
            <button type="submit" disabled={!newsletter.enabled} data-newsletter-submit={newsletter.enabled ? "" : undefined}
              className={buttonClasses({ size: "lg", className: "rounded-none px-5" })}>{newsletter.button_label}</button>
          </form>
          {!newsletter.enabled && <p id="footer-newsletter-disabled" className="mt-2 text-sm text-tertiary">{newsletter.disabled_text}</p>}
          <p className="mt-2 text-sm text-red-300" role="alert" data-newsletter-error hidden>Unable to subscribe right now. Please try again.</p>
        </section>
        <section className="order-3 lg:order-2 lg:col-span-3" aria-labelledby="footer-contact-heading" data-footer-contact>
          <h2 id="footer-contact-heading" className="font-heading text-2xl font-semibold text-tertiary lg:text-xl">{contact.heading}</h2>
          <address className="mt-5 not-italic leading-7">
            <p className="max-w-sm">{contact.address}</p>
            <a className={`mt-3 ${footerLinkClasses}`} href={`mailto:${contact.email}`}>{contact.email}</a><br />
            {phoneHref !== "" ? <a className={`mt-1 ${footerLinkClasses}`} href={`tel:${phoneHref}`}>{contact.phone}</a> : <p className="mt-3">{contact.phone}</p>}
          </address>
        </section>
        <div className="order-4 space-y-10 lg:order-3 lg:col-span-2" data-footer-link-groups>
          {link_groups.map((group, index) => <nav key={group.heading} aria-labelledby={`footer-link-group-${index}`}>
            <h2 id={`footer-link-group-${index}`} className="font-heading text-2xl font-semibold text-tertiary lg:text-xl">{group.heading}</h2>
            <ul className="mt-4 space-y-1 lg:space-y-3">
              {group.links.map((link) => <li key={link.url}><a href={link.url} {...externalProps(link.url)} className={footerLinkClasses} data-footer-link>{link.label}</a></li>)}
            </ul>
          </nav>)}
        </div>
      </div>
      <div className="mt-14 border-t border-white/20 pt-8 lg:mt-24 lg:flex lg:items-center lg:justify-between" data-footer-legal-row>
        <p>{copyright}</p>
        <nav className="mt-3" aria-label="Legal">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legal_links.map((link, index) => <li key={link.url} className="flex items-center gap-5">
              {index !== 0 && <span aria-hidden="true">/</span>}
              <a href={link.url} {...externalProps(link.url)} className={footerLinkClasses} data-footer-link>{link.label}</a>
            </li>)}
          </ul>
        </nav>
      </div>
    </Container>
    {newsletter.enabled && <dialog className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md bg-default p-0 text-primary shadow-2xl backdrop:bg-black/70"
      aria-labelledby="newsletter-confirmation-title" aria-describedby="newsletter-confirmation-message" data-newsletter-dialog>
      <div className="p-6 text-center sm:p-8">
        <h2 id="newsletter-confirmation-title" className="font-heading text-2xl font-semibold">Subscription confirmed</h2>
        <p id="newsletter-confirmation-message" className="mt-4 leading-7 text-secondary">Thank you for subscribing! Look out for NOSEE&apos;s newletter in your mailbox</p>
        <button type="button" className={buttonClasses({ className: "mt-6" })} data-newsletter-dismiss>Dismiss</button>
      </div>
    </dialog>}
    <NewsletterController />
  </footer>;
}
