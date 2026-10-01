-- Aggregate migration inventory; contains no account data or secrets.
-- Run against the intended Supabase source or trial destination.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';

SELECT jsonb_build_object(
  'checked_at_utc', now(),
  'postgres_version', current_setting('server_version'),
  'database_bytes', pg_database_size(current_database()),
  'schemas', (SELECT jsonb_agg(nspname ORDER BY nspname) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'),
  'tables_by_schema', (SELECT jsonb_agg(v ORDER BY v.schema_name) FROM (
    SELECT n.nspname AS schema_name, count(*) AS table_count,
      count(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled_count,
      sum(pg_total_relation_size(c.oid)) AS total_bytes,
      sum(greatest(c.reltuples,0))::bigint AS estimated_rows
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
    GROUP BY n.nspname
  ) v),
  'largest_application_tables', (SELECT jsonb_agg(v ORDER BY v.total_bytes DESC) FROM (
    SELECT n.nspname AS schema_name,c.relname AS table_name,pg_total_relation_size(c.oid) AS total_bytes,
      greatest(c.reltuples,0)::bigint AS estimated_rows,c.relrowsecurity AS rls_enabled
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','auth','storage')
    ORDER BY total_bytes DESC LIMIT 15
  ) v),
  'extensions', (SELECT jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) ORDER BY e.extname) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace),
  'public_function_count', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
  'public_policy_count', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
  'storage_policy_count', (SELECT count(*) FROM pg_policies WHERE schemaname='storage'),
  'has_auth_users', to_regclass('auth.users') IS NOT NULL,
  'has_storage_objects', to_regclass('storage.objects') IS NOT NULL,
  'has_vault', to_regclass('vault.secrets') IS NOT NULL,
  'has_cron_jobs', to_regclass('cron.job') IS NOT NULL
) AS inventory;

SELECT jsonb_build_object(
  'checked_at_utc',now(),
  'auth_user_count',(SELECT count(*) FROM auth.users),
  'auth_identity_providers',(SELECT jsonb_agg(v ORDER BY v.provider) FROM (SELECT provider,count(*) AS identity_count FROM auth.identities GROUP BY provider) v),
  'vault_secret_count',(SELECT count(*) FROM vault.secrets),
  'buckets',(SELECT jsonb_agg(v ORDER BY v.bucket_id) FROM (
    SELECT b.id AS bucket_id,b.public AS is_public,count(o.id) AS object_count,
      coalesce(sum(CASE WHEN o.metadata->>'size' ~ '^[0-9]+$' THEN (o.metadata->>'size')::bigint ELSE 0 END),0) AS recorded_bytes,
      count(o.id) FILTER(WHERE coalesce(o.metadata->>'size','') !~ '^[0-9]+$') AS unknown_size_count
    FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id
    GROUP BY b.id,b.public
  ) v),
  'public_tables',(SELECT jsonb_agg(c.relname ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p')),
  'realtime_publication_tables',(SELECT jsonb_agg(jsonb_build_object('publication',pubname,'schema',schemaname,'table',tablename) ORDER BY pubname,schemaname,tablename) FROM pg_publication_tables WHERE pubname LIKE 'supabase%'),
  'foreign_server_count',(SELECT count(*) FROM pg_foreign_server)
) AS inventory;
COMMIT;
