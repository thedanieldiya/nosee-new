"use client";

import { useEffect } from "react";
import { initializeHeroCarousel } from "./hero-carousel";
import { initializeHeroEntrance } from "./hero-entrance";

export function HeroController() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero-carousel]");
    if (!hero) return;
    const carousel = initializeHeroCarousel(hero);
    const stopEntrance = initializeHeroEntrance(hero);
    return () => { carousel.destroy(); stopEntrance(); };
  }, []);
  return null;
}
