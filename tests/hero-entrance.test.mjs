import assert from "node:assert/strict";
import test from "node:test";
import { initializeHeroEntrance } from "../src/components/site/sections/hero-entrance.ts";

function harness(reduced = false) {
  const calls = [];
  const hero = {
    dataset: {}, ownerDocument: { timeline: { currentTime: 1000 } },
    querySelectorAll: (selector) => Array.from({ length: selector.includes(",") ? 2 : 1 }, () => ({
      style: { opacity: "", transform: "" }, animate(frames, options) {
        const animation = { cancel: () => { animation.cancelled = true; } };
        calls.push({ selector, frames, options, animation, element: this });
        return animation;
      },
    })),
  };
  return { hero, calls, window: { matchMedia: () => ({ matches: reduced }) } };
}

test("approved entrance keeps the six declared timings, easing, transforms and one shared start", () => {
  const h = harness();
  const stop = initializeHeroEntrance(h.hero, h.window);
  assert.deepEqual(h.calls.map(call => [call.options.delay, call.options.duration]),
    [[0,650],[180,400],[320,600],[480,500],[640,450],[820,400],[820,400]]);
  assert.deepEqual(h.calls.map(call => call.frames.transform), [
    ["scale(1.02)","scale(1)"], ["translateY(12px)","translateY(0px)"],
    ["translateY(20px)","translateY(0px)"], ["translateY(16px)","translateY(0px)"],
    ["translateY(12px)","translateY(0px)"], undefined, undefined,
  ]);
  for (const call of h.calls) {
    assert.deepEqual(call.frames.opacity, [0,1]);
    assert.equal(call.options.easing, "cubic-bezier(0.22, 1, 0.36, 1)");
    assert.equal(call.options.fill, "both");
    assert.equal(call.animation.startTime, 1000);
  }
  initializeHeroEntrance(h.hero, h.window);
  assert.equal(h.calls.length, 7);
  h.calls[0].animation.onfinish();
  assert.equal(h.calls[0].element.style.opacity, "");
  assert.equal(h.calls[0].element.style.transform, "");
  stop();
  assert.ok(h.calls.every(call => call.animation.cancelled && call.animation.onfinish === null));
  assert.equal(h.hero.dataset.heroEntrancePlayed, undefined);
  initializeHeroEntrance(h.hero, h.window);
  assert.equal(h.calls.length, 14);
});

test("reduced motion preserves fully visible server styling without animation calls", () => {
  const h = harness(true);
  const stop = initializeHeroEntrance(h.hero, h.window);
  assert.equal(h.calls.length, 0);
  stop();
  assert.equal(h.hero.dataset.heroEntrancePlayed, undefined);
});
