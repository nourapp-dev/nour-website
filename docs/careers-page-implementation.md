# Join Nour App and talent pool implementation

Local implementation on the existing feat/partner-interest-workflow branch.
Existing work on partnership, guide and administration files was preserved.
No publication, merge, production configuration changes or Laravel integration.

## Experience and content

No published vacancy source/table/API was found in this website. The page therefore
accepts talent-pool applications only. The six selectable professional areas are
explicitly expressions of interest, not vacancy cards or internal job titles.
No jobs, employee photographs, benefits, salaries, headcounts or response periods
were invented. Remote/hybrid work and internships are preferences, not promises.

The bilingual page includes the shorter introduction, a factual description of
technology/service/operations, six area cards, a talent-pool explanation, four
application stages, six native FAQ disclosures and a three-step application.
Selecting an area fills the form and moves focus to its beginning. Field choices,
contact details and selected File objects remain in memory through step/language
changes and failed attempts; they are not placed in persistent browser storage.

CVs remain optional. PDF/DOC/DOCX and the 5MB limit are retained. Selected filename
and size, replace and remove controls, review and unchecked privacy consent are
provided. The form separates opportunity type from work arrangement and accepts
zero years of experience. The original country selector and 250-country reference
are reused; calling code is editable independently of residence.

## Actual receiving mechanism

The existing Supabase job_applications table and private application-files bucket
remain the destination. POST /api/applications/join is a server-side adapter to
those existing resources, not an external integration or a new HR system.

It bounds multipart size even without Content-Length, checks origin, validates all
supported fields, checks file size/MIME/signature and Word container structure,
checks that the bucket is private and uploads only during final submission.
PDF detection checks its header/trailer; DOC checks the OLE header and Word stream;
DOCX checks bounded ZIP entries and required Word XML parts. This is format checking,
not antivirus scanning. No CV content is rendered or logged.

Object names use random keys rather than candidate names or original filenames.
No public file URL is returned. The server forces status=new, selects the actual
inserted database ID and returns only that reference. The in-memory submission key
makes unchanged retries idempotent. Failed database inserts remove this attempt's
uploaded object; a duplicate race returns the saved record ID and removes only its
own unused object. No confirmation email or notification is claimed or sent.

All new preferences are stored, including portfolio URL. Legacy employment_type
is populated compatibly (freelance maps to other); opportunity_type retains the
exact preference and work_mode is a separate column. specialization retains a
readable Arabic area label while career_area stores its stable code.

Migration 20261106213449_talent_pool_intake.sql is additive. It preserves old
records and their existing remote employment_type; it does not infer/backfill new
preferences. It requires the original applications module and existing private
storage setup, not the partnership wizard migration. It keeps existing admin
view/manage roles, scopes CV reads/deletes to applications permissions and an
existing request, and prevents anonymous job-path storage uploads bypassing server
validation. Public partner-path uploads retain their existing behavior.
The old direct browser CV-upload path must no longer be used once this migration
is deployed; the updated public form always uses the validated server endpoint.

## Runtime prerequisites and real limits

On 2026-11-07 the user selected an isolated local environment. Docker Supabase
`nour-intake-local` is running at http://127.0.0.1:54331, with Studio at
http://127.0.0.1:54333. The intake migrations and private bucket are applied there.
The local page's `.env.local` now points to this local stack and contains its
server-only service-role key. The previous environment was backed up in an ignored
`.env.local.before-isolated-supabase` file. No credential values were printed or
committed, and no cloud project schema, policies, credentials or data were changed.

Live requests through the Next.js endpoint successfully saved synthetic candidate
records and private PDFs, returned database-generated references, deduplicated
retries, accepted an optional CV, and denied anonymous CV reads/direct uploads.
All test-created records and files were removed after verification.

This is an intake-only local schema, not a clone of the production catalogue or
production administrator accounts. A local super administrator was subsequently
created with the existing normalized RBAC/admin-role migrations; see the local
setup document. A pre-existing historical migration refers to `roles.key`
although foundation defines `roles.code`; the isolated bootstrap therefore uses
the foundation, applications module, bucket initializer and current intake
migrations. Historical migration files remain unchanged. The new talent migration's
UTF-8 BOM was removed so the real Postgres migration runner can execute it.
See [local setup and restart instructions](local-supabase-intake.md).

## Files and responsibilities

- app/join-us/page.tsx: server entry, query language, localized metadata and local noindex.
- app/join-us/CareersPage.tsx: bilingual content, professional-area selection and page state.
- components/TalentForm.tsx: three-step form, validation/focus, CV state and review/retry flow.
- components/careers.module.css: scoped additions to the existing partnership design system.
- career-copy.ts: bilingual form/helper/error text.
- utils/talent-application.ts: classifications, input validation, metadata limits and payload mapping.
- services/jobApplications.ts: actual same-origin multipart submission, error codes and authoritative reference check.
- app/api/applications/join/route.ts: bounded multipart/origin checks and safe response boundary.
- src/server/applications/cv-validation.server.ts: server-only format inspection.
- src/server/applications/job-intake.server.ts: private upload and allowlisted record creation.
- supabase/migrations/20261106213449_talent_pool_intake.sql: nullable preferences/retry key and scoped storage policies.
- tests/talent-intake.test.mjs and talent-wizard.test.mjs: focused server/service/UI verification.
- scripts/careers/verify-intake-db.mjs: optional PGlite integration test without external writes.

## Verification

- npm test: 159 passed, including partnership/guide/home/program/booking regressions.
- npm run quality: TypeScript passes; ESLint has no errors and 26 existing warnings
  outside this update. Changed-file lint passes.
- Server tests: valid PDF/DOC/DOCX, signature spoofing, unsupported/corrupt/encrypted
  containers, oversize limits, optional CV, public-bucket rejection, failed-insert
  cleanup, retries, saved fields, origin/body validation and safe error output.
- UI test: areas, independent full_time/remote choices, country, zero/negative years,
  CV type/size/replace/remove, language retention, step editing, consent, pending,
  generic failure, server CV rejection, retry, duplicate prevention and success-only reset.
- PGlite: additive fields/read-back, zero experience, separate preferences, UUID
  uniqueness, legacy data, private bucket, direct CV upload denial, retained partner
  uploads, anonymous/cross-module CV read denial and authorized old-CV access.
- Initial HTML for Arabic and English returns HTTP 200 with six area choices and
  the correct reading direction. No real candidate data or production record was used.
- CSS covers 390px/768px/1440px and the existing html[data-theme=dark] convention.
  These layouts, colors and actual file-picker behavior still require visual browser
  QA; JSDOM does not verify layout. The browser access host was unavailable in
  this session, so no desktop/mobile page or form screenshots could be captured.

Preview: http://localhost:3107/join-us?lang=ar
