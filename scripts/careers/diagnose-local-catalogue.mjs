import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { getPublicCountries } from "../../src/features/countries/services/public-countries.service.ts";
import { getPublicPrograms } from "../../src/features/programs/services/public-programs.service.ts";
import { getCountries } from "../../src/features/countries/services/countries.repository.ts";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i),
        line
          .slice(i + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2"),
      ];
    }),
);
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(
  ["127.0.0.1", "localhost"].includes(url.hostname) && url.port === "54331",
);
process.env.NEXT_PUBLIC_SUPABASE_URL = url.origin;
const anon = createClient(
  url.origin,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const admin = createClient(
  url.origin,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const account = JSON.parse(
  readFileSync(".next-ui-preview/local-admin-account.json", "utf8"),
);
assert.ifError(
  (
    await admin.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
  ).error,
);
for (const [name, run] of [
  ["admin countries", () => getCountries(admin)],
  ["public countries", () => getPublicCountries(anon)],
  ["public programs", () => getPublicPrograms(anon)],
  [
    "admin programs",
    () =>
      admin.from("programs").select("id,title_ar,flight_inclusion").limit(1),
  ],
  ["public cities", () => anon.from("departure_cities").select("id").limit(1)],
  [
    "public departures",
    () =>
      anon
        .from("program_departures")
        .select("id,origin_city_id,start_at")
        .limit(1),
  ],
]) {
  try {
    const result = await run();
    if (result?.error) throw result.error;
    console.log(
      JSON.stringify({
        source: name,
        ok: true,
        rows: Array.isArray(result) ? result.length : result.data.length,
      }),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        source: name,
        ok: false,
        code: error.code ?? null,
        message: error.message,
      }),
    );
  }
}
await admin.auth.signOut({ scope: "local" });
