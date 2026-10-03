# Isolated website accounts and geographic journey map

## Authentication

The website still uses the existing Supabase project. Administrator and pilgrim browser/server clients now use separate versioned cookie/storage keys and separate SDK instances. Existing `sb-*-auth-token` cookies are discarded rather than assigned to either identity. Users must sign in again after deployment. Local sign-out revokes only the selected session.

`/admin/*` and `/api/admin/*` require an active, undeleted administrator profile with a live role assignment. Existing API permission checks and database RLS remain in place. Pilgrim navigation/profile APIs reject administrative identities instead of silently displaying an administrator as a pilgrim. The admin invite route is `/admin/login/invite`, with the older `/admin/invite` retained as a redirect.

## Map and administrative data

The map uses Leaflet 1.9.4 and OpenStreetMap raster tiles, with visible attribution, normal browser caching and referrer policy. No API key, paid plan, prefetching or offline tile download is introduced. Tile availability is subject to the [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/); the accessible location list remains usable if tiles fail. The dashed line is explicitly illustrative, not road routing or live tracking.

- `/admin/cities`: manage city names, country, coordinates, visibility and archive/restore.
- Existing program departures: select the origin city.
- Existing program meeting points: select the city and optionally the specific departure, and preview/drag coordinates.
- Country coordinates are no longer replaced with hardcoded visual centers.
- Public Saudi journeys include only published active programs with a future open departure, available seats and a valid booking deadline from the selected city. Program lists can be filtered with `?city=<id>`.
- The international tab uses active countries and their published programs.

Migration `20261003144354_journey_city_map.sql` was applied to the existing managed project through the connected migration API on 2026-10-03. The follow-up `20261003150301_protect_journey_location_links.sql` prevents country/city edits from orphaning linked meeting points and was also applied. The first migration adds `departure_cities`, two links on meeting points and one on departures; existing data is retained. Four real Saudi city coordinates are seeded, but no programs or departures. Source coordinates: [GeoNames](https://www.geonames.org/search.html?country=SA) and [Saudi Geographical Society](https://sgs.ksu.edu.sa/en/node/3049). Do not replay all historic migrations; see the existing production migration-history warning in `FULL_AUDIT_2026-08-26.md`.

Read-only inventory found zero non-deleted website programs. Laravel/mobile program data is a separate source and is not silently synchronized in this release. A disabled country record named Riyadh has ISO2 `ES` and a negative longitude; it is left unchanged rather than guessing its intended identity.

## Verification and deployment

Run `npm run quality`, `npm test`, and `npm run build`. Auth integration tests exercise two real Supabase SDK clients with a simulated browser cookie jar and mocked Auth responses: simultaneous independent users, no accidental session adoption, and local sign-out isolation. They do not create live users or send emails. Additional tests cover role rejection, return-path boundaries and exact coordinate propagation.

Database verification confirmed four city rows, enabled RLS, four policies, no anonymous writes and no client permanent-delete grant. The advisor scan had no findings for the new table/function; existing project findings remain outside this change, including [mutable search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Deploy the reviewed commit using `ops/deploy-hostinger.sh` from a new release directory, following `docs/public-launch-cleanup.md`. Keep booking paused. This repository has a quality workflow, not an automatic Hostinger deployment. The current task environment has no Hostinger SSH/console access. Local HTTP checks verify anonymous redirects and homepage rendering; the cloud browser could not access localhost, so real-browser desktop/mobile visual QA and live administrator/pilgrim acceptance remain required on the deployed preview.
