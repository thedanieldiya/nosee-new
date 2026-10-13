const AUTOPLAY_DELAY = 6000;
const TRANSITION_DURATION = 400;
const SWIPE_THRESHOLD = 50;

// Literal source carousel behavior, with disposal for React unmount/Strict Mode.
export function initializeHeroCarousel(carousel: HTMLElement, windowObject: Window = window, documentObject: Document = document) {
  const track = carousel.querySelector<HTMLElement>("[data-hero-track]")!;
  const imageSlides = [...carousel.querySelectorAll<HTMLElement>("[data-hero-image-slide]")];
  const contentSlides = [...carousel.querySelectorAll<HTMLElement>("[data-hero-content-slide]")];
  const indicators = [...carousel.querySelectorAll<HTMLElement>("[data-hero-indicator]")];
  const desktopQuery = windowObject.matchMedia("(min-width: 64rem)");
  const reducedMotionQuery = windowObject.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let autoplayTimer: number | undefined;
  let transitionTimer: number | undefined;
  let isTransitioning = false;
  let isHovered = false;
  let hasFocus = false;
  let pointerStart: { x: number; y: number } | undefined;
  const removers: (() => void)[] = [];
  const on = (target: EventTarget, event: string, listener: EventListener) => {
    target.addEventListener(event, listener);
    removers.push(() => target.removeEventListener(event, listener));
  };
  const clearAutoplay = () => {
    if (autoplayTimer !== undefined) windowObject.clearTimeout(autoplayTimer);
    autoplayTimer = undefined;
  };
  const canAutoplay = () => contentSlides.length > 1 && desktopQuery.matches && !reducedMotionQuery.matches
    && !documentObject.hidden && !isHovered && !hasFocus;
  const updateSlides = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    imageSlides.forEach((slide, index) => slide.setAttribute("aria-hidden", String(index !== currentIndex)));
    contentSlides.forEach((slide, index) => {
      const active = index === currentIndex;
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      slide.classList.toggle("pointer-events-none", !active);
      slide.classList.toggle("opacity-0", !active);
      slide.classList.toggle("opacity-100", active);
      slide.classList.toggle("blur-sm", !active);
      slide.classList.toggle("blur-none", active);
    });
    indicators.forEach((indicator, index) => {
      const active = index === currentIndex;
      indicator.setAttribute("aria-current", String(active));
      indicator.classList.toggle("bg-inverse", active);
      indicator.classList.toggle("bg-transparent", !active);
    });
  };
  const scheduleAutoplay = () => {
    clearAutoplay();
    if (canAutoplay()) autoplayTimer = windowObject.setTimeout(() => {
      autoplayTimer = undefined;
      showSlide(currentIndex + 1);
      scheduleAutoplay();
    }, AUTOPLAY_DELAY);
  };
  const showSlide = (requestedIndex: number, manual = false) => {
    const nextIndex = (requestedIndex + contentSlides.length) % contentSlides.length;
    if (nextIndex === currentIndex) {
      if (manual) scheduleAutoplay();
      return false;
    }
    if (isTransitioning) return false;
    currentIndex = nextIndex;
    updateSlides();
    if (!reducedMotionQuery.matches) {
      isTransitioning = true;
      transitionTimer = windowObject.setTimeout(() => { isTransitioning = false; transitionTimer = undefined; }, TRANSITION_DURATION);
    }
    if (manual) scheduleAutoplay();
    return true;
  };
  const destroy = () => {
    clearAutoplay();
    if (transitionTimer !== undefined) windowObject.clearTimeout(transitionTimer);
    removers.forEach((remove) => remove());
    if (currentIndex !== 0) { currentIndex = 0; updateSlides(); }
  };
  if (contentSlides.length <= 1) return { currentIndex: () => currentIndex, showSlide, destroy };
  indicators.forEach((indicator) => on(indicator, "click", () => showSlide(Number(indicator.dataset.slideIndex), true)));
  on(carousel, "mouseenter", () => { isHovered = true; clearAutoplay(); });
  on(carousel, "mouseleave", () => { isHovered = false; scheduleAutoplay(); });
  on(carousel, "focusin", () => { hasFocus = true; clearAutoplay(); });
  on(carousel, "focusout", (event) => {
    if (!carousel.contains((event as FocusEvent).relatedTarget as Node | null)) { hasFocus = false; scheduleAutoplay(); }
  });
  on(carousel, "pointerdown", (event) => {
    const pointer = event as PointerEvent;
    if (!desktopQuery.matches && pointer.isPrimary !== false) pointerStart = { x: pointer.clientX, y: pointer.clientY };
  });
  on(carousel, "pointerup", (event) => {
    if (!pointerStart || desktopQuery.matches) { pointerStart = undefined; return; }
    const pointer = event as PointerEvent;
    const horizontal = pointerStart.x - pointer.clientX;
    const vertical = pointerStart.y - pointer.clientY;
    pointerStart = undefined;
    if (Math.abs(horizontal) >= SWIPE_THRESHOLD && Math.abs(horizontal) > Math.abs(vertical)) showSlide(currentIndex + (horizontal > 0 ? 1 : -1), true);
  });
  on(carousel, "pointercancel", () => { pointerStart = undefined; });
  on(documentObject, "visibilitychange", scheduleAutoplay);
  on(desktopQuery, "change", scheduleAutoplay);
  on(reducedMotionQuery, "change", () => {
    if (reducedMotionQuery.matches && transitionTimer !== undefined) {
      windowObject.clearTimeout(transitionTimer); transitionTimer = undefined; isTransitioning = false;
    }
    scheduleAutoplay();
  });
  scheduleAutoplay();
  return { currentIndex: () => currentIndex, showSlide, destroy };
}
