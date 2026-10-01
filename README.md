# Nour website

Public Arabic/English website and administration interface for `nourapp-dev/nour-website`, built with Next.js and Supabase.

## Local development

Use Node.js 24.15 or later in the 24.x series (`.nvmrc` selects Node 24).

```sh
npm ci
cp .env.example .env.local
```

Fill in the Supabase URL and publishable key, and set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. On Windows PowerShell, use `Copy-Item .env.example .env.local`.

```sh
npm run dev
```

## Website booking pause

`NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED` defaults to disabled unless its value is exactly `true`. Keep it `false` during the website launch:

- Programs, filters, pricing information and details remain available.
- Booking selectors and checkout do not mount, and old browser booking selections are cleared.
- The website booking client rejects submissions, and `POST /api/bookings` responds with HTTP 503 and `website_booking_paused` before authentication or database operations.
- Account access and administration remain available.

The flag is compiled into the build. Changing it requires rebuilding and redeploying. Before reactivation, test account authentication, published future departures, pricing, reservation expiry and payments in a test environment. The re-enabled website submits through the server route using the customer's Supabase session.

This change applies to this website release. It does not change Supabase RPC permissions or disable other applications and already deployed older website versions. Retire the previous website deployment after the domain cutover. If every database booking channel must be suspended, manage that separately in Supabase.

## Verification

```sh
npm run quality
npm test
npm run build
npm run start
```

The build needs the public environment variables. CI runs these checks with placeholder Supabase credentials; it does not create real bookings.

## Hostinger deployment

The website runs on the existing **Hostinger VPS with AlmaLinux 8 and cPanel**, using a dedicated Node.js runtime, a systemd service and cPanel's Nginx reverse proxy. The public URL is [https://nourappglobal.com](https://nourappglobal.com).

| Setting | Value |
| --- | --- |
| Repository | `nourapp-dev/nour-website` |
| Integration branch | `master` |
| Initial deployed branch | `feat/website-browse-mode-hostinger` |
| Initial deployed commit | `9ed4386452886783b10a0c8f83a8bae4c5e65171` |
| Last verified website release | `9f0f19bd52cb74de3723415ed9b0cf6ffe0c574d` (Nour browser icon) |
| Runtime | Dedicated Node.js 24.21.0 |
| Install | `npm ci` |
| VPS build | `npm run build -- --webpack` |
| Service | `nour-website.service` |
| Internal listener | `127.0.0.1:3100` |
| Website bookings | Paused; API responds with HTTP 503 and `website_booking_paused` |

See the [Hostinger VPS runbook](docs/hostinger-vps.md) for the installed paths, environment, proxy configuration, health checks, isolated release updates and rollback.

The initial production release used a directory named `nour-website-staging`; subsequent releases use separate directories under `/home/nourapp/nour-website-releases`. Confirm the active working directory with `systemctl show nour-website.service -p WorkingDirectory` before maintenance. Do not run `npm ci`, rebuild `.next`, or switch Git branches inside the running release.

This is a Node.js application, not a static export. Supabase still provides the existing database, storage and authentication; these were not migrated to the VPS. Keep environment files private and outside Git.

Database migration is deferred by the owner's decision on 2026-10-02 (Asia/Riyadh). The [migration assessment](docs/supabase-hostinger-migration.md) is retained for future reference. Merging repository changes does not run that assessment, install database services or switch the live website's provider.
