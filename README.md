# نور آب / NourApp website

موقع نور آب بالعربية والإنجليزية، مع إدارة المحتوى داخل Next.js. مصدر البيانات والمصادقة الحالي Supabase؛ خطة الربط بـLaravel ملغاة. الحجز عبر الموقع مغلق، والتطبيق يُعرض بعبارة «التطبيق قريبًا».
Arabic/English public website and content administration using Next.js and Supabase. Laravel integration is cancelled. Website bookings remain paused; public app actions show “App coming soon”.

## ابدأ هنا / Start here

- [تجهيز الإصدار ونتائج التحقق / Release readiness](docs/release-readiness.md)
- [تشغيل ونشر Hostinger / Deployment runbook](docs/hostinger-vps.md)
- [إدارة عرض الرئيسية / Managed homepage](docs/managed-home-presentation.md)
- [تنظيم الملفات وحدود الخادم / Code organization](docs/website-organization.md)
- [دليل قاعدة البيانات / Database documentation](docs/Database.md)
- [سجل الواجهة التاريخي / UI history](docs/website-ui-history.md)

## التشغيل المحلي / Local development

Node.js >=24.15.0 and <25 is required. Install locked dependencies with `npm ci`. Copy `.env.example` to a private `.env.local` only if it does not exist, then supply authorized development values. Never copy production secrets into local testing or commit environment files.

ابدأ بـ`npm run dev`. لا تستبدل إعدادات محلية موجودة. فحوص المشروع: `npm run quality`، `npm test`، `npm run build -- --webpack`. يتبع التشغيل بعد البناء `npm run start`؛ المنفذ الافتراضي 3000 ما لم يُحدد غيره.

For an isolated display preview, run `node scripts/ui-preview.mjs`, then open http://127.0.0.1:3201. The fixture API uses loopback port 54322. The review controls at `/ui-preview` expose sample success/loading/error/empty/secondary-service scenarios. Fixtures are not real offers, prices or availability. Preview mode requires development and is rejected in production; its build output is separate (`.next-ui-preview`).

المعاينة الثابتة لا تثبت اتصال البيانات الحقيقية أو نجاح الدفع. صفحة `/ui-preview` غير متاحة في التشغيل العادي، ولا تُفعّل في الإنتاج.

## حدود الإصدار / Release constraints

- `NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED=false` at build and runtime. The paused API returns HTTP 503 with code `website_booking_paused` before authentication or database work. Public flags require a rebuild when changed.
- `NEXT_PUBLIC_UI_PREVIEW=false` and `NEXT_PUBLIC_NOUR_APP_LINKS_READY=false` for this release. No app-store or deep-link readiness claim.
- Existing account/admin routes and authorization remain; hiding public login navigation does not delete those routes.
- No pricing, backend integration, database migration or content transfer is part of this UI release.
- Keep content images whose URLs may be stored in the CMS. A missing source-code reference alone does not prove an image is unused.

## الرفع والنشر / Upload and deployment

العمل المحلي على `feat/website-ui-improvements`. لا يمثل HEAD القديم نسخة الواجهة المعدلة غير المسجلة بعد. راجع الملفات الجديدة والمحذوفة ثم أنشئ commit للإصدار قبل رفعه؛ لا تنشر 09bcc73 بوصفه النسخة الجديدة.
Deployment is manual and targets a reviewed full commit SHA in an isolated server release directory. A Git push or merge does not itself establish that Hostinger is serving that commit. Follow the readiness checklist and runbook; do not build in the running release directory.
