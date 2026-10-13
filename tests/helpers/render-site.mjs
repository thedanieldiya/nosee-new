import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

// Reuse the installed compiler and React to test the actual server components.
const sourceRoot = new URL("../../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/navigation") return nextResolve("next/navigation.js", context);
    const base = specifier.startsWith("@/") ? new URL(specifier.slice(2), sourceRoot)
      : specifier.startsWith(".") && context.parentURL?.startsWith(sourceRoot.href) ? new URL(specifier, context.parentURL) : null;
    if (base) {
      const url = ["", ".tsx", ".ts"].map(extension => new URL(base.href + extension)).find(existsSync);
      if (url) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && url.endsWith(".tsx")) {
      return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});

export const render = (component, props) => renderToStaticMarkup(createElement(component, props));
