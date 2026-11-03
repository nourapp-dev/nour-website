> Historical reference / مرجع تاريخي: this document describes its stated audit/schema date, not the current deployed state. No live re-audit or schema verification was performed on 2026-11-03. See [release readiness](release-readiness.md) and [database documentation](Database.md).

# NourApp Full Audit — 2026-08-26

## Scope

This audit covers the current `master` codebase, the connected Supabase Production project, and the public `nourappglobal.com` endpoint.

## Baseline

- Repository: `issabarnawi-bit/nour-website`
- Baseline commit: `21472351dfd622c306016b1885ab4aab2af49e71`
- Production database: Supabase project `nour-platform` (`fsgxtdhmmbkadjozqgck`)
- Production database status at audit time: healthy
- Framework: Next.js 16.2.10 / React 19.2.4 / TypeScript 5 / Supabase

## Priority findings

### P0 — Public domain does not serve NourApp

The apex `nourappglobal.com` currently exposes a web-server directory index instead of the NourApp application. Treat this as a release-blocking DNS / origin / virtual-host configuration issue. Directory listing should be disabled after the correct application origin is attached.

### P0 — Migration history is not reconciled with Git source

Production migration history contains recent migration versions that do not match the filenames currently present under `supabase/migrations/` for the same logical changes. No new Production DDL should be applied until this is reconciled.

#### Confirmed Production ↔ repository version map

The logical migration names match, but the recorded Production versions differ from the repository filenames for these migrations:

| Logical migration | Production version | Repository filename version |
|---|---:|---:|
| articles_and_ceo_content | 20260822004339 | 20260822033000 |
| reconcile_ceo_message_setting | 20260822005752 | 20260822043000 |
| program_detail_content | 20260824222011 | 20260825011600 |
| program_detail_content_table_grants | 20260825025239 | 20260825055100 |
| scope_program_detail_content_policies | 20260825030530 | 20260825060500 |
| program_departures_availability | 20260825032353 | 20260825033000 |
| link_price_tiers_to_departures | 20260825214705 | 20260826005000 |
| booking_core | 20260825223827 | 20260826015500 |
| pilgrim_accounts_and_booking_auth | 20260825225858 | 20260826020500 |
| pilgrim_document_column_grants | 20260825230042 | 20260826020700 |

All earlier recorded migration versions through `20260821220000_add_media_cleanup_reconciliation` match the repository migration filenames by version/name, except intentionally short historical versions such as `20260729` and `20260819` which also exist in Git with those names.

#### Reconciliation decision

Do **not** edit the Production migration ledger ad hoc and do **not** replay the ten logical migrations. Before the next Production migration, establish a canonical migration-history repair procedure that preserves the already-applied schema and makes CLI/deployment history deterministic. The repair must be reviewed as an operational action, not hidden inside an application migration.

### P1 — SECURITY DEFINER surface needs explicit privilege review

Supabase security advisors report multiple `SECURITY DEFINER` functions callable by `anon` and/or `authenticated`. Some are intentionally public and contain internal validation, while others should not expose unnecessary direct RPC execution.

Specific review targets include `create_program_booking`, `has_permission`, `is_super_admin`, `current_user_has_permission`, `admin_set_booking_status`, program deletion/restoration/publication functions, platform settings/legal publication functions, and media cleanup functions.

The public analytics, subscription, unsubscribe, maintenance-mode and public-settings/legal readers require separate treatment because anonymous execution may be intentional.

### P1 — Auth leaked-password protection is disabled

Enable leaked-password protection in Supabase Auth before public account launch.

### P1 — Trigger search_path advisory

`public.set_updated_at()` has no fixed `search_path`. Harden it through a reviewed migration after migration reconciliation.

### P1 — RLS and privilege model requires consolidation

Several tables have RLS enabled without policies. This can be intentional deny-by-default behavior, so table grants must be checked before changing policies. Several other tables have overlapping permissive policies and repeated `auth.uid()` calls that Supabase flags for performance.

