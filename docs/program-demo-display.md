# Demo programs with provisional prices

`programs.is_demo` is an explicit, opt-in display mode. Existing rows default to `false`. Editors can change it while the program is a draft. Publication still uses the existing `programs.publish` permission and published/browsable country checks.

For demos only, missing tax status and actual flight records are allowed; an origin city may be omitted. If a city is supplied it must still pass the normal published/country checks. Content, cover, currency, stay-night totals, room details, date validity and visa consistency remain required. Standard programs retain all existing readiness requirements.

Public cards and details show “عرض تجريبي · أسعار مؤقتة · السعر النهائي يُؤكَّد لاحقًا · غير متاح للحجز” / “Demo · Provisional prices · Final price confirmed later · Booking unavailable”. This notice uses the program's own flag and survives a failed display-facts request. Demo tax status is never inferred.

Demo bookings are rejected by a database trigger for inserts and program reassignment, including RPC calls. The client selector also refuses demo programs. Changing mode requires a draft and is refused for programs with existing bookings. Website booking flags are unchanged and must remain false for the current release.

## Rollout

1. Apply `20261109162521_program_demo_display.sql` through the normal migration process before deploying the frontend that selects `is_demo`. It creates no new public RPC and does not publish or modify any content rows.
2. Deploy the reviewed application commit following `hostinger-vps.md`; keep website booking, UI preview and app links disabled.
3. In the CMS, mark each intended draft as a demo. Save and review readiness. Publish the country through the existing authorized country workflow, then publish programs through their normal controls.
4. Verify anonymous Arabic/English cards and detail pages, the provisional-price notice, and the booking pause. Do not create real reservations to test.

The four California drafts created on 2026-11-09 are the intended initial content. They are not automatically opted in or published by this migration. Their country is currently a draft/setup market, so the country remains a separate publication prerequisite. No actual flights, tax policy, or confirmed inventory are fabricated.

## Validation

`npm run quality`, `npm test`, and `npm run build -- --webpack`.

`tests/program-demo.test.mjs` runs the actual new migration in isolated PGlite PostgreSQL, using a minimal existing-schema fixture and a standard-readiness contract. It verifies the demo exception boundary, unchanged regular readiness, retained authorization/market/content errors, non-bookability, and draft-only mode changes. This is not a full production migration replay or a live deployment check.

Production database migration applied on 2026-11-09 as `20261109162521_program_demo_display`. The four California drafts are opted into demo mode; they remain unpublished pending market publication and application deployment.
