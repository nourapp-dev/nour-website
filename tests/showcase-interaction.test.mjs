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
    window: dom.window,
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


async function withRotation({ language = "en", reduced = false, presentation } = {}, run) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://nour.test", pretendToBeVisual: true });
  const previous = { window: globalThis.window, document: globalThis.document, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let mediaReduced = reduced, visibility = "visible", observe, now = 0, sequence = 0;
  const motionListeners = new Set(), timers = new Map();
  Object.defineProperty(dom.window.document, "visibilityState", { get: () => visibility });
  dom.window.matchMedia = () => ({
    matches: mediaReduced,
    addEventListener: (_, fn) => motionListeners.add(fn),
    removeEventListener: (_, fn) => motionListeners.delete(fn),
  });
  let disconnected = false;
  dom.window.IntersectionObserver = class {
    constructor(fn) { observe = fn; } observe() {} disconnect() { disconnected = true; }
  };
  dom.window.setTimeout = (fn, delay) => { const id = ++sequence; timers.set(id, { fn, at: now + delay }); return id; };
  dom.window.clearTimeout = id => timers.delete(id);
  const require = createRequire(import.meta.url);
  const loaded = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("../app/components/home/Showcase.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    module: loaded, exports: loaded.exports, window: dom.window, document: dom.window.document,
    require(name) {
      if (name === "next/image") return { __esModule: true, default: props => React.createElement("img", {
        src: props.src, alt: props.alt, onLoad: props.onLoad, onError: props.onError,
      }) };
      if (name.endsWith("usePresentation")) return { usePresentation: value => value };
      if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      return require(name);
    },
  });
  const root = createRoot(document.getElementById("root"));
  const value = presentation ?? structuredClone(defaultPresentation);
  const render = () => act(async () => root.render(React.createElement(loaded.exports.default, { language, presentation: value })));
  const panel = () => document.querySelector("[role=tabpanel]");
  const image = () => panel().querySelector("img");
  const tab = () => document.querySelector('[role=tab][aria-selected="true"]').textContent;
  const click = element => act(async () => element.click());
  const load = () => act(async () => image().dispatchEvent(new dom.window.Event("load")));
  const tick = async milliseconds => {
    const end = now + milliseconds;
    while (true) {
      const pending = [...timers].filter(([,timer]) => timer.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
      if (!pending) break;
      now = pending[1].at; timers.delete(pending[0]); await act(async () => pending[1].fn());
    }
    now = end;
  };
  try {
    await render();
    await run({
      dom, value, render, panel, image, tab, click, load, tick, timers,
      inView: value => act(async () => observe([{ isIntersecting: value, intersectionRatio: value ? .5 : 0 }])),
      visible: value => act(async () => { visibility = value ? "visible" : "hidden"; document.dispatchEvent(new dom.window.Event("visibilitychange")); }),
      motion: value => act(async () => { mediaReduced = value; motionListeners.forEach(fn => fn()); }),
    });
  } finally {
    await act(async () => root.unmount());
    assert.equal(timers.size, 0, "rotation timer is cleaned up on unmount");
    if (observe) assert.equal(disconnected, true);
    dom.window.close(); globalThis.window = previous.window; globalThis.document = previous.document; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
}

for (const language of ["ar", "en"]) test(language + ": rotation waits for viewport and image, uses 3/5 seconds and pauses offscreen/hidden", async () => {
  await withRotation({ language }, async ({ value, inView, visible, tick, load, tab, timers }) => {
    const titles = value.showcase.screens.map(screen => screen.title[language]);
    await load(); await tick(9000); assert.equal(tab(), titles[0]); assert.equal(timers.size, 0);
    await inView(true);
    await tick(2999); assert.equal(tab(), titles[0]);
    await tick(1); assert.equal(tab(), titles[1]);
    await tick(9000); assert.equal(tab(), titles[1], "waits for the next image to load");
    await load(); await tick(4999); assert.equal(tab(), titles[1]);
    await tick(1); assert.equal(tab(), titles[2]);
    await load(); await inView(false); await tick(12000); assert.equal(tab(), titles[2]);
    await inView(true); await visible(false); await tick(12000); assert.equal(tab(), titles[2]);
    await visible(true); await tick(5000); assert.equal(tab(), titles[3]);
    await load(); await tick(5000); assert.equal(tab(), titles[4]);
    await load(); await tick(5000); assert.equal(tab(), titles[0]);
    assert.match(document.querySelector(".previewLabel").textContent, language === "ar" ? /الحجز عبر الموقع متوقف/ : /website booking is paused/);
  });
});

test("manual selection and keyboard focus pause until explicit play; pause button works without capture conflicts", async () => {
  await withRotation({}, async ({ inView, load, tick, tab, click, dom }) => {
    await inView(true); await load();
    const tabs = () => [...document.querySelectorAll("[role=tab]")];
    await click(tabs()[2]); await load(); await tick(15000); assert.equal(tab(), "Trip details");
    const control = () => document.querySelector("[data-rotation-control]");
    assert.match(control().textContent, /Play/);
    await act(async () => control().focus());
    await click(control()); await tick(5000); assert.equal(tab(), "Booking");
    await load();
    await act(async () => control().dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true })));
    await click(control()); await tick(15000); assert.equal(tab(), "Booking");
    await click(control());
    await act(async () => tabs()[3].focus());
    await tick(15000); assert.equal(tab(), "Booking");
    assert.match(control().textContent, /Play/);
  });
});

