import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { JSDOM } from "jsdom";

test("official seal is present before hydration, resizes safely and returns after navigation", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nour.test" });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const loaded = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(new URL("../app/components/layout/BusinessVerificationSeal.tsx", import.meta.url), "utf8"),
    { compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    } },
  ).outputText;
  vm.runInNewContext(source, {
    module: loaded,
    exports: loaded.exports,
    require: createRequire(import.meta.url),
    window: dom.window,
  });
  const Seal = loaded.exports.default;
  const container = document.getElementById("root");
  const element = (language) => React.createElement(Seal, { language, key: language });
  const origin = "https://eauthenticate.saudibusiness.gov.sa";
  let root;
  try {
    container.innerHTML = renderToString(element("ar"));
    let frame = container.querySelector("iframe");
    assert.ok(frame, "iframe exists in the initial HTML without waiting for seal.js");
    assert.equal(new URL(frame.src).origin, origin);
    assert.equal(new URL(frame.src).searchParams.get("lang"), "ar");
    assert.equal(container.querySelector("a").href, frame.src);
    const hydrationErrors = [];
    await act(async () => {
      root = hydrateRoot(container, element("ar"), { onRecoverableError: (error) => hydrationErrors.push(error) });
    });
    assert.deepEqual(hydrationErrors, []);
    frame = container.querySelector("iframe");
    const message = async (data, overrides = {}) => act(async () => {
      window.dispatchEvent(new window.MessageEvent("message", {
        origin,
        source: frame.contentWindow,
        data,
        ...overrides,
      }));
    });
    const expanded = { sbcSeal: true, width: 288, height: 430 };
    await message(expanded, { origin: "https://unrelated.example" });
    await message(expanded, { source: window });
    await message({ ...expanded, sbcSeal: false });
    await message({ ...expanded, height: NaN });
    assert.equal(frame.height, "56", "untrusted or malformed resize requests are ignored");
    await message(expanded);
    assert.equal(frame.width, "288");
    assert.equal(frame.height, "430");
    await message({ sbcSeal: true, width: 100000, height: 100000 });
    assert.equal(frame.width, "400");
    assert.equal(frame.height, "720");
    await message({ sbcSeal: true, width: 150, height: 48 });
    assert.equal(frame.height, "48", "closing the official card restores compact height");
    await act(async () => root.render(element("en")));
    frame = container.querySelector("iframe");
    assert.equal(new URL(frame.src).searchParams.get("lang"), "en");
    assert.equal(frame.height, "56");
    assert.match(frame.title, /Saudi Business Center/);
    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(element("ar")));
    assert.equal(container.querySelectorAll("iframe").length, 1, "returning to the footer mounts a single seal");
  } finally {
    if (root) await act(async () => root.unmount());
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
    dom.window.close();
  }
});
