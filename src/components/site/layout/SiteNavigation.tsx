/* eslint-disable @next/next/no-img-element -- Preserve source images and native navigation without prefetch. */
import { getNavigationState } from "@/lib/content/navigation";
import { Container } from "@/components/site/ui/Container";
import { buttonClasses } from "@/components/site/ui/ButtonLink";
import { NavigationController } from "./NavigationController";
import { NavigationLink, NavigationSubmenuButton } from "./NavigationLink";
import User3Regular from "@mingcute/react/core-regular/user-3";
import MenuRegular from "@mingcute/react/core-regular/menu";
import CloseRegular from "@mingcute/react/core-regular/close";
import DownRegular from "@mingcute/react/core-regular/down";
import { NoScriptNavigation } from "./NoScriptNavigation";

function AccountIcon() {
  return <User3Regular size={28} className="size-7" aria-hidden="true" focusable="false" data-ui-icon="account" />;
}

export function SiteNavigation() {
  // Link islands derive SSR/current state from usePathname without hydrating the whole shell.
  const { primary, utility, homeCurrent } = getNavigationState("/");
  const home = { label: "NOSEE", url: "/", enabled: true, active: homeCurrent, current: homeCurrent };
  return <>
    <header className="group/navigation fixed inset-x-0 top-0 z-40 hidden bg-black/70 text-inverse backdrop-blur-[10px] lg:block"
      data-desktop-navigation data-scroll-navigation data-transparent="true" data-navigation-mode="expanded">
      <Container className="flex h-[8.75rem] items-center [--desktop-navigation-content-height:5.8rem] transition-[height] duration-300 ease-out motion-reduce:transition-none group-data-[navigation-mode=compact]/navigation:h-[6.5rem] group-data-[navigation-mode=compact]/navigation:[--desktop-navigation-content-height:4.5rem] xl:h-[10.25rem] xl:[--desktop-navigation-content-height:7.5rem] xl:group-data-[navigation-mode=compact]/navigation:h-[6.5rem] xl:group-data-[navigation-mode=compact]/navigation:[--desktop-navigation-content-height:4.5rem]">
        <NavigationLink item={home}
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <img src="/logoWhite.png" alt="NOSEE" className="h-[var(--desktop-navigation-content-height)] w-auto transition-[height] duration-300 ease-out motion-reduce:transition-none" />
        </NavigationLink>
        <div className="flex h-[var(--desktop-navigation-content-height)] min-w-0 flex-1 flex-col pl-8 transition-[height] duration-300 ease-out motion-reduce:transition-none xl:pl-16">
          <nav className="flex h-1/2 items-center justify-end gap-1 overflow-hidden font-body" aria-label="Utility navigation">
            {utility.map((item) => item.label === "Support NOSEE" ?
              <NavigationLink key={item.url} item={item} activeClassName="underline decoration-2 decoration-white underline-offset-4"
                className={buttonClasses({ size: "sm", className: "ml-1 border-line-soft uppercase" })}>{item.label}</NavigationLink>
              : item.label === "Login" ? <span key={item.url} className="contents">
                <span className="mx-3 h-8 w-px shrink-0 bg-white" aria-hidden="true" />
                <NavigationLink item={item} aria-label="Admin sign in" className="flex size-9 shrink-0 items-center justify-center rounded-sm text-inverse transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><AccountIcon /></NavigationLink>
              </span> : <NavigationLink key={item.url} item={item} activeClassName="underline decoration-2 decoration-white underline-offset-4"
                className="inline-flex h-9 items-center rounded-sm px-5 text-base font-medium text-inverse transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{item.label}</NavigationLink>)}
          </nav>
          <nav className="h-1/2" aria-label="Primary navigation">
            <ul className="flex h-full w-full items-center justify-between gap-4 border-t border-white/20">
              {primary.map((item) => {
                const dropdown = item.label === "Data & Products" && item.children;
                return <li key={item.url} className={`group relative${dropdown ? " h-full" : ""}`}>
                  <NavigationLink item={item} aria-haspopup={dropdown ? true : undefined} activeClassName="underline decoration-2 decoration-white underline-offset-8"
                    className="flex h-full items-center rounded-sm font-heading text-sm font-bold whitespace-nowrap text-inverse uppercase transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent xl:text-lg">{item.label}</NavigationLink>
                  {dropdown && <div className="invisible absolute top-full left-1/2 z-10 min-w-48 -translate-x-1/2 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <ul className="rounded-md bg-default p-2 text-primary shadow-lg ring-1 ring-line-mild">
                      {item.children?.map((child) => <li key={child.url}><NavigationLink item={child} activeClassName="text-brand underline decoration-2"
                        className="block rounded-sm px-4 py-2 font-heading text-base font-medium whitespace-nowrap hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{child.label}</NavigationLink></li>)}
                    </ul>
                  </div>}
                </li>;
              })}
            </ul>
          </nav>
        </div>
      </Container>
    </header>

    <header className="group/navigation fixed inset-x-0 top-0 z-40 text-inverse lg:hidden"
      data-mobile-navigation data-scroll-navigation data-transparent="true" data-navigation-mode="expanded">
      <div className="relative z-20 bg-brand">
        <Container className="flex h-[4.5rem] items-center justify-between gap-4">
          <div className="flex items-center">
            {utility.map((item) => item.label === "Support NOSEE" ?
              <NavigationLink key={item.url} item={item} activeClassName="underline decoration-2 underline-offset-4"
                className={buttonClasses({ size: "sm", intent: "secondary", className: "!bg-white !text-brand uppercase hover:!bg-white/90 active:!bg-white/80" })}>{item.label}</NavigationLink>
              : item.label === "Login" ? <span key={item.url} className="contents">
                <span className="mx-3 h-8 w-px shrink-0 bg-white" aria-hidden="true" />
                <NavigationLink item={item} aria-label="Admin sign in" className="flex size-9 shrink-0 items-center justify-center rounded-sm text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><AccountIcon /></NavigationLink>
              </span> : null)}
          </div>
          <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-md text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-navigation-drawer" data-mobile-menu-button>
            <span className="relative block size-8" aria-hidden="true" data-mobile-menu-open-icon>
              <MenuRegular size={32} className="size-8" aria-hidden="true" focusable="false" data-ui-icon="menu" />
            </span>
            <span className="relative size-8" aria-hidden="true" data-mobile-menu-close-icon hidden>
              <CloseRegular size={32} className="size-8" aria-hidden="true" focusable="false" data-ui-icon="close" />
            </span>
          </button>
        </Container>
      </div>
      <div className="relative z-0 max-h-48 overflow-hidden bg-black/70 opacity-100 backdrop-blur-[10px] transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none group-data-[navigation-mode=compact]/navigation:pointer-events-none group-data-[navigation-mode=compact]/navigation:max-h-0 group-data-[navigation-mode=compact]/navigation:opacity-0" data-navigation-expanded-only>
        <Container className="py-4">
          <NavigationLink item={home} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <img src="/logoWhite.png" alt="NOSEE" className="mx-auto h-auto w-full max-w-[31.25rem]" />
          </NavigationLink>
        </Container>
      </div>
      <button type="button" className="fixed inset-x-0 top-[4.5rem] bottom-0 z-0 bg-black/60" aria-label="Close navigation menu" tabIndex={-1} data-mobile-overlay hidden />
      <div id="mobile-navigation-drawer" className="fixed inset-x-0 top-[4.5rem] z-10 max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-default text-primary shadow-xl"
        role="dialog" aria-modal="true" aria-label="Navigation menu" data-mobile-drawer hidden>
        <Container className="py-5">
          <nav aria-label="Mobile navigation">
            <ul>
              {primary.map((item, index) => <li key={item.url} className="border-b border-line-soft">
                <div className="flex min-h-11 items-stretch">
                  <NavigationLink item={item} activeClassName="text-brand" className="flex min-h-11 flex-1 items-center rounded-sm font-heading text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{item.label}</NavigationLink>
                  {item.children && <NavigationSubmenuButton item={item} type="button" className="group flex size-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                    aria-label={`Toggle ${item.label} submenu`} aria-expanded="false" aria-controls={`mobile-submenu-${index}`}
                    data-mobile-submenu-button>
                    <DownRegular size={20} className="size-5 transition-transform group-aria-expanded:rotate-180" aria-hidden="true" focusable="false" data-ui-icon="submenu" />
                  </NavigationSubmenuButton>}
                </div>
                {item.children && <ul id={`mobile-submenu-${index}`} className="pb-3 pl-4" data-mobile-submenu hidden>
                  {item.children.map((child) => <li key={child.url}><NavigationLink item={child} activeClassName="text-brand font-semibold"
                    className="flex min-h-11 items-center rounded-sm px-3 font-body text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                    inactiveClassName="font-medium text-secondary">{child.label}</NavigationLink></li>)}
                </ul>}
              </li>)}
            </ul>
            <div className="mt-5 border-t border-line-mild pt-4">
              <ul>{utility.filter((item) => !["Support NOSEE", "Login"].includes(item.label)).map((item) => <li key={item.url}>
                <NavigationLink item={item} activeClassName="text-brand font-semibold" className="flex min-h-11 items-center rounded-sm font-body text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{item.label}</NavigationLink>
              </li>)}</ul>
            </div>
          </nav>
        </Container>
      </div>
      <NoScriptNavigation primary={primary} utility={utility} />
    </header>
    <NavigationController />
  </>;
}
