# Partnership page and interest wizard

Implemented locally on the existing feat/partner-interest-workflow branch.
No merge, publishing, production setting change or Laravel integration.

## Experience

- A quieter blue/yellow introduction, two selectable track cards, partnership
  purpose, five joining stages, track-specific requirements and six native FAQ disclosures.
- One guide/download section. Existing Arabic v1.1 and English v1.2 files,
  guide content, release metadata and URLs are unchanged in this update.
- Three form steps: scope, organization, then contacts/review/consent. Service
  providers select multiple service areas. Scope and contacts survive back/forward,
  track and language changes. No application data is stored in browser storage.
- Searchable country comboboxes support Arabic/English names and country codes,
  keyboard selection, field errors and focus. Calling code is independent from
  headquarters and can be changed. Format validation accepts international numbers
  and normalizes Arabic/Persian digits; it does not verify number ownership.
- No attachments, partner account, tracking system, notification system or new
  admin screen is introduced. Current booking/app availability flags are untouched.

## Submission and compatibility

The project owns its Supabase table/service. The wizard calls
`submit_partner_interest` on that existing database. PostgreSQL generates and
returns the saved row ID; the UI never displays the client-generated idempotency
key as an application reference. No success is shown without a valid server ID.
An unchanged retry uses the same key. Editing the draft starts a new submission
intent. An in-flight lock prevents simultaneous duplicate submissions.

Migration `20261106210049_partner_interest_wizard.sql` depends on the earlier,
still-local `20261106201850_partner_interest_workflow.sql`. It adds nullable
`headquarters_country`, `service_types` and unique nullable `submission_key` to
`partner_applications`. Existing operating-country and coverage columns are reused.
The first selected service is also stored in legacy `partner_type`; every selection
is retained in `service_types`. Existing callers retain their original submission
path. There is no silent fallback that drops the new fields when the RPC is missing.

The public RPC is deliberately create-only. It validates an allowlisted payload,
forces status=new and consent, ignores administrative input and returns only the
inserted ID. Its restricted SECURITY DEFINER boundary avoids granting anonymous
SELECT access to private requests. Existing table RLS, role assignments and grants
are unchanged. Execution is explicitly revoked from PUBLIC and granted only to
the existing anon/authenticated intake roles.

Neither migration has been applied to the connected production database. Until
these migrations are applied to the intended non-production/production environment
through its normal release process, the live wizard will report a registration
error rather than simulate success. No production records were created in testing.

## Files

- app/become-a-partner/page.tsx: page composition, bilingual sections and track state.
- src/features/applications/components/partnership.module.css: scoped responsive,
  light/dark and reduced-motion styles; no global redesign.
- components/PartnerInterestForm.tsx and CountrySelect.tsx: form behavior and combobox.
- utils/partner-interest-form.ts: draft, step validation and complete submission mapping.
- services/partnerApplications.ts and utils/partner-interest.ts: validated RPC path,
  authoritative reference handling and legacy compatibility.
- data/country-options.json: snapshot of the existing workspace country reference;
  provenance/licenses in docs/partner-country-sources.md. No runtime Laravel dependency.
- tests/partner-interest.test.mjs: isolated UI and service tests without live writes.
- scripts/partners/verify-interest-db.mjs: PostgreSQL integration verification using
  an optional external test-only PGlite installation; no project dependency added.

## Verification

- npm test: 152 passed, including the original home/program/booking regressions.
- npm run quality: TypeScript passes; ESLint has no errors. Existing unrelated
  warnings remain; changed source files pass targeted lint.
- PGlite: real SQL migrations, new-row insert/read-back, all new fields, server ID,
  retry idempotency, malformed input rejection, approval injection prevention,
  anonymous read denial, unauthorized update denial and legacy record preservation.
- JSDOM: track selection, multi-service choices, country search, step validation,
  Enter behavior, error focus, independent calling code, review/back/edit, language
  retention, unchecked consent, pending/failure/retry/success, duplicate prevention
  and absence of application/contact data in localStorage.
- Existing guide tests verify downloads and unchanged checksum manifest.
- Preview: http://localhost:3107/become-a-partner returns HTTP 200.
- Responsive CSS covers 390px, 768px and 1440px; dark styling follows the existing
  html[data-theme=dark] convention. These sizes/themes have NOT been visually
  verified. Browser host access was unavailable, so no page/form screenshots were
  captured. JSDOM tests do not substitute for browser layout verification.
