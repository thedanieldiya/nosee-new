const SWIPE_THRESHOLD = 50;

// Pinned profile-carousel.js behavior; disposal is required for React remounts.
export function initializeProfileCarousel(carousel: HTMLElement, windowObject: Window = window) {
  const viewport = carousel.querySelector<HTMLElement>("[data-profile-viewport]");
  const track = carousel.querySelector<HTMLElement>("[data-profile-track]");
  const slides = [...carousel.querySelectorAll<HTMLElement>("[data-profile-slide]")];
  const indicators = [...carousel.querySelectorAll<HTMLElement>("[data-profile-indicator]")];
  const indicatorGroup = carousel.querySelector<HTMLElement>("[data-profile-indicators]");
  const arrowGroup = carousel.querySelector<HTMLElement>("[data-profile-arrows]");
  const previousButton = carousel.querySelector<HTMLElement>("[data-profile-previous]");
  const nextButton = carousel.querySelector<HTMLElement>("[data-profile-next]");
  const tabletQuery = windowObject.matchMedia("(min-width: 40rem)");
  const desktopQuery = windowObject.matchMedia("(min-width: 64rem)");
  let profilesPerPage = desktopQuery.matches ? 3 : tabletQuery.matches ? 2 : 1;
  let currentIndex = 0;
  let pointerStart: { x: number; y: number } | undefined;
  if (!viewport || !track || slides.length === 0) return null;

  const removers: (() => void)[] = [];
  const on = (target: EventTarget, event: string, listener: EventListener) => {
    target.addEventListener(event, listener);
    removers.push(() => target.removeEventListener(event, listener));
  };
  const pageCount = () => Math.ceil(slides.length / profilesPerPage);
  const update = () => {
    const totalPages = pageCount();
    const activePage = Math.floor(currentIndex / profilesPerPage);
    const lastVisibleProfile = Math.min(currentIndex + profilesPerPage, slides.length);
    track.style.transform = `translateX(-${slides[currentIndex].offsetLeft}px)`;
    slides.forEach((slide, index) => {
      const visible = index >= currentIndex && index < lastVisibleProfile;
      slide.setAttribute("aria-hidden", String(!visible));
      slide.inert = !visible;
    });
    indicators.forEach((indicator, index) => {
      const active = index === activePage;
      const firstProfile = index * profilesPerPage + 1;
      const lastProfile = Math.min(firstProfile + profilesPerPage - 1, slides.length);
      indicator.hidden = index >= totalPages;
      indicator.setAttribute("aria-current", String(active));
      indicator.setAttribute("aria-label", firstProfile === lastProfile ? `Show profile ${firstProfile}` : `Show profiles ${firstProfile} to ${lastProfile}`);
      indicator.classList.toggle("bg-brand", active);
      indicator.classList.toggle("bg-disabled", !active);
    });
    if (indicatorGroup) indicatorGroup.hidden = totalPages <= 1;
    if (arrowGroup) arrowGroup.hidden = totalPages <= 1;
  };
  const showProfile = (requestedIndex: number) => {
    currentIndex = (requestedIndex + slides.length) % slides.length;
    update();
  };
  if (previousButton) on(previousButton, "click", () => showProfile(currentIndex - 1));
  if (nextButton) on(nextButton, "click", () => showProfile(currentIndex + 1));
  indicators.forEach((indicator, index) => on(indicator, "click", () => showProfile(index * profilesPerPage)));
  on(viewport, "pointerdown", event => {
    const pointer = event as PointerEvent;
    if (!tabletQuery.matches && pointer.isPrimary !== false) pointerStart = { x: pointer.clientX, y: pointer.clientY };
  });
  on(viewport, "pointerup", event => {
    if (!pointerStart || tabletQuery.matches) { pointerStart = undefined; return; }
    const pointer = event as PointerEvent;
    const horizontalDistance = pointerStart.x - pointer.clientX;
    const verticalDistance = pointerStart.y - pointer.clientY;
    pointerStart = undefined;
    if (Math.abs(horizontalDistance) >= SWIPE_THRESHOLD && Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
      showProfile(currentIndex + (horizontalDistance > 0 ? 1 : -1));
    }
  });
  on(viewport, "pointercancel", () => { pointerStart = undefined; });
  const handleViewportChange = () => {
    profilesPerPage = desktopQuery.matches ? 3 : tabletQuery.matches ? 2 : 1;
    update();
  };
  on(tabletQuery, "change", handleViewportChange);
  on(desktopQuery, "change", handleViewportChange);
  on(windowObject, "resize", update);
  update();
  return { currentIndex: () => currentIndex, pageCount, showProfile, dispose: () => removers.forEach(remove => remove()) };
}
