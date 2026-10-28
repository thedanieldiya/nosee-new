// Behavioral cases adapted from the pinned source; actual DOM states also checked in Chromium.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { initializeProfileCarousel } from '../src/components/site/about/profile-carousel.ts';

function createElement(classes = []) {
    const attributes = new Map();
    const listeners = new Map();
    const classNames = new Set(classes);

    return {
        querySelector: () => null,
        hidden: false,
        inert: false,
        style: {},
        addEventListener(event, listener) {
            const eventListeners = listeners.get(event) ?? [];

            eventListeners.push(listener);
            listeners.set(event, eventListeners);
        },
        removeEventListener(event, listener) {
            listeners.set(event, (listeners.get(event) ?? []).filter(value => value !== listener));
        },
        listenerCount: () => [...listeners.values()].reduce((total, values) => total + values.length, 0),
        classList: {
            contains: (className) => classNames.has(className),
            toggle(className, force) {
                if (force) {
                    classNames.add(className);
                } else {
                    classNames.delete(className);
                }
            },
        },
        dispatch(event, detail = {}) {
            listeners.get(event)?.forEach((listener) => listener(detail));
        },
        getAttribute: (name) => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, value),
    };
}

function createMediaQuery(matches) {
    const listeners = [];

    return {
        matches,
        addEventListener(event, listener) {
            assert.equal(event, 'change');
            listeners.push(listener);
        },
        removeEventListener(event, listener) {
            assert.equal(event, 'change');
            const index = listeners.indexOf(listener);
            if (index >= 0) listeners.splice(index, 1);
        },
        listenerCount: () => listeners.length,
        change(matches) {
            this.matches = matches;
            listeners.forEach((listener) => listener({ matches }));
        },
    };
}

function createHarness({ count = 7, viewport = 'mobile' } = {}) {
    const track = createElement();
    const profileViewport = createElement();
    const slides = Array.from({ length: count }, (_, index) => ({
        ...createElement(),
        offsetLeft: index * 100,
    }));
    const indicators = Array.from({ length: count }, (_, index) => createElement(
        index === 0 ? ['bg-brand'] : ['bg-disabled'],
    ));
    const indicatorGroup = createElement();
    const arrowGroup = createElement();
    const previousButton = createElement();
    const nextButton = createElement();
    const tabletQuery = createMediaQuery(viewport !== 'mobile');
    const desktopQuery = createMediaQuery(viewport === 'desktop');
    const windowObject = {
        ...createElement(),
        matchMedia: (query) => query.includes('64rem') ? desktopQuery : tabletQuery,
    };
    const carousel = {
        querySelector: (selector) => ({
            '[data-profile-viewport]': profileViewport,
            '[data-profile-track]': track,
            '[data-profile-indicators]': indicatorGroup,
            '[data-profile-arrows]': arrowGroup,
            '[data-profile-previous]': previousButton,
            '[data-profile-next]': nextButton,
        })[selector] ?? null,
        querySelectorAll: (selector) => ({
            '[data-profile-slide]': slides,
            '[data-profile-indicator]': indicators,
        })[selector] ?? [],
    };
    const controller = initializeProfileCarousel(carousel, windowObject);

    return {
        arrowGroup,
        controller,
        desktopQuery,
        indicatorGroup,
        indicators,
        nextButton,
        previousButton,
        profileViewport,
        slides,
        tabletQuery,
        track,
        windowObject,
        carousel,
    };
}

function swipe(viewport, fromX, toX, fromY = 0, toY = 0) {
    viewport.dispatch('pointerdown', { clientX: fromX, clientY: fromY, isPrimary: true });
    viewport.dispatch('pointerup', { clientX: toX, clientY: toY, isPrimary: true });
}

test('desktop groups seven profiles into three accessible pages', () => {
    const harness = createHarness({ viewport: 'desktop' });

    assert.equal(harness.controller.pageCount(), 3);
    assert.equal(harness.track.style.transform, 'translateX(-0px)');
    assert.deepEqual(harness.slides.map((slide) => slide.getAttribute('aria-hidden')), [
        'false', 'false', 'false', 'true', 'true', 'true', 'true',
    ]);
    assert.deepEqual(harness.indicators.map((indicator) => indicator.hidden), [
        false, false, false, true, true, true, true,
    ]);
    assert.equal(harness.indicators[0].getAttribute('aria-label'), 'Show profiles 1 to 3');
});

test('cards fill their responsive slots with only track gaps between them', () => {
    const template = readFileSync(
        new URL('../src/components/site/about/ProfileCarousel.tsx', import.meta.url),
        'utf8',
    );

    assert.match(template, /className="flex gap-4[^\"]*lg:gap-8" data-profile-track/);
    assert.match(template, /className="w-full shrink-0 sm:w-\[calc\(\(100%-1rem\)\/2\)\] lg:w-\[calc\(\(100%-4rem\)\/3\)\]"/);
    assert.doesNotMatch(template, /(?:lg:)?pr-[48]/);
});

