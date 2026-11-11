# Program enquiries and group requests

Prepared 2026-11-11. Branch: `feat/program-inquiries-groups-20261111`.

## Changes

- Contextual WhatsApp enquiries carry the program title and canonical localized URL, using the public contact configuration.
- Cards, detail sidebars and mobile detail bars offer enquiries. Booking remains paused.
- `/group-trips` offers Arabic/English group preferences, a reviewable message summary and an explicit WhatsApp handoff. It does not send requests automatically or claim they have been received.
- Homepage and public navigation link to group requests. Homepage search exposes cities and travel months only when backed by published program facts; results retain removable month filters and departure-local timezone handling.
- Program overview uses a shorter introduction; the complete stored description remains accessible. Flight inclusion is repeated near prices.
- Empty departure states distinguish demo planning from confirmed operating dates. No dates are inferred from narrative text.
- The three known editorial covers that accidentally reuse the CEO portrait receive existing Nour Kaaba images. Changing the media in the dashboard overrides the correction.
- The existing live phone orbit, authentication entry, gallery and article improvements are retained. Diff against live branch `53448fef11e0679276c55c3499dd57b47a5c3929` is limited to this feature.

## Validation

- `npm test`: 256 passed, 0 failed.
- `npm run quality`: passed; 23 warnings, 0 errors.
- `npm run build -- --webpack`: passed with placeholder public Supabase build configuration, without production credentials. This is compilation/prerender validation, not a live data or integration check.
- `git diff --check`: passed.
- Live browser visual QA, WhatsApp handoff QA and a build against the production environment remain for deployment.

## Publication state

The website is unchanged by this release. GitHub rejected the source tree upload through automatic approval review, citing disclosure of application code to a public repository without explicit destination-specific approval. No branch with these changes was published and no Hostinger cutover was attempted. Three image blob objects were accepted before the source tree upload was blocked; no reachable source commit or branch was created for them.

The verified destination is the existing public repository `nourapp-dev/nour-website`. Obtain explicit user approval for uploading these changes there and publishing the resulting release to `https://nourappglobal.com` before retrying. Preserve the active release and use a new release directory and the exact reviewed SHA through `ops/deploy-hostinger.sh`.
