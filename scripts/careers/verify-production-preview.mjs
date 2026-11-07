import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l
          .slice(i + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2"),
      ];
    }),
);
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.equal(url.origin, "http://127.0.0.1:54331");
const cookies = new Map(),
  account = JSON.parse(
    readFileSync(".next-ui-preview/local-admin-account.json", "utf8"),
  );
const client = createServerClient(
  url.origin,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookieOptions: {
      name: `nour-${url.hostname.split(".")[0]}-admin-auth-v1`,
      path: "/",
      secure: false,
    },
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (values) =>
        values.forEach(({ name, value }) => cookies.set(name, value)),
    },
  },
);
assert.ifError(
  (
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
  ).error,
);
const headers = {
  cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
};
for (const path of [
  "/admin/website",
  "/admin/website/readiness",
  "/admin/website/preview?lang=en&page=partner",
  "/admin/website/preview?lang=ar&page=careers",
  "/admin/countries",
  "/admin/cities",
  "/admin/website/preview?lang=ar&theme=dark",
  "/admin/website/preview?lang=en&theme=light",
]) {
  const response = await fetch("http://localhost:3108" + path, {
    headers,
    redirect: "manual",
  });
  assert.equal(response.status, 200, path);
  assert.match(
    response.headers.get("cache-control"),
    /private.*no-store|no-store.*private/,
  );
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  if (path.includes("website")) {
    assert.match(
      response.headers.get("content-security-policy"),
      /frame-ancestors 'self'/,
    );
    assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  }
  const html = await response.text();
  assert.ok(!html.includes("Internal Server Error"));
  console.log(
    "PASS production-local HTTP " +
      path +
      " : authenticated, private no-store, noindex",
  );
}
const denied = await fetch("http://localhost:3108/admin/website/preview", {
  redirect: "manual",
});
assert.ok([302, 307].includes(denied.status));
console.log(
  "PASS unauthenticated preview redirects; no secret or credential output.",
);