test('desktop arrows move one card and loop in both directions', () => {
    const harness = createHarness({ viewport: 'desktop' });

    harness.nextButton.dispatch('click');
    assert.equal(harness.controller.currentIndex(), 1);
    assert.equal(harness.track.style.transform, 'translateX(-100px)');
    assert.equal(harness.indicators[0].getAttribute('aria-current'), 'true');
    assert.deepEqual(harness.slides.map((slide) => slide.getAttribute('aria-hidden')), [
        'true', 'false', 'false', 'false', 'true', 'true', 'true',
    ]);

    harness.nextButton.dispatch('click');
    harness.nextButton.dispatch('click');
    assert.equal(harness.controller.currentIndex(), 3);
    assert.equal(harness.indicators[1].getAttribute('aria-current'), 'true');

    harness.controller.showProfile(0);
    harness.previousButton.dispatch('click');
    assert.equal(harness.controller.currentIndex(), 6);
    assert.equal(harness.slides[6].getAttribute('aria-hidden'), 'false');
});

test('indicators move by one responsive group', () => {
    const desktopHarness = createHarness({ viewport: 'desktop' });

    desktopHarness.indicators[1].dispatch('click');
    assert.equal(desktopHarness.controller.currentIndex(), 3);
    assert.equal(desktopHarness.track.style.transform, 'translateX(-300px)');

    const harness = createHarness({ viewport: 'tablet' });

    assert.equal(harness.controller.pageCount(), 4);
    harness.indicators[3].dispatch('click');

    assert.equal(harness.controller.currentIndex(), 6);
    assert.equal(harness.track.style.transform, 'translateX(-600px)');
    assert.equal(harness.slides[6].getAttribute('aria-hidden'), 'false');
    assert.equal(harness.indicators[3].getAttribute('aria-current'), 'true');
});

test('mobile swipe navigation loops and ignores short or vertical gestures', () => {
    const harness = createHarness();

    swipe(harness.profileViewport, 100, 40);
    assert.equal(harness.controller.currentIndex(), 1);

    swipe(harness.profileViewport, 40, 100);
    assert.equal(harness.controller.currentIndex(), 0);

    swipe(harness.profileViewport, 40, 100);
    assert.equal(harness.controller.currentIndex(), 6);

    swipe(harness.profileViewport, 100, 51);
    swipe(harness.profileViewport, 100, 40, 0, 80);
    assert.equal(harness.controller.currentIndex(), 6);
});

test('viewport changes preserve the nearest visible profile', () => {
    const harness = createHarness();

    harness.controller.showProfile(4);
    harness.tabletQuery.change(true);
    assert.equal(harness.controller.currentIndex(), 4);
    assert.equal(harness.controller.pageCount(), 4);

    harness.desktopQuery.change(true);
    assert.equal(harness.controller.currentIndex(), 4);
    assert.equal(harness.controller.pageCount(), 3);
});

test('50px threshold, pointercancel, nonprimary input and tablet swipes retain source rules', () => {
    const harness = createHarness();
    swipe(harness.profileViewport, 100, 50);
    assert.equal(harness.controller.currentIndex(), 1);
    harness.profileViewport.dispatch('pointerdown', { clientX: 100, clientY: 0, isPrimary: true });
    harness.profileViewport.dispatch('pointercancel');
    harness.profileViewport.dispatch('pointerup', { clientX: 0, clientY: 0 });
    harness.profileViewport.dispatch('pointerdown', { clientX: 100, clientY: 0, isPrimary: false });
    harness.profileViewport.dispatch('pointerup', { clientX: 0, clientY: 0 });
    swipe(harness.profileViewport, 100, 50, 0, 50);
    assert.equal(harness.controller.currentIndex(), 1);
    harness.tabletQuery.change(true);
    swipe(harness.profileViewport, 100, 0);
    assert.equal(harness.controller.currentIndex(), 1);
});

test('resize recomputes actual offset without resetting index, including the final partial group', () => {
    const harness = createHarness({ viewport: 'desktop' });
    harness.indicators[2].dispatch('click');
    assert.equal(harness.controller.currentIndex(), 6);
    assert.deepEqual(harness.slides.map(slide => slide.inert), [true, true, true, true, true, true, false]);
    harness.slides[6].offsetLeft = 4321;
    harness.windowObject.dispatch('resize');
    assert.equal(harness.track.style.transform, 'translateX(-4321px)');
    harness.nextButton.dispatch('click');
    assert.equal(harness.controller.currentIndex(), 0);
});

test('disposal removes every listener and remount does not double-step', () => {
    const harness = createHarness();
    harness.controller.dispose();
    for (const element of [harness.profileViewport, harness.previousButton, harness.nextButton, ...harness.indicators, harness.windowObject, harness.tabletQuery, harness.desktopQuery]) {
        assert.equal(element.listenerCount(), 0);
    }
    const controller = initializeProfileCarousel(harness.carousel, harness.windowObject);
    harness.nextButton.dispatch('click');
    assert.equal(controller.currentIndex(), 1);
    controller.dispose();
});

test('single profile has no group controls and an empty carousel does not register listeners', () => {
    const single = createHarness({ count: 1 });
    assert.equal(single.indicatorGroup.hidden, true);
    assert.equal(single.arrowGroup.hidden, true);
    const empty = createHarness({ count: 0 });
    assert.equal(empty.controller, null);
    assert.equal(empty.windowObject.listenerCount(), 0);
});

test('container offsets do not clip the first card or shift subsequent profile destinations',()=>{const h=createHarness();for(const slide of h.slides)slide.offsetLeft+=64;h.windowObject.dispatch('resize');assert.equal(h.track.style.transform,'translateX(-0px)');h.controller.showProfile(1);assert.equal(h.track.style.transform,'translateX(-100px)');h.controller.dispose();});
