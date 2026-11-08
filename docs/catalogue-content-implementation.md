# Catalogue, markets, journey map and website editor — 2026-11-08

Repository nourapp-dev/nour-website, branch feat/partner-interest-workflow.
The previous admin/partner/careers/guide work is retained, uncommitted.
Local-only API is verified as 127.0.0.1:54331; preview is localhost:3107.
No Laravel, booking/payment logic, launch flags, deployment, merge or push changes.

## Root-cause evidence before changes

`scripts/careers/diagnose-local-catalogue.mjs` uses real local anonymous/admin
sessions without printing keys/passwords. Admin countries and programs succeed
with zero rows. Anonymous countries/programs fail with 42501 (missing table
privileges); cities/departures fail on the parent country/program checks. The
active local policies have admin-only SELECT on countries/programs/media, and
public child policies refer to these parents. Thus empty data is not the error.
Existing schema bootstrap replayed migrations, but the repository also contains
authorization definitions outside that migration sequence.

Before this change, `getPublicCountries` depended on a program-count request, and
`getJourneyCatalog` used fail-fast Promise.all across four independent resources.
These compound partial failures into a single map error. The fix must preserve
published-only projection, never use fixture data as a network-error fallback.

## Implementation contract

- Keep countries as the existing UUID-backed market/display records; use a
  versioned external directory for reference selection, not a parallel markets DB.
- Add nullable legacy-compatible market/publication/display fields. Null legacy
  publication follows the pre-existing is_active visibility; market remains
  explicitly unclassified. New rows default to hidden draft/setup, not available.
- Keep departure_cities, program_meeting_points and program_departures IDs and
  relationships. Support reusable city points and an optional departure point;
  keep private operational contacts outside public projections.
- Public reads expose only published fields, with parent visibility and market
  checks. Program counts are distinct programs; departures do not imply booking.
- Keep Leaflet/OSM, attribution, list fallback and lazy map mounting. Separate
  country/city/program/departure loading; retain safe partial data with explicit
  errors and per-resource retry.
- Extend the existing home presentation JSON and actual home components. The
  known sections use typed fields; independent CEO/legal editors stay canonical.
- Use existing platform_settings published/draft keys plus an immutable version
  ledger; checked draft and published versions, separate edit/publish permissions,
  authenticated no-store/noindex preview, atomic publication/restore and cache
  invalidation. No store links or content configuration can open the paused launch.

## Implemented data contract

Country reference selection uses **world-countries 5.1.0** (ODbL-1.0) and
**countries-and-timezones 3.11.0** (MIT). The 250-entry snapshot, checksums,
attribution and source licenses live in `src/features/countries/data/`.
Names are the source's translations; currency labels use the recorded ICU/CLDR
version. This is a community reference dataset, not an assertion of diplomatic
recognition or an official ISO authority. The timezone selector includes IANA
canonical names and source-provided aliases. Country arrays may have zero or
multiple currencies, calling codes and zones. No countries were seeded as markets.

Sources: <https://github.com/mledoze/countries>,
<https://github.com/manuelmhtr/countries-and-timezones>.

Relationships remain in the existing tables:

```text
Versioned directory selection → countries.id (existing UUID)
  market_status: setup | coming_soon | browsable | paused
  publication_status + show_public + show_on_map + operational is_active
  ├─ departure_cities.country_id
  │    ├─ program_meeting_points.city_id (reusable when program_id is NULL)
  │    │    └─ meeting_point_operations.point_id (private contact details)
  │    └─ program_departures.origin_city_id
  └─ programs.country_id
       └─ program_departures.program_id
            └─ optional meeting_point_id + departure_timezone
```

Old program-specific meeting points retain `program_id` and `departure_id`.
The point editor does not overwrite those legacy associations. Linked locations
cannot be hard-deleted; archive them. Moving a linked point to an incompatible
city is rejected. New countries/cities/points are drafts. Nullable legacy fields
preserve previous visibility explicitly rather than silently classifying markets.
Publication permission is required for clearing publication fields to legacy NULL
or reactivating a previously published location, as well as ordinary publication.

Public RLS applies parent visibility. Coming-soon and paused countries can have
published descriptive listings, but their programs are not available publicly.
The private operational contact table has no anonymous grant. Zero coordinates
are valid; missing coordinates remain unplottable and are not converted to zero.
The directory form, counts and linked admin country/program filters use stable IDs.

## Public map and filters

The existing Leaflet/OSM implementation, attribution, clustering and tile-failure
list fallback remain. International selection drills from country to its cities;
country-wide and city-specific program links use real filter IDs. List and map
share selection state, including across refetch. Counts are distinct programs,
not departure counts or cluster counts. A route is drawn only for a selection and
is labelled illustrative, not navigation. Mobile keeps the list before a lazy map.

