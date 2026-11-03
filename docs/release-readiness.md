# تجهيز إصدار الواجهة / UI release readiness

Updated: 2026-11-03. Local documentation and final-audit fixes are complete. The user authorized a branch upload on 2026-11-03; this document accompanies that release commit. No merge, deployment, database migration or production configuration change is included.
تحديث التوثيق لا يعني تنفيذ النشر أو إثبات أن الخادم يعرض هذه التغييرات.

## النسخة المرشحة / Candidate

- Repository: `C:/Users/Laven/Nour-Projects/nour-website`.
- Branch: `feat/website-ui-improvements`.
- Base commit: `09bcc735d4bfc43fa08dfe0c3dfbe4c2c4c07881`. The release commit includes the accumulated UI/organization changes and required new/deleted files; the base is not the new release identifier.
- Release SHA: use the full SHA of the commit containing this document (`git rev-parse HEAD`) and confirm it matches the remote branch after upload. A branch upload is not a production deployment. Private pre-upload backup: `C:/Users/Laven/AppData/Local/Temp/nour-pre-push-1793669687307`.
- Public target recorded by the existing runbook: https://nourappglobal.com. The currently running server SHA was not inspected in this documentation task.

## ما يشمله / Included behavior

Approved home layout and incremental blue/gold/Cairo styling; Arabic brand “نور آب”; shared navigation, cards and logo assets; responsive catalog filters, retry/error/empty states; independent transport/visa failures; program metadata and language query links; app-coming-soon messaging; privacy choices; server-only module boundaries and removal of proven-unused code.
أُبقيت الحسابات والإدارة ومصادر البيانات والتسعير الحالية. حُذفت الملفات غير المستخدمة المثبتة فقط؛ لم تُحذف صور محتوى قد تكون مرتبطة بإدارة المحتوى أو سجلات SQL. راجع [سجل التنظيم](website-organization.md).

Latest accepted fixes place the privacy action inside the program bottom bar at mobile/tablet sizes, improve flight-notice contrast, use a two-column tablet filter layout, and render “1 program” correctly. User approval of these fixes is recorded; a fresh rendered post-fix check is still distinct from that approval.

## أدلة التحقق وحدودها / Verification evidence

- Latest automated regression run after the final-audit fixes: **146/146 tests passed**, including six new regressions that failed before these fixes and passed afterward. Do not add historical run counts together.
- Full `npm run quality` passed after these fixes: TypeScript passed; ESLint reported 0 errors and 28 existing warnings. Warnings remain follow-up work.
- Webpack release-command check after the final-audit fixes on 2026-11-03: **passed** (`npm run build -- --webpack`, exit 0), including TypeScript and 43 static-page generation steps. This used isolated local fixture configuration, not production credentials; it does not verify the target Linux server or live data.
- Local AR/EN catalog and details returned HTTP 200; paused booking returned HTTP 503 with `website_booking_paused` in the latest functional checks.
- The user's external visual recheck covered 36 basic combinations: home/catalog/three-day details × AR/EN × light/dark × 390/768/1440. It confirmed previous fixes and found four remaining issues subsequently fixed locally.
- The later `NourApp-Final-Visual-Audit.html` (2026-11-03, supplied by the user) covered another 36 basic combinations and confirmed privacy placement, flight contrast, filters and counts. These are separate review rounds, not 72 distinct combinations. It found two remaining issues: price-card coming-soon contrast/alignment and Escape after a language switch with focus outside the privacy panel.
- Both issues are now fixed locally and covered by regression tests. **No rendered post-fix certification yet:** browser discovery returned `The browser access host is unavailable`. Recheck the price card at 768 in both languages/themes and Escape after switching language.
- Filled hotel/transport sections, physical devices, real prices/availability and authenticated admin upload/publication were not validated by the fixture review. No real reservation or payment was submitted.

## قائمة ما قبل الرفع / Before uploading

- [ ] Review `git status --short`, tracked diffs, deletions and every new file. Include required new server modules, styles, tests and brand assets in the same coherent release.
- [ ] Exclude private backups, credentials, `.env.local`, generated builds, dependency folders and logs; keep `.env.example` as the template. Inspect staged names and diffs before committing.
- [ ] Finish the focused visual recheck of the latest two fixes above and inspect populated hotel/transport layouts using authorized display data.
- [ ] Run `npm run quality`, `npm test` and `npm run build -- --webpack` on the exact reviewed candidate; preserve results and record any accepted warnings.
- [ ] Create and record the full release commit SHA, then push only the reviewed branch when the upload step is authorized. Local work is not backed up remotely until that succeeds.

## قائمة ما قبل النشر / Before cutover

- [ ] Confirm the server's active service path and commit read-only. Preserve the old release and a private copy of its service definition/environment; do not print secrets.
- [ ] Verify the candidate's build environment: `NEXT_PUBLIC_SITE_URL=https://nourappglobal.com`, booking `false`, UI preview `false`, app links ready `false`. Use only the existing authorized production environment on the server; never copy it to local fixtures.
- [ ] Review live published content, images, contact details and claims; local fixtures are not a production-content audit. Validate authenticated admin access without changing data unless separately authorized.
- [ ] Prepare a fresh isolated release and follow [Hostinger](hostinger-vps.md). The existing `ops/deploy-hostinger.sh` performs cutover and must not be run as a read-only check. It checks tracked cleanliness but does not prove all untracked files were reviewed. It forces booking off but does not explicitly set the preview/app-link flags: verify those separately.
- [ ] Validate the candidate at loopback 3101 before switching 3100. After cutover check public HTTPS, redirects, an actual new JS asset, AR/EN program views, metadata/canonical and paused API response. Confirm `/ui-preview` is unavailable and no fixture banner appears.
- [ ] Record deployed SHA, directory, timestamp, backup path and post-deployment results. Roll back the service to the preserved release on failure; this release has no database migration to roll back.

الحجز يبقى مغلقًا؛ تفعيل الحجوزات أو روابط التطبيق أو تغيير بيانات الإنتاج ليس جزءًا من هذا الإصدار. مراجعة هذه القائمة لا تُفعّل أي منها.
Booking activation, mobile-app publication, data migration and Laravel integration are outside this release.