### P2 — Database performance cleanup

The database advisor reports multiple unindexed foreign keys, including booking and pilgrim-document relations; duplicate indexes on `permissions.key` and `roles.key`; multiple permissive SELECT policies; and RLS initialization-plan inefficiencies. Unused-index warnings are not an immediate deletion target because the production workload is still young.

### P1 — No repository quality gate existed

The repository had no `.github/workflows` quality workflow and `package.json` exposed only dev/build/start/lint scripts. Phase 0 adds a deterministic lint + TypeScript gate for pull requests.

### P2 — Project documentation is still bootstrap documentation

`README.md` is still the default create-next-app README. Replace it with architecture, local setup, environments, deployment, Supabase migration workflow, security rules and recovery procedures.

### P2 — CSP is present but can be hardened further

The project already sets global CSP/HSTS/referrer/permissions/frame/content-type headers. Production CSP still allows `unsafe-inline` for scripts and styles. Move toward nonces/hashes after confirming the Next.js 16 rendering path and third-party requirements.

## Development plan

### Phase 0 — Stabilization & reconciliation

1. Establish PR quality gate. **In progress on audit branch.**
2. Fix domain/origin routing and disable directory listing. **External hosting/DNS action required; no Vercel connector is available in this workspace.**
3. Reconcile Production migration ledger with repository migration files. **Version map captured; repair/replay remains frozen.**
4. Record a Production schema/RLS/function/grant snapshot. **Next audit action.**
5. Freeze new Production DDL until reconciliation is complete. **Active.**

Exit criteria: domain serves intended app, migration histories are deterministic, quality gate passes, Production baseline is documented.

### Phase 1 — Security & authorization hardening

1. Classify every `SECURITY DEFINER` RPC as public, user-owned, admin-only or internal.
2. Revoke unnecessary EXECUTE privileges and keep authorization checks inside privileged functions.
3. Harden `search_path` for privileged/trigger functions.
4. Verify RLS and table/column grants for all exposed schemas.
5. Enable leaked-password protection.
6. Optimize repeated auth calls and overlapping RLS policies without changing behavior.
7. Re-run security and performance advisors.

Exit criteria: no unexplained security warnings, verified RBAC/RLS matrix, regression tests for admin/pilgrim/anonymous access.

### Phase 2 — Booking and pilgrim transaction integrity

1. Add booking RPC contract tests.
2. Verify concurrent seat reservation and expiration behavior.
3. Add idempotency protection for booking/payment operations.
4. Validate booking state transitions and audit history.
5. Review document upload/storage access and retention.
6. Add payment-provider architecture without client-side trust.

Exit criteria: deterministic booking state machine, concurrency tests, no overselling, auditable transitions.

### Phase 3 — Engineering quality and observability

1. Add unit/integration/E2E test layers.
2. Add database type generation validation.
3. Add structured application/error logging and alerting.
4. Add deployment health checks and release rollback runbook.
5. Replace bootstrap README with operational documentation.

### Phase 4 — Public site quality

1. Performance/Core Web Vitals pass.
2. Accessibility and RTL/LTR audit.
3. SEO metadata, sitemap, robots, canonical URLs and structured data.
4. Harden CSP using nonce/hash strategy where feasible.
5. Validate mobile booking journey and program-detail conversion flow.

### Phase 5 — Admin operations

1. Complete bookings operations and permissions.
2. Complete analytics/subscribers reporting.
3. Validate articles/legal/settings workflows.
4. Add actionable audit-log views and operational alerts.
5. Run role-based acceptance testing for every admin module.

### Phase 6 — Release readiness

1. Staging-to-Production release rehearsal.
2. Backup/restore validation.
3. Security regression and dependency review.
4. Production smoke tests.
5. Monitoring, incident ownership and post-release verification.

## Execution rule

Production database changes must be performed through reviewed, version-controlled migrations after the migration-history reconciliation is complete. No ad-hoc Production DDL should be introduced while the ledger is divergent.