test("reduced motion disables automatic playback and responds to preference changes", async () => {
  await withRotation({ reduced: true }, async ({ inView, load, tick, tab, motion, click }) => {
    await inView(true); await load(); await tick(20000); assert.equal(tab(), "Welcome");
    assert.equal(document.querySelector("[data-rotation-control]").disabled, true);
    assert.equal(document.querySelector(".progressFill"), null);
    await click(document.querySelectorAll("[role=tab]")[1]); await load();
    await tick(20000); assert.equal(tab(), "Programs");
    await motion(false);
    assert.equal(document.querySelector("[data-rotation-control]").disabled, false);
    await click(document.querySelector("[data-rotation-control]"));
    await motion(true); await tick(20000); assert.equal(tab(), "Programs");
  });
});

test("failed images do not advance automatically and a single visible screen never schedules rotation", async () => {
  await withRotation({}, async ({ inView, image, tick, tab, dom, value, render, load, timers }) => {
    await inView(true);
    await act(async () => image().dispatchEvent(new dom.window.Event("error")));
    await tick(20000); assert.equal(tab(), "Welcome");
    assert.match(document.querySelector(".screenStatus").textContent, /could not load/);
    value.showcase.screens = [value.showcase.screens[0]]; await render(); await load();
    assert.equal(document.querySelector("[data-rotation-control]"), null);
    assert.equal(timers.size, 0);
    value.showcase.screens = []; await render(); assert.equal(document.querySelector("#showcase"), null);
  });
});

test("hiding the configured showcase stops rotation and swipe pauses automatic playback", async () => {
  await withRotation({}, async ({ inView, load, tick, tab, panel, dom, value, render, timers }) => {
    await inView(true); await load();
    await act(async () => {
      panel().dispatchEvent(new dom.window.MouseEvent("pointerdown", { clientX: 200, clientY: 50, bubbles: true }));
      panel().dispatchEvent(new dom.window.MouseEvent("pointerup", { clientX: 80, clientY: 55, bubbles: true }));
    });
    await load(); await tick(20000);
    assert.equal(tab(), "Programs");
    await act(async () => document.querySelector("[data-rotation-control]").click());
    assert.equal(timers.size, 1);
    value.showcase.visible = false; await render();
    assert.equal(document.querySelector("#showcase"), null);
    assert.equal(timers.size, 0);
  });
});
