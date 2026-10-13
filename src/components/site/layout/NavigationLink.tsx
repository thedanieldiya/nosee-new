"use client";

import type { ComponentPropsWithoutRef } from "react";
import { usePathname } from "next/navigation";
import { normalizePath, withActiveState, type NavigationState } from "@/lib/content/navigation";

// usePathname also supplies the correct route during SSR; the shell stays server-rendered.
export function NavigationLink({ item, className, activeClassName = "", inactiveClassName = "", children, ...props }: {
  item: NavigationState; activeClassName?: string; inactiveClassName?: string;
} & ComponentPropsWithoutRef<"a">) {
  const state = withActiveState([item], normalizePath(usePathname()))[0];
  return <a {...props} href={item.url} aria-current={state.current ? "page" : undefined}
    data-navigation-url={item.url} data-navigation-parent={item.children ? "true" : "false"} data-navigation-active-classes={activeClassName}
    data-navigation-inactive-classes={inactiveClassName || undefined}
    className={`${className ?? ""} ${state.active ? activeClassName : inactiveClassName}`}>{children}</a>;
}

export function NavigationSubmenuButton({ item, children, ...props }: {
  item: NavigationState;
} & ComponentPropsWithoutRef<"button">) {
  const state = withActiveState([item], normalizePath(usePathname()))[0];
  return <button {...props} data-navigation-active-url={item.url} data-mobile-active-submenu={state.active ? "" : undefined}>{children}</button>;
}
