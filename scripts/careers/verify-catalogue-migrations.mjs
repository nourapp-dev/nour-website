import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
assert.match(
  readFileSync(".env.local", "utf8"),
  /^NEXT_PUBLIC_SUPABASE_URL=http:\/\/(127\.0\.0\.1|localhost):54331\s*$/m,
);
const container = "supabase_db_nour-intake-local",
  database = `catalogue_migration_check_${Date.now()}`;
const psql = (sql) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
    ],
    {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    },
  );
execFileSync(
  "docker",
  ["exec", container, "createdb", "-U", "postgres", database],
  { stdio: "pipe" },
);
try {
  psql(`create schema auth;create schema storage;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('test.role',true),''),'authenticated')$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant usage on schema auth,storage to anon,authenticated,service_role;grant select,insert,delete on storage.objects to anon,authenticated;`);
  const files = [
    "supabase/migrations/20260724153055_foundation.sql",
    "supabase/migrations/20260728000000_normalize_rbac_schema.sql",
    "supabase/migrations/20260730203632_admin_users_roles_audit.sql",
    "supabase/migrations/20260815000100_create_applications_module.sql",
    "database/policies/application-storage.sql",
    "supabase/migrations/20260821120000_reconcile_rbac_production_state.sql",
    "supabase/migrations/20261106201850_partner_interest_workflow.sql",
    "supabase/migrations/20261106210049_partner_interest_wizard.sql",
    "supabase/migrations/20261106213449_talent_pool_intake.sql",
    "supabase/migrations/20261107200730_admin_workspace_workflow.sql",
  ];
  for (const file of files)
    psql(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const historical = readdirSync("supabase/migrations")
    .sort()
    .filter(
      (file) =>
        file.split("_")[0] < "20261101" &&
        file !== "20260729_create_admin_user_roles.sql" &&
        !files.includes("supabase/migrations/" + file),
    );
  for (const file of historical)
    psql(
      readFileSync("supabase/migrations/" + file, "utf8").replace(
        /^\uFEFF/,
        "",
      ),
    );
  for (const file of [
    "20261107212725_catalogue_markets_content_workflow.sql",
    "20261107214236_website_revision_workflow.sql",
    "20261107215022_catalogue_media_guards.sql",
  "20261107222513_program_display_readiness.sql",
  "20261107225244_published_article_media.sql",
    "20261107232617_program_visa_applicability.sql",
    "20261107232818_website_current_version.sql",
  ])
    psql(readFileSync("supabase/migrations/" + file, "utf8"));
  psql(
    "do $$begin if has_function_privilege('anon','public.website_content_write(text,jsonb,bigint,bigint,bigint)','execute') then raise exception 'anonymous_publish';end if;if has_table_privilege('authenticated','public.website_presentation_versions','UPDATE,DELETE,INSERT') then raise exception 'mutable_version';end if;if has_table_privilege('anon','public.meeting_point_operations','SELECT') then raise exception 'public_operations';end if;end $$;",
  );
  const result = psql(`do $$begin
 if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('admin_followups','admin_intake_events','admin_notifications') and c.relrowsecurity)<>3 then raise exception 'missing_rls';end if;
 if has_function_privilege('anon','public.workspace_save_role(uuid,text,text,text,text[])','execute') then raise exception 'anonymous_role_escalation';end if;
 if has_function_privilege('anon','public.workspace_update(text,uuid,timestamptz,jsonb)','execute') then raise exception 'anonymous_mutation';end if;
 if has_table_privilege('authenticated','public.admin_intake_events','UPDATE,DELETE,INSERT') then raise exception 'mutable_audit';end if;
 if (select public from storage.buckets where id='application-files') then raise exception 'public_cv_bucket';end if;
 end $$;`);
  assert.equal(result.trim(), "");
  console.log(
    "PASS: fresh PostgreSQL replay of existing modules plus catalogue, website revision and media migrations; private operations, immutable versions, denied anonymous publication, foundation/RBAC/intake compatibility. Auth/storage stubs are used here; live Auth/storage are verified separately.",
  );
} catch (error) {
  console.error(String(error.stderr ?? error.message).slice(-1800));
  process.exitCode = 1;
} finally {
  execFileSync(
    "docker",
    ["exec", container, "dropdb", "-U", "postgres", database],
    { stdio: "pipe" },
  );
  console.log("Dropped only the dedicated migration-check database.");
}
