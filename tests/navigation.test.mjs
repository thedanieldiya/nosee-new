import assert from "node:assert/strict";
import test from "node:test";
import { getNavigationState, internalPath, normalizePath, withActiveState } from "../src/lib/content/navigation.ts";

test("root-relative normalization excludes external URLs and ignores fragments/queries", () => {
  assert.equal(normalizePath("/about///"), "/about");
  assert.equal(normalizePath(""), "/");
  assert.equal(internalPath("/about#mission"), "/about");
  assert.equal(internalPath("/about/?q=one#leadership"), "/about");
  for (const url of [null, "", "https://nosee.org/about", "//nosee.org/about", "mailto:info@nosee.org"]) {
    assert.equal(internalPath(url), null);
  }
});

test("home is current only at root; nested routes activate without becoming current", () => {
  assert.equal(getNavigationState("/").homeCurrent, true);
  const state = getNavigationState("/research/climate-science/");
  assert.equal(state.homeCurrent, false);
  assert.equal(state.primary[1].active, true);
  assert.equal(state.primary[1].current, false);
  assert.equal(state.primary[1].children[1].current, true);
  assert.equal(getNavigationState("/researcher").primary[1].active, false);
});

test("About fragment links share current-page state as in Laravel", () => {
  const about = getNavigationState("/about").primary[0];
  assert.equal(about.current, true);
  assert.ok(about.children.every((child) => child.current && child.active));
});

test("Products activates its Data & Products parent without activating the Data child", () => {
  const parent = getNavigationState("/products/catalogue").primary[2];
  assert.equal(parent.active, true);
  assert.equal(parent.current, false);
  assert.equal(parent.children[0].active, false);
  assert.equal(parent.children[1].active, true);
});

test("disabled entries are excluded recursively and utility paths retain exact current state", () => {
  const items = [{ label: "Parent", url: "/parent", enabled: true, children: [
    { label: "Disabled", url: "/child", enabled: false },
    { label: "Enabled", url: "/other", enabled: true },
  ] }, { label: "Hidden", url: "/child", enabled: false }];
  const decorated = withActiveState(items, "/child");
  assert.equal(decorated.length, 1);
  assert.equal(decorated[0].active, false);
  assert.deepEqual(decorated[0].children.map((child) => child.label), ["Enabled"]);
  const login = getNavigationState("/login").utility[3];
  assert.equal(login.current, true);
  assert.equal(login.url, "/login");
});
