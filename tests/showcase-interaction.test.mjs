import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { defaultPresentation } from "../src/features/website/presentation.ts";

test("showcase supports translated tabs, keyboard, swipe, and hiding the selected screen", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nour.test" });
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const require = createRequire(import.meta.url);
  const loaded = { exports: {} };
  const source = ts.transpileModule(
    readFileSync(
      new URL("../app/components/home/Showcase.tsx", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const customRequire = (name) => {
    if (name === "next/image")
      return {
        __esModule: true,
        default: (props) =>
          React.createElement("img", { src: props.src, alt: props.alt }),
      };
    if (name.endsWith("usePresentation"))
      return { usePresentation: (value) => value };
    if (name.endsWith(".module.css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, key) => String(key) }),
      };
    return require(name);
  };
  vm.runInNewContext(source, {
    module: loaded,
    exports: loaded.exports,
    require: customRequire,
    document: dom.window.document,
  });
  const Showcase = loaded.exports.default;
  const root = createRoot(document.getElementById("root"));
  let value = structuredClone(defaultPresentation);
  const render = () =>
    act(async () =>
      root.render(
        React.createElement(Showcase, { language: "en", presentation: value }),
      ),
    );
  const tabs = () => [...document.querySelectorAll("[role=tab]")];
  try {
    await render();
    assert.equal(tabs().length, 5);
    assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
    await act(async () => tabs()[1].click());
    assert.equal(
      document.querySelector("[role=tabpanel] img").getAttribute("alt"),
      "Programs",
    );
    await act(async () =>
      tabs()[1].dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
        }),
      ),
    );
    assert.equal(tabs()[2].getAttribute("aria-selected"), "true");
    assert.equal(document.activeElement, tabs()[2]);
    const panel = document.querySelector("[role=tabpanel]");
    await act(async () => {
      panel.dispatchEvent(
        new dom.window.MouseEvent("pointerdown", {
          clientX: 200,
          clientY: 50,
          bubbles: true,
        }),
      );
      panel.dispatchEvent(
        new dom.window.MouseEvent("pointerup", {
          clientX: 80,
          clientY: 55,
          bubbles: true,
        }),
      );
    });
    assert.equal(tabs()[3].getAttribute("aria-selected"), "true");
    value.showcase.screens[3].visible = false;
    await render();
    assert.equal(tabs().length, 4);
    assert.equal(tabs()[0].getAttribute("aria-selected"), "true");
    value.showcase.screens = [];
    await render();
    assert.equal(document.querySelector("#showcase"), null);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
