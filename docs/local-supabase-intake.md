# Isolated local application intake

User-approved local environment, activated 2026-11-07. No cloud changes.

- Careers: http://localhost:3107/join-us?lang=ar
- Partners: http://localhost:3107/become-a-partner?lang=ar
- Supabase API: http://127.0.0.1:54331
- Postgres port: 54332; Studio: http://127.0.0.1:54333
- Docker project: `nour-intake-local`

Docker Desktop must be running. From the website repository in PowerShell:

```powershell
node scripts/careers/prepare-local-supabase.mjs
npx supabase start --workdir .next-ui-preview/supabase-local --exclude 'logflare,vector,imgproxy,realtime,edge-runtime' *> .next-ui-preview/supabase-local-start.log
npx supabase migration up --local --include-all --workdir .next-ui-preview/supabase-local
node scripts/careers/connect-local-supabase.mjs
node scripts/careers/bootstrap-local-admin-modules.mjs
npm run dev -- --port 3107
```

Do not start a second Next.js process if port 3107 already serves this repository.
Restart Next.js after changing the Supabase environment: although route code
reloads `.env.local`, the CSP in `next.config.ts` retains the previous origin until
restart and otherwise blocks browser Auth with `Failed to fetch`. Reload the login
page after restart. The local administrator verification also checks `connect-src`.
CLI startup/status
can include local credentials, so startup output stays in the ignored preview
directory. The connection script captures credentials in memory, verifies the
loopback API and port, and writes only the ignored `.env.local`. It preserves
unrelated flags and backs up the original configuration once in the ignored
`.env.local.before-isolated-supabase`. No linked/cloud command is needed.

The isolated bootstrap starts with foundation RBAC, applications and private
storage. The module bootstrap script then replays missing existing module
migrations in one transaction, with a full rollback on error. It has no production candidates,
production catalogue or production administrator accounts. It also includes the
existing normalized RBAC/admin-role migrations and one local super administrator.
Historical full-repository startup
currently fails at `20260724200000_restore_legacy_rbac_helpers.sql` (`roles.key`
does not exist); that unrelated migration is not edited. The isolated preparation
script copies the exact required SQL into `.next-ui-preview/supabase-local`.
Local explicit service-role grants cover the two intake tables; anonymous RLS
remains in force. The application bucket is private with a 5 MiB limit.

Verify real receiving against the running local website:

```powershell
node scripts/careers/verify-local-intake.mjs
```

The script refuses a non-local database or a port other than 54331. It submits
synthetic `.test` candidate data through Next.js, checks the persisted preferences,
zero experience, real database reference, PDF bytes, retry deduplication, optional
CV and anonymous access denial. It removes only its own records and storage files
in `finally`. No emails are sent. No credentials are printed.

Verified live on 2026-11-07. Desktop/mobile visual screenshots remain unavailable
because the computer-use browser access host is unavailable; HTTP and integration
checks do not substitute for visual layout QA.

## Local administrator

An active local super administrator was created and verified on 2026-11-07.
Login: http://localhost:3107/admin/login. Email: `admin@nour.local`.
The generated password is stored only in the ignored
`.next-ui-preview/local-admin-account.json`, not in source or documentation.

```powershell
node --experimental-strip-types scripts/careers/create-local-admin.mjs
```

The script creates the local account or reuses its saved credentials without
changing the password. It accepts only the loopback API on port 54331, verifies
login, protected identity/role rows, application/partner permissions, protected
HTTP routes and anonymous denial, without printing login credentials.
Assignments exist in both `admin_user_roles` and `admin_profile_roles`, because
the current login gate and legacy permission helpers use these respective
relations. No authorization relies on user-editable Auth metadata.

## Admin workspace verification

The workspace migration `20261107200730_admin_workspace_workflow.sql` is included
by the preparation script and was applied only to this local project. The module
bootstrap populates schema, not production business data. The original QA intake
record is preserved. The 37 existing module migrations were applied locally on
2026-11-07/08; there are no fake catalogue entries or fake analytics metrics.

```powershell
node scripts/careers/verify-admin-migration.mjs
node scripts/careers/verify-admin-workspace.mjs
npm test
npm run quality
npm run build
```

Migration verification uses a new disposable PostgreSQL database with explicit
Auth/storage stubs. Workspace integration separately uses real local Supabase
Auth, Storage, RLS and Next.js, with only synthetic users/roles/applications and
cleanup of that run's fixtures. No passwords, service keys or sessions are printed.
See [the admin implementation report](admin-workspace-implementation.md) for
functional scope, browser limitations and the pre-existing booking SQL lint issue.
