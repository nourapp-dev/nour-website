import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const repo = fileURLToPath(new URL("../../", import.meta.url));
// Next handles the server-only marker at build time. Unit tests stub only this
// marker; server-boundaries.test.mjs checks imports, and next build checks Next's graph.
export function loadServerModule(relativeFile, mocks = {}) {
  const cache = new Map();
  function load(file) {
    const resolved = [file, file + ".ts", file + "/index.ts"].find(existsSync);
    if (!resolved) throw new Error("Missing test module: " + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const loaded = { exports: {} };
    cache.set(resolved, loaded);
    const source = ts.transpileModule(readFileSync(resolved, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const evaluate = vm.runInThisContext(
      "(function(module, exports, require) {\n" + source + "\n})",
      { filename: resolved },
    );
    evaluate(loaded, loaded.exports, (name) => {
      if (name === "server-only") return {};
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith(".")) return load(resolve(dirname(resolved), name));
      return require(name);
    });
    return loaded.exports;
  }
  return load(resolve(repo, relativeFile));
}
