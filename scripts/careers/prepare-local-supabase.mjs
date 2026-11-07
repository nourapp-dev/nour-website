import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A separate, disposable application-intake database; never links to a cloud project.
const root = resolve('.next-ui-preview/supabase-local');
mkdirSync(resolve(root, 'supabase/migrations'), { recursive: true });
let config = readFileSync('supabase/config.toml', 'utf8')
  .replace('project_id = "NourApp-website"', 'project_id = "nour-intake-local"')
  .replaceAll('5432', '5433')
  .replace(/\[db.seed\][\s\S]*?(?=\n\[db.network_restrictions\])/, '[db.seed]\nenabled = false\nsql_paths = []\n')
  .replaceAll('127.0.0.1:3000', 'localhost:3107');
writeFileSync(resolve(root, 'supabase/config.toml'), config);
for (const file of [
  '20260724153055_foundation.sql',
  '20260728000000_normalize_rbac_schema.sql',
  '20260730203632_admin_users_roles_audit.sql',
  '20260815000100_create_applications_module.sql',
  '20260821120000_reconcile_rbac_production_state.sql',
  '20261107200730_admin_workspace_workflow.sql',
  '20261106201850_partner_interest_workflow.sql',
  '20261106210049_partner_interest_wizard.sql',
  '20261106213449_talent_pool_intake.sql',
]) writeFileSync(resolve(root, 'supabase/migrations', file), readFileSync(resolve('supabase/migrations', file), 'utf8').replace(/^\uFEFF/, ''));
// The existing bucket initializer must precede the newer restrictive policies.
copyFileSync('database/policies/application-storage.sql', resolve(root, 'supabase/migrations/20260815000200_local_application_storage.sql'));
copyFileSync('scripts/careers/local-api-grants.sql', resolve(root, 'supabase/migrations/20261106220000_local_api_grants.sql'));
copyFileSync('scripts/careers/local-admin-bootstrap.sql', resolve(root, 'supabase/migrations/20261107000100_local_admin_bootstrap.sql'));
console.log('Prepared isolated intake stack: API 54331, database 54332, Studio 54333.');
