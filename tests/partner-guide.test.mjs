import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToString } from "react-dom/server";
import { JSDOM } from "jsdom";
import { loadServerModule } from "./helpers/load-server-module.mjs";

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const guideModule = loadServerModule("src/features/applications/partner-guide.ts", {
  "./data/partner-guide.ar.json": { default: json("../src/features/applications/data/partner-guide.ar.json") },
  "./data/partner-guide.en.json": { default: json("../src/features/applications/data/partner-guide.en.json") },
});
const { partnerGuide } = guideModule;
const readingModule = loadServerModule("src/features/applications/guide-reading.ts");
const fileSizes = Object.fromEntries(Object.entries(partnerGuide).map(([language, guide]) => [language, Object.fromEntries(Object.entries(guide.downloads).map(([format, path]) => [format, statSync(new URL(`../public${path}`, import.meta.url)).size]))]));

for (const [language, version, direction] of [["ar", "1.1", "rtl"], ["en", "1.2", "ltr"]]) {
  test(`${language}: guide retains source version, 48 fields, ten navigable sections and locale downloads`, () => {
    const guide = partnerGuide[language];
    assert.equal(guide.version, version);
    assert.equal(guide.updatedAt, "2026-11-06");
    assert.equal(guide.sections.length, 10);
    assert.equal(guide.sections.flatMap(section => section.blocks).filter(block => block.kind === "field").length, 48);
    assert.doesNotMatch(JSON.stringify(guide), /Click here to enter details|انقر هنا لاستكمال البيانات/);
    const loaded = { exports: {} };
    const source = ts.transpileModule(readFileSync(new URL("../app/become-a-partner/guide/GuideReader.tsx", import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const require = createRequire(import.meta.url);
    vm.runInNewContext(source, { module: loaded, exports: loaded.exports, require: (name) => {
      if (name === "next/link") return { __esModule: true, default: ({children, ...props}) => React.createElement("a", props, children) };
      if (name === "next/image") return { __esModule: true, default: (props) => React.createElement("img", { src: props.src, alt: props.alt, width: props.width, height: props.height }) };
      if (name.endsWith("/guide-reading")) return readingModule;
      if (name.endsWith("/i18n")) return { useLanguage: () => ({ language, setLanguage: () => {} }) };
      if (name.endsWith("/partner-guide")) return guideModule;
      if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.endsWith(".css")) return {};
      return require(name);
    }});
    const dom = new JSDOM(renderToString(React.createElement(loaded.exports.default, { initialLanguage: language, fileSizes })));
    const document = dom.window.document;
    assert.equal(document.querySelector("main").dir, direction);
    assert.equal(document.querySelector("main").lang, language);
    assert.equal(document.querySelectorAll("article > section").length, 10);
    assert.equal(document.querySelectorAll(".requirementList li").length, 48);
    for (const section of guide.sections) {
      assert.ok(document.getElementById(section.id));
      assert.ok(document.querySelector(`nav a[href="#${section.id}"]`));
    }
    for (const section of guide.sections) {
      section.blocks.forEach((block, index) => {
        const element = document.getElementById(`${section.id}-block-${index}`);
        assert.ok(element, "Every source block has a stable reading/search target");
        if (block.kind === "table") {
          for (const cell of block.rows.flat()) if (!/^_+$/.test(cell)) assert.ok(element.textContent.includes(cell), cell);
        } else assert.ok(element.textContent.includes(block.text), "No source paragraph, heading or field label is lost");
      });
    }
    assert.equal(document.querySelectorAll("article input, article textarea, article select").length, 0);
    assert.ok(document.querySelector('[href="#guide-downloads"]'));
    for (const [format, path] of Object.entries(guide.downloads)) {
      assert.match(path, new RegExp(`/v${version}/${language}/`));
      assert.ok(document.querySelector(`a[download][href="${path}"]`));
      const buffer = readFileSync(new URL(`../public${path}`, import.meta.url));
      assert.ok(buffer.length > 1000);
      assert.equal(buffer.subarray(0, format === "pdf" ? 4 : 2).toString(), format === "pdf" ? "%PDF" : "PK");
    }
    dom.window.close();
  });
}

test("public downloads match the reviewed blank-field templates", () => {
  const sources = json("../docs/partner-guide-sources.json");
  for (const source of sources) {
    const bytes = readFileSync(new URL(`../public${source.path}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
  }
});