The four journey sources settle independently: a failed source is reported by
name while successful sources remain usable. Retry refreshes the catalog group.
Failed program counts are unknown, not zero. Country flags can use ISO-derived
emoji if an asset fails. The city-filter page treats required source errors as
errors rather than a successful empty result. Published scheduled departures
can be browsed even with no bookable seats; this changes browsing, not booking.
The existing price fields and booking functions are unchanged.

Departure input and rendering use the saved IANA timezone. Old records without
a timezone are explicitly treated as UTC. Ambiguous/nonexistent DST input is
rejected rather than silently choosing a different instant.

## Actual content inventory and source of truth

- Hero: presentation JSON; two-phone/photo images and text retained on mode switch.
- Program preview: existing programs editor and publication data.
- Services: typed presentation fields; closed-payment operational card remains protected.
- Map: typed heading/description; locations/programs/departures use their own editors.
- How it works: typed heading/description and existing step content.
- App showcase: typed content, ordered screens, visibility, preview labels and media.
- Why Nour: typed headings and existing reasons.
- Our focus (`NourStatistics`): descriptive priorities, **not numerical statistics**;
  editable headings/card titles/descriptions, retaining its existing design/order.
- CEO message, articles and legal: links to their existing dedicated editors.
- Payments: typed introduction; approved provider artwork and closed-payment
  notice remain operational content.
- Download section: visibility and staged store URLs; actual rendering stays
  “App coming soon”, with no live downloads, QR or booking enablement.
- Contact/footer: existing settings and contact hooks, linked from the editor.

Known home/CEO JSON is excluded from the generic settings form. There is one
editor for each known source. Static decorative labels and approved operational
notices remain code-owned; this is not a free-form page builder.

The new section picker and AR/EN tabs edit short typed groups. Dirty state,
saved timestamps/editor name, draft/hidden/incomplete/published section state,
and a field-level before/after review are available. Section order stays fixed.
The current media library can be reused without duplicate uploads. New uploads
require preview and bilingual alt text; metadata shows dimensions/type/size.
Hero photos have focus controls. Program covers alone require 16:9 (tolerance
0.01), at least 800×450 and at most 5 MiB; 1600×900 is recommended. Dimensions
are read before upload and the DB validates newly assigned covers. Existing
unchanged covers remain compatible. Used assets and retained revision assets
are protected from storage replacement/deletion and media soft-deletion.

## Draft, preview, publish and restoration

The existing `website.home_presentation` and private
`website.home_presentation_draft` rows remain canonical. `content_revision` and
`base_revision` implement optimistic concurrency; `website_presentation_versions`
is an immutable publication ledger, not a second editable content store.

`website_content_write` locks both settings rows consistently. Draft saves never
write the public row. Publishing commits one JSON snapshot atomically; stale
draft/published revisions return PT409. Restoration inserts a new publication
version referencing the restored version. Publisher/time are retained. A
meaningful existing draft is not overwritten by initialization.

`website.edit` (or the legacy `settings.manage`) permits editing only.
`website.publish` is independently required for publish/restore. Generic settings
RPCs and direct SDK writes cannot bypass ownership of these two settings rows.
No automatic role grants were made; a super administrator can assign the new
permissions through the existing role editor.

The authenticated `/admin/website/preview` renders the actual `HomeClient` and
its actual components with the saved draft context. It supports languages,
themes and 390/1024/1440 iframe widths. The proxy sets noindex, no-cache/no-store
and a private response; Next dev emits `Cache-Control: no-cache, must-revalidate`
for the streamed page. `Surrogate-Control: no-store`, Pragma and dynamic rendering
also apply. Production response headers are checked separately below. The editor
and preview alone allow same-origin framing; other pages retain their framing
policy. `/api/admin/website` checks session and origin, calls the permission-aware
RPC with the user's identity, and invalidates the home layout after publication.
Public settings refetch on window focus; open tabs do not silently keep a stale
five-minute snapshot after the user returns to them.

The production build was run temporarily on localhost:3108. Authenticated HTTP
checks passed for the editor, countries, cities and Arabic/dark plus
English/light preview URLs with `private, no-store` and `noindex`. Anonymous
preview requests redirected to login. Same-origin framing headers were checked.
The temporary production server was then stopped; the working preview remains
localhost:3107. These are HTTP checks, not visual verification.

## Files and migrations

