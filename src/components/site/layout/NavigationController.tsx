"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getNavigationState, type NavigationState } from "@/lib/content/navigation";

export function NavigationController() {
  const pathname = usePathname();
  useEffect(() => {
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    const state = getNavigationState(pathname);
    const records = new Map<string, NavigationState>();
    const collect = (items: NavigationState[]) => items.forEach((item) => {
      records.set(`${item.url}|${!!item.children}`, item);
      if (item.children) collect(item.children);
    });
    collect([...state.primary, ...state.utility]);
    document.querySelectorAll<HTMLAnchorElement>("[data-navigation-url]").forEach((link) => {
      const item = records.get(`${link.dataset.navigationUrl}|${link.dataset.navigationParent === "true"}`);
      const current = item?.current ?? (link.dataset.navigationUrl === "/" && state.homeCurrent);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      link.dataset.navigationActiveClasses?.split(" ").filter(Boolean).forEach((name) => link.classList.toggle(name, !!item?.active));
      link.dataset.navigationInactiveClasses?.split(" ").filter(Boolean).forEach((name) => link.classList.toggle(name, !item?.active));
    });

    const navigations = [...document.querySelectorAll<HTMLElement>("[data-scroll-navigation]")];
    const updateScrollState = () => navigations.forEach((navigation) => {
      const expanded = navigation.dataset.transparent === "true" && window.scrollY <= 24;
      navigation.dataset.navigationMode = expanded ? "expanded" : "compact";
      navigation.querySelectorAll<HTMLElement>("[data-navigation-expanded-only]").forEach((element) => { element.inert = !expanded; });
    });
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { ...options, passive: true });

    const navigation = document.querySelector<HTMLElement>("[data-mobile-navigation]")!;
    const menuButton = navigation.querySelector<HTMLButtonElement>("[data-mobile-menu-button]")!;
    const drawer = navigation.querySelector<HTMLElement>("[data-mobile-drawer]")!;
    const overlay = navigation.querySelector<HTMLButtonElement>("[data-mobile-overlay]")!;
    const openIcon = navigation.querySelector<HTMLElement>("[data-mobile-menu-open-icon]")!;
    const closeIcon = navigation.querySelector<HTMLElement>("[data-mobile-menu-close-icon]")!;
    const submenuButtons = [...navigation.querySelectorAll<HTMLButtonElement>("[data-mobile-submenu-button]")];
    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    let isOpen = false;
    let previousBodyOverflow = "";
    const submenu = (button: HTMLButtonElement) => document.getElementById(button.getAttribute("aria-controls")!)!;
    const resetSubmenus = () => submenuButtons.forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      submenu(button).hidden = true;
    });
    const openSubmenu = (button: HTMLButtonElement) => {
      button.setAttribute("aria-expanded", "true");
      submenu(button).hidden = false;
    };
    submenuButtons.forEach((button) => {
      button.toggleAttribute("data-mobile-active-submenu", !!records.get(`${button.dataset.navigationActiveUrl}|true`)?.active);
    });
    const focusableElements = () => [...drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")]
      .filter((element) => element.closest("[hidden]") === null);
    const closeDrawer = (restoreFocus = true) => {
      if (!isOpen) return;
      isOpen = false;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      drawer.hidden = true;
      overlay.hidden = true;
      openIcon.hidden = false;
      closeIcon.hidden = true;
      document.body.style.overflow = previousBodyOverflow;
      resetSubmenus();
      if (restoreFocus) menuButton.focus();
    };
    const openDrawer = () => {
      isOpen = true;
      previousBodyOverflow = document.body.style.overflow;
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", "Close navigation menu");
      drawer.hidden = false;
      overlay.hidden = false;
      openIcon.hidden = true;
      // Retain the source's hidden CSS class as well as its hidden-property toggle.
      closeIcon.hidden = false;
      document.body.style.overflow = "hidden";
      resetSubmenus();
      const activeSubmenu = submenuButtons.find((button) => button.hasAttribute("data-mobile-active-submenu"));
      if (activeSubmenu) openSubmenu(activeSubmenu);
      focusableElements()[0]?.focus();
    };
    menuButton.addEventListener("click", () => isOpen ? closeDrawer() : openDrawer(), options);
    overlay.addEventListener("click", () => closeDrawer(), options);
    drawer.querySelectorAll("a[href]").forEach((link) => link.addEventListener("click", () => closeDrawer(), options));
    submenuButtons.forEach((button) => button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";
      resetSubmenus();
      if (shouldOpen) openSubmenu(button);
    }, options));
    desktopQuery.addEventListener("change", (event) => { if (event.matches) closeDrawer(false); }, options);
    document.addEventListener("keydown", (event) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements();
      const first = elements[0];
      const last = elements.at(-1)!;
      if (!drawer.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }, options);
    return () => { listeners.abort(); closeDrawer(false); };
  }, [pathname]);
  return null;
}
