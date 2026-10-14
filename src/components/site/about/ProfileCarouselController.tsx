"use client";

import { useEffect } from "react";
import { initializeProfileCarousel } from "./profile-carousel";

export function ProfileCarouselController() {
  useEffect(() => {
    const carousel = document.querySelector<HTMLElement>("[data-profile-carousel]");
    const controller = carousel ? initializeProfileCarousel(carousel) : null;
    return () => controller?.dispose();
  }, []);
  return null;
}
