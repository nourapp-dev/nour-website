import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
assert.match(
  readFileSync(".env.local", "utf8"),
  /^NEXT_PUBLIC_SUPABASE_URL=http:\/\/(127\.0\.0\.1|localhost):54331\s*$/m,
);
const source = readFileSync(
  "supabase/migrations/20261107200730_admin_workspace_workflow.sql",
  "utf8",
);
const functions = [
  ...source.matchAll(/create (?:or replace )?function\s[\s\S]*?\$\$;/gi),
].map((match) =>
  match[0].replace(
    /^create (?:or replace )?function/i,
    "create or replace function",
  ),
);
const compatibility =
  source.match(/do \$compat\$[\s\S]*?\$compat\$;/)?.[0] ?? "";
const policies = [
  ...source.matchAll(
    /^create policy (\w+) on ((?:public|storage)\.\w+)[\s\S]*?;/gm,
  ),
]
  .map(
    (match) => `drop policy if exists ${match[1]} on ${match[2]};\n${match[0]}`,
  )
  .join("\n");
const cities = (
  source.match(/do \$cities\$[\s\S]*?\$cities\$;/)?.[0] ?? ""
).replace(
  "execute 'create policy",
  "execute 'drop policy if exists workspace_cities_read on public.departure_cities'; execute 'create policy",
);
const grants = source
  .split("\n")
  .filter((line) => /^(grant|revoke) /.test(line))
  .join("\n");
const sql = `begin;\n${functions.join("\n")}\n${compatibility}\n${policies}\n${cities}\n${grants}\nnotify pgrst,'reload schema';\ncommit;`;
execFileSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_nour-intake-local",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-q",
  ],
  { input: sql, stdio: ["pipe", "pipe", "pipe"] },
);
console.log(
  `Refreshed ${functions.length} reviewed workspace functions on the isolated database only.`,
);
