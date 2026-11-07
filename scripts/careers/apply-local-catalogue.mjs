import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
assert.match(
  readFileSync(".env.local", "utf8"),
  /^NEXT_PUBLIC_SUPABASE_URL=http:\/\/(127\.0\.0\.1|localhost):54331\s*$/m,
  "Isolated local environment required",
);
const db = "supabase_db_nour-intake-local";
const history = new Set(
  execFileSync(
    "docker",
    [
      "exec",
      db,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-c",
      "select version from supabase_migrations.schema_migrations",
    ],
    { encoding: "utf8" },
  )
    .trim()
    .split(/\r?\n/),
);
// Run after bootstrap-local-admin-modules: the initial intake stack has no catalogue.
const files = [
  "20261107212725_catalogue_markets_content_workflow.sql",
  "20261107214236_website_revision_workflow.sql",
  "20261107215022_catalogue_media_guards.sql",
  "20261107222513_program_display_readiness.sql",
  "20261107225244_published_article_media.sql",
    "20261107232617_program_visa_applicability.sql",
    "20261107232818_website_current_version.sql",
];
for (const file of files) {
  const version = file.split("_")[0];
  if (history.has(version)) {
    console.log("Already applied locally: " + version);
    continue;
  }
  const source = readFileSync("supabase/migrations/" + file, "utf8").replace(
    /^\s*(begin|commit);\s*$/gim,
    "",
  );
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      db,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
    ],
    {
      input: `begin;\n${source}\ninsert into supabase_migrations.schema_migrations(version,name) values('${version}','${file}');\ncommit;`,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  console.log("Applied locally: " + version);
}
