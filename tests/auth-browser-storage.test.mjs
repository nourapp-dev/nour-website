import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { JSDOM } from "jsdom";

test(
  "real Supabase browser clients preserve two sessions and local logout clears only one",
  { timeout: 10000 },
  async () => {
    const dom = new JSDOM("", { url: "https://nour.test/admin/login" });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      fetch: globalThis.fetch,
    };
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const env = { ...process.env };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://scope-test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public-key";
    const jwt = (id) =>
      [
        Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
          "base64url",
        ),
        Buffer.from(
          JSON.stringify({
            sub: id,
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        ).toString("base64url"),
        "test-signature",
      ].join(".");
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/logout")) {
        assert.match(String(url), /scope=local/);
        return new Response(null, { status: 204 });
      }
      assert.match(String(url), /\/token\?grant_type=password/);
      const id = JSON.parse(init.body).email.startsWith("admin")
        ? "admin-user"
        : "pilgrim-user";
      return new Response(
        JSON.stringify({
          access_token: jwt(id),
          refresh_token: "refresh-" + id,
          expires_in: 3600,
          token_type: "bearer",
          user: { id, email: id + "@example.test", aud: "authenticated" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };
    const require = createRequire(import.meta.url);
    function load(path) {
      const source = ts.transpileModule(
        readFileSync(new URL(path, import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText;
      const loaded = { exports: {} };
      vm.runInThisContext(
        "(function(require,module,exports){" + source + "\n})",
      )(
        (name) =>
          name === "./auth-scope"
            ? load("../src/lib/supabase/auth-scope.ts")
            : require(name),
        loaded,
        loaded.exports,
      );
      return loaded.exports;
    }
    let admin, pilgrim;
    try {
      const { createClient } = load("../src/lib/supabase/client.ts");
      admin = createClient("admin");
      pilgrim = createClient("pilgrim");
      assert.notEqual(admin, pilgrim);
      assert.equal(createClient("admin"), admin);
      assert.equal(
        (
          await admin.auth.signInWithPassword({
            email: "admin@example.test",
            password: "example-password",
          })
        ).error,
        null,
      );
      assert.equal((await pilgrim.auth.getSession()).data.session, null);
      assert.equal(
        (
          await pilgrim.auth.signInWithPassword({
            email: "pilgrim@example.test",
            password: "example-password",
          })
        ).error,
        null,
      );
      assert.equal(
        (await admin.auth.getSession()).data.session.user.id,
        "admin-user",
      );
      assert.equal(
        (await pilgrim.auth.getSession()).data.session.user.id,
        "pilgrim-user",
      );
      assert.match(document.cookie, /nour-scope-test-admin-auth-v1/);
      assert.match(document.cookie, /nour-scope-test-pilgrim-auth-v1/);
      await admin.auth.signOut({ scope: "local" });
      assert.equal((await admin.auth.getSession()).data.session, null);
      assert.equal(
        (await pilgrim.auth.getSession()).data.session.user.id,
        "pilgrim-user",
      );
    } finally {
      await admin?.auth.dispose();
      await pilgrim?.auth.dispose();
      dom.window.close();
      Object.assign(globalThis, previous);
      for (const k of [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ]) {
        if (env[k] === undefined) delete process.env[k];
        else process.env[k] = env[k];
      }
    }
  },
);
