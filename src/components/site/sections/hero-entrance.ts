// Owner-approved correction of the source's ineffective motion/mini sequence call.
export const heroEntranceStages = [
  { selector: "[data-hero-entrance-visual]", duration: 650, delay: 0, transform: ["scale(1.02)", "scale(1)"] },
  { selector: "[data-hero-entrance-eyebrow]", duration: 400, delay: 180, transform: ["translateY(12px)", "translateY(0px)"] },
  { selector: "[data-hero-entrance-title]", duration: 600, delay: 320, transform: ["translateY(20px)", "translateY(0px)"] },
  { selector: "[data-hero-entrance-summary]", duration: 500, delay: 480, transform: ["translateY(16px)", "translateY(0px)"] },
  { selector: "[data-hero-entrance-cta]", duration: 450, delay: 640, transform: ["translateY(12px)", "translateY(0px)"] },
  { selector: "[data-hero-entrance-credit], [data-hero-entrance-indicators]", duration: 400, delay: 820 },
] as const;

export function initializeHeroEntrance(hero: HTMLElement, windowObject: Window = window) {
  if (hero.dataset.heroEntrancePlayed === "true") return () => {};
  hero.dataset.heroEntrancePlayed = "true";
  const animations: Animation[] = [];
  if (!windowObject.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const startTime = hero.ownerDocument.timeline.currentTime;
    heroEntranceStages.forEach((stage) => {
      hero.querySelectorAll<HTMLElement>(stage.selector).forEach((element) => {
        const originalOpacity = element.style.opacity;
        const originalTransform = element.style.transform;
        const frames: PropertyIndexedKeyframes = { opacity: [0, 1] };
        if ("transform" in stage) frames.transform = [...stage.transform];
        const animation = element.animate(frames, {
          duration: stage.duration, delay: stage.delay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both",
        });
        animation.startTime = startTime;
        animation.onfinish = () => {
          element.style.opacity = originalOpacity;
          if ("transform" in stage) element.style.transform = originalTransform;
          animation.cancel();
        };
        animations.push(animation);
      });
    });
  }
  return () => {
    animations.forEach((animation) => { animation.onfinish = null; animation.cancel(); });
    delete hero.dataset.heroEntrancePlayed;
  };
}
