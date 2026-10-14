// Test-only clock, loaded with NODE_OPTIONS for the local production process.
// Native elapsed time and own static APIs are required by the Next runtime.
import { readFileSync } from "node:fs";
const NativeDate = globalThis.Date;
globalThis.Date = class extends NativeDate {
  constructor(...args) {
    super(...(args.length ? args : [NativeDate.parse(readFileSync("/tmp/nosee-task08-clock.txt", "utf8").trim())]));
  }
  static now() { return NativeDate.now(); }
  static parse(value) { return NativeDate.parse(value); }
  static UTC(...args) { return NativeDate.UTC(...args); }
};