Main implementation: `src/features/countries/` (directory, market form, list,
relations and LocationManager), `src/features/journeys/` (public contracts and
timezone conversion), `src/features/programs/ProgramDeparturesPage.tsx`,
`src/features/website/` (typed sections/editor/media/preview), actual home
components, `app/api/admin/website/route.ts`, preview route and proxy/CSP rules.

Applied **only to the isolated local database**, then recorded in local history:

1. `20261107212725_catalogue_markets_content_workflow.sql`
2. `20261107214236_website_revision_workflow.sql`
3. `20261107215022_catalogue_media_guards.sql`

For a fresh isolated setup, follow `docs/local-supabase-intake.md` first, then run:

```powershell
node scripts/careers/bootstrap-local-admin-modules.mjs
node scripts/careers/apply-local-catalogue.mjs
npm run dev -- --port 3107
```

The helpers assert the actual loopback API and target the named local container.
The catalog migrations depend on the historical modules; do not put them into
the initial minimal intake migration sequence. `apply-local-catalogue` records
each successful transaction and skips already-applied versions.

## Verification and limits

Commands (from the website repo):

```powershell
npm run quality
npm test
npm run build
node --experimental-strip-types --import ./tests/register-types.mjs scripts/careers/diagnose-local-catalogue.mjs
node --experimental-strip-types --import ./tests/register-types.mjs scripts/careers/verify-catalogue-content.mjs
node scripts/careers/verify-catalogue-migrations.mjs
# Optional, while a temporary local `npm run start -- --port 3108` is running:
node scripts/careers/verify-production-preview.mjs
npx supabase db advisors --local --type security --level warn --workdir .next-ui-preview/supabase-local
npx supabase db lint --local --schema catalogue_private,public --level error --workdir .next-ui-preview/supabase-local
```

The integration script uses real local Auth/PostgREST and Next routes. It tests
draft markets, coming-soon visibility, distinct program counts across multiple
departures, multiple reusable points, private contacts, hidden cities, invalid
timezones, linked-delete rejection, an editor without publish permission,
draft privacy, stale writes, generic/direct bypass denial, authenticated preview,
immutable versions and restoration. It removes only its own synthetic catalog
and editor records, restores the original published content and retains immutable
local publication audit. The prior careers QA record is preserved.

The clean migration replay uses a dedicated temporary PostgreSQL database and
explicit Auth/storage stubs, then drops only that database. Real Auth and HTTP
are tested separately. Unit/DOM tests cover directory multiplicity, zero/missing
coordinates, partial source errors, timezone/DST behavior, cover validation,
international drilldown, shared map/list selection and refetch, both languages,
and mobile map/list behavior. DOM tests are not browser screenshots.

Final quality check: **0 errors, 25 existing warnings**. **181/181 tests passed**;
the optimized production build passed. Real local integration, clean migration
replay and authenticated production HTTP checks passed. Logs include
`catalogue-quality.log`, `catalogue-tests.log`, `catalogue-build.log`,
`catalogue-integration.log`, `catalogue-migration-test.log` and
`catalogue-production-check.log` under the ignored `.next-ui-preview/` directory.

Security advisors: no issues found. The combined performance advisor reports
56 warnings: 21 auth-initplan and 35 multiple-permissive-policy notices across
the existing module policies and the public/admin catalog read paths. A redundant
read policy on the new operations table was removed; neither new table has a
remaining advisor warning. These performance notices are not reported as security
passes or silently fixed by changing existing authorization semantics.
SQL lint: no new function errors; the existing
`public.create_program_booking` has SQL42702, ambiguous `booking_id`. It predates
this task and was left untouched because booking changes are expressly excluded.

Visual verification remains **blocked**: browser host is unavailable; the native
Computer Use fallback stopped because it could not confidently determine the
browser URL. No screenshot or visual pass is claimed for either theme or the
1440/1024/390 matrix. Test/build logs are local ignored files under `.next-ui-preview/`.

## Rollback and retained data

For a content rollback, use the editor's version restoration; it creates a new
audited version and refreshes the public content through the same publication
path. Do not mutate/delete ledger rows.

For an application rollback, preserve a database backup and export the two
settings rows, version ledger and new location fields before switching the
frontend. Leave additive columns/tables in place so reference data, legacy
relationships, drafts and operational contacts are not lost. Disable the old
generic presentation writer during rollback; do not remove the publish guard or
replace it with public policies. A database reversal requires an explicit reviewed
data-mapping plan after exports (reusable points cannot regain NOT NULL program_id
without choosing their program ownership). No destructive down migration or
database reset was run here. Prefer a forward compatibility fix.

No production connection, production migration, deployment, merge, commit or push
was performed. Laravel, pricing, booking/payment logic and launch gates were not
changed.
