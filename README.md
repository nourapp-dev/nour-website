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

Deploy this as a **Next.js Node.js Web App** from the GitHub repository. Supported managed plans currently include Business Web Hosting and Cloud plans; a VPS needs a separate process manager and reverse proxy configuration.

| Setting | Value |
| --- | --- |
| Repository | `nourapp-dev/nour-website` |
| Branch for this review | `feat/website-browse-mode-hostinger` |
| Framework | Next.js |
| Project root | Repository root (`.`) |
| Node.js | 24.x, at least 24.15.0 |
| Install | `npm ci` |
| Build | `npm run build` |
| Start | `npm run start` |
| Build directory, if requested | `.next` |

Use the reviewed deployment branch initially, or the default branch after the reviewed changes are merged. Do not use a static export: the application includes authentication, API routes and request handling that require Node.js.

Add these values in Hostinger's environment variable settings before building:

| Variable | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The full HTTPS staging URL during preview; `https://nourappglobal.com` for final deployment |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing project's public publishable key |
| `NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED` | `false` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, if administrator user-management endpoints are required; enter privately in Hostinger |

Do not upload local environment files or commit credentials. A Supabase database migration is not required for this website release; the existing database, storage and authentication remain in Supabase.

### Domain cutover

1. Deploy to a Hostinger preview/staging address and check the homepage, Arabic/English layouts, programs, images, account callbacks and admin sign-in.
2. Confirm the booking pause message, absence of checkout, and HTTP 503 from `POST /api/bookings`.
3. Add the exact new preview/final authentication callback URLs to the existing Supabase redirect allowlist. Keep the current production callback working during the transition.
4. Connect `nourappglobal.com` and its `www` alias through the Hostinger dashboard. Use the DNS targets supplied for this specific deployment. Preserve existing mail (MX/TXT) records.
5. Set the final `NEXT_PUBLIC_SITE_URL`, rebuild, verify HTTPS and canonical links, then switch traffic. Keep rollback available until the new deployment is verified.
6. Retire the old website deployment after verification so its older booking interface is not used.

The Hostinger account/plan and current DNS records must be inspected before switching the domain. No production deployment or DNS change is performed by these repository changes.

Official guides: [Node.js migration](https://www.hostinger.com/support/how-to-migrate-a-node-js-application-to-hostinger/), [supported plans and deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/), [environment variables](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/).
