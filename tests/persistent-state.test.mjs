import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h, useState } from "react";
import { renderToString } from "react-dom/server";
import usePersistentState from "../src/core/hooks/usePersistentState.ts";

function Counter({ id, storageKey }) {
  const [value, setValue] = usePersistentState(storageKey, 0);
  return h("section", null,
    h("output", { id }, value),
    h("button", { id: `${id}-increment`, onClick: () => setValue((v) => v + 1) }, "Increment"),
    h("button", { id: `${id}-twice`, onClick: () => {
      setValue((v) => v + 1);
      setValue((v) => v + 1);
    } }, "Twice"));
}

function Controls() {
  const [key, setKey] = useState("count");
  const [object, setObject] = usePersistentState("object", { count: 7 });
  return h("main", null,
    h(Counter, { id: "first", storageKey: key }),
    h(Counter, { id: "second", storageKey: "count" }),
    h("button", { id: "switch", onClick: () => setKey("other") }, "Switch"),
    h("output", { id: "object" }, object.count),
    h("button", { id: "object-increment", onClick: () => setObject((v) => ({ count: v.count + 1 })) }, "Object"));
}

test("persistent controls preserve state across hydration and storage changes", async (t) => {
  const html = renderToString(h(Controls));
  const dom = new JSDOM(`<!doctype html><div id="root">${html}</div>`, { url: "https://nour.test" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const storage = dom.window.localStorage;
  storage.setItem("count", "3");
  storage.setItem("other", "9");
  storage.setItem("object", "invalid-json");
  const { hydrateRoot } = await import("react-dom/client");
  const hydrationErrors = [];
  let root;
  const value = (id) => document.getElementById(id).textContent;
  const click = (id) => act(() => document.getElementById(id).click());

  try {
    await act(async () => {
      root = hydrateRoot(document.getElementById("root"), h(Controls), {
        onRecoverableError: (error) => hydrationErrors.push(error.message),
      });
    });

    await t.test("restores saved values without a hydration mismatch", () => {
      assert.equal(value("first"), "3");
      assert.equal(value("second"), "3");
      assert.deepEqual(hydrationErrors, []);
    });
    await t.test("applies consecutive functional updates to all consumers", async () => {
      await click("first-twice");
      assert.equal(value("first"), "5");
      assert.equal(value("second"), "5");
    });
    await t.test("switches storage keys without overwriting the old key", async () => {
      await click("switch");
      assert.equal(value("first"), "9");
      await click("first-increment");
      assert.equal(value("first"), "10");
      assert.equal(storage.getItem("count"), "5");
    });
    await t.test("updates the matching key after a cross-tab storage event", async () => {
      await act(async () => {
        storage.setItem("count", "12");
        window.dispatchEvent(new dom.window.StorageEvent("storage", { key: "count", newValue: "12" }));
      });
      assert.equal(value("second"), "12");
      assert.equal(value("first"), "10");
    });
    await t.test("recovers corrupt JSON and supports object-valued state", async () => {
      assert.equal(value("object"), "7");
      await click("object-increment");
      assert.equal(value("object"), "8");
      assert.deepEqual(JSON.parse(storage.getItem("object")), { count: 8 });
    });
    await t.test("keeps controls usable when storage writes fail", async () => {
      dom.window.Storage.prototype.setItem = () => { throw new dom.window.DOMException("Quota full", "QuotaExceededError"); };
      await click("second-increment");
      assert.equal(value("second"), "13");
      await click("second-twice");
      assert.equal(value("second"), "15");
    });
  } finally {
    await act(async () => root?.unmount());
    dom.window.close();
  }
});
