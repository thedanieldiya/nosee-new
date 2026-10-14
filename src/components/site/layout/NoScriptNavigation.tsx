import MenuRegular from "@mingcute/react/core-regular/menu";
import CloseRegular from "@mingcute/react/core-regular/close";
import type { NavigationState } from "@/lib/content/navigation";
import { Container } from "@/components/site/ui/Container";
import { NavigationLink } from "./NavigationLink";

export function NoScriptNavigation({ primary, utility }: { primary: NavigationState[]; utility: NavigationState[] }) {
  return <noscript>
    <style>{`
      @media (width < 64rem) {
        [data-public-shell] { --expanded-navbar-offset: 0px; --compact-navbar-offset: 0px; }
        [data-mobile-navigation] { position: relative; }
        [data-mobile-menu-button] { display: none !important; }
      }
      @media (width >= 64rem) {
        #mission, #leadership, #collaborations { scroll-margin-top: calc(var(--expanded-navbar-offset) + 16px); }
      }
    `}</style>
    <details className="group/native-menu bg-default text-primary" data-native-navigation>
      <summary aria-label="Navigation menu" className="absolute top-3.5 right-4 z-30 flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-6 [&::-webkit-details-marker]:hidden">
        <MenuRegular size={32} className="size-8 group-open/native-menu:hidden" aria-hidden="true" focusable="false" data-ui-icon="menu" />
        <CloseRegular size={32} className="hidden size-8 group-open/native-menu:block" aria-hidden="true" focusable="false" data-ui-icon="close" />
      </summary>
      <Container className="py-5">
        <nav aria-label="Mobile navigation">
          <ul>{primary.map(item => <li key={item.url} className="border-b border-line-soft">
            <NavigationLink item={item} activeClassName="text-brand" className="flex min-h-11 items-center rounded-sm font-heading text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{item.label}</NavigationLink>
            {item.children && <ul className="pb-3 pl-4">{item.children.map(child => <li key={child.url}>
              <NavigationLink item={child} activeClassName="text-brand font-semibold" inactiveClassName="font-medium text-secondary" className="flex min-h-11 items-center rounded-sm px-3 font-body text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{child.label}</NavigationLink>
            </li>)}</ul>}
          </li>)}</ul>
          <ul className="mt-5 border-t border-line-mild pt-4">{utility.filter(item => !["Support NOSEE", "Login"].includes(item.label)).map(item => <li key={item.url}>
            <NavigationLink item={item} activeClassName="text-brand font-semibold" className="flex min-h-11 items-center rounded-sm font-body text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">{item.label}</NavigationLink>
          </li>)}</ul>
        </nav>
      </Container>
    </details>
  </noscript>;
}
