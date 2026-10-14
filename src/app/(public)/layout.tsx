import type { ReactNode } from "react";
import { SiteNavigation } from "@/components/site/layout/SiteNavigation";
import { SiteFooter } from "@/components/site/layout/SiteFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div data-public-shell className="[--compact-navbar-offset:4.5rem] [--expanded-navbar-offset:clamp(12.3125rem,calc(5.8555rem+32.2266vw),16.5rem)] lg:[--compact-navbar-offset:6.5rem] lg:[--expanded-navbar-offset:8.75rem] xl:[--expanded-navbar-offset:10.25rem]">
    <SiteNavigation />
    <main id="main-content">{children}</main>
    <SiteFooter />
  </div>;
}
