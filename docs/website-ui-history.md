# سجل تطوير الواجهة / UI implementation history

Archived from README on 2026-11-03. Entries describe their own point in time, not the final release state. Test counts are historical runs, not additive. Later changes supersede earlier restoration, browser-availability and visual-approval statements.

هذا سجل تاريخي محفوظ؛ الحالة الحالية ومتطلبات النشر موثقة في [تجهيز الإصدار](release-readiness.md). لا تمثل أرقام الاختبارات أو نتائج النشر القديمة تحققًا للإصدار الحالي.

## Home restoration — local only / استعادة الرئيسية محليًا

أُلغي إعادة تصميم الرئيسية في الدفعة الثانية بطلب المستخدم. عادت الرئيسية و`Hero.tsx` و`ProgramsPreview.tsx` إلى محتوى `master` عند `09bcc73` حرفيًا (مكوّن الرئيسية محفوظ الآن في `app/HomeClient.tsx` لفصل بيانات العنوان عن العرض): الترتيب والصور ومكونات العرض الأصلية. بقيت إصلاحات الدفعة الأولى لقائمة البرامج وتفاصيلها واللغة، وبقي إصلاح تمرير لغة البحث. لا تستورد الرئيسية تنسيقات البرامج ولا تستخدم `programs-shell`؛ تنسيقات البرامج محصورة بهذا الغلاف.

The batch-two home redesign has been selectively reverted, not the branch or batch-one fixes. Original sections, image references and their order are restored from `09bcc73`. Existing CMS content remains unchanged. The only intentional home content change is the unreleased-app notice in the original CTA section: “التطبيق قريبًا” / “App coming soon”. No booking, launch, store-download or QR action is offered. Program details, the mobile status strip and `/get-app` / `/open-app` use the same honest availability state. The previously prepared app-link helpers are inactive UI scaffolding, not a released integration. The isolated Flutter branch is unchanged by this restoration.

لم يُنفّذ رفع أو نشر أو تراجع على خادم. حجز الويب يبقى مغلقًا ويعيد `503 website_booking_paused`. لا تغيير في Laravel أو التسعير أو الحسابات.

### Isolated display preview / معاينة البيانات الثابتة

Run `node scripts/ui-preview.mjs` from this repository. It starts Next.js on `http://127.0.0.1:3201` and a read-only fixture service on loopback port 54322. It overrides configuration for the child process only; `.env.local` is not copied or changed. No new packages are needed. Stop with Ctrl+C in the launching terminal.

افتح `http://127.0.0.1:3201/ui-preview` لاختيار 390 أو 768 أو 1440 بكسل والعربية أو الإنجليزية. الصفحات: الرئيسية المستعادة، تصميم الدفعة الثانية قبل الاستعادة، قائمة البرامج، تفاصيل `demo-umrah-3`، برنامج غير موجود، وخيارات التطبيق. اختر نجاحًا أو تحميلًا بطيئًا أو خطأ أو فراغًا أو تعطل النقل والتأشيرات. تغيير الحالة مشترك بين نوافذ هذه المعاينة؛ ارجع إلى Success بعد الفحص.

The fixture server never proxies to production. It only serves fixed synthetic rows and the existing local Haram photo; mutations, authentication and booking RPCs are rejected. The preview controls and fixture program names distinguish example prices/dates from commercial offers. Real store links are not invented for the preview. The external verification iframe is omitted in preview only.

`NEXT_PUBLIC_UI_PREVIEW=true` is development-only; production builds reject it. Preview outputs use `.next-ui-preview`, isolated from the regular `.next` cache. Same-origin framing is enabled only in this loopback preview so the review page can show exact widths. Normal output keeps `X-Frame-Options: DENY`; `/ui-preview` returns 404 outside preview mode.

Manual review: inspect real image crops, RTL/LTR, 200% zoom, Tab focus, mobile menu, active filters/reset, error/retry, empty results and secondary errors. No horizontal page overflow should occur; the review canvas itself can scroll to show a 1440px frame. Confirm the coming-soon notice has no launch/download actions and website booking stays paused. Automated DOM tests do not approve appearance or prove mobile OS association.

### Before/after comparison / مقارنة قبل وبعد

- After: `http://127.0.0.1:3201/?lang=ar` (or `en`).
- Before: `http://127.0.0.1:3201/ui-preview/before?lang=ar` (or `en`). This retains only the rejected batch-two layout for comparison. Shared app actions now show the coming-soon status here too; the exact pre-restoration source is in the ZIP backup.
- Compare at 390, 768 and 1440 from `/ui-preview`. The before route is inaccessible outside explicit development preview. Its CSS is not imported by the restored home.
- The browser tool reported “Local browser use is disabled in Work settings”; no visual approval or screenshot comparison is claimed. HTTP/source/DOM checks are separate from visual checks.
- Full working-source backup before restoration: `C:\Users\Laven\.codex\visualizations\2026\10\29\01a18a17-484e-7bd3-86a2-ed5257fb02c5\nour-ui-review\before-home-restore-20261101-010941.zip`. Includes 46 modified/untracked source files, binary Git diff and manifest. Private environment files and generated dependencies were not changed or copied. Recover individual files from `website/` into a separate directory first; do not overwrite later work wholesale.

### Read-only deployment evidence / دليل النشر للقراءة فقط

Checked on 2026-11-01 (Asia/Riyadh): public `https://nourappglobal.com/` returned 200 with the original `nr-premium-hero`, no `nour-home-batch`; `/get-app` returned 404. Both responses exposed Next build ID `Y-sJewhyuJehSoZxFYvk1`. `git ls-remote` reported remote master at `09bcc735d4bfc43fa08dfe0c3dfbe4c2c4c07881` and no remote `feat/website-ui-improvements` branch. Current UI changes remain uncommitted locally. This supports that the batch-two design is not currently served at the checked public URL; it does not identify the live Git SHA or rule out unrelated historical/manual deployments. No server console/SSH access was used and no deployment or server rollback was performed. The older Hostinger runbook records an initial release at `9ed4386`; that historical record is not a current-version assertion.

Validation after restoration: 68 automated tests passed; TypeScript check and production build passed; lint reported 0 errors and 28 existing warnings. Both local ports returned 503 with website_booking_paused. The original-home composition was compared byte-for-byte after line-ending normalization against 09bcc73. No rendered visual approval is implied.


## Program browsing usability — 2026-11-02 / تحسين استخدام البرامج

هذه دفعة محدودة لقائمة البرامج وتفاصيلها، مع الحفاظ على الرئيسية المستعادة. زر إزالة المدينة يحذف فلتر المدينة وحده ويحتفظ بالدولة والمدة والطيران واللغة. يمكن إغلاق الفلاتر بـ Escape والعودة إلى زرها بلوحة المفاتيح. عند عدم وجود نتائج مطابقة يوجد إجراء واضح لمسح الفلاتر. لا تغيير في مصادر البيانات أو قواعد التسعير أو الحسابات.

Price explanations now use visitor-facing language and explicitly retain unknown price basis/tax status. Details expose the paused-booking notice near the top and direct navigation to published departures and additional information. Section tracking handles asynchronously loaded/replaced content. Empty inclusion/exclusion columns state what has not been published; they never imply all services are included. Unsupported freshness promises were replaced with neutral published-content wording. All CSS refinements remain scoped to `.programs-shell`; home images, composition and styles are unchanged.

Files: `app/programs/ProgramCatalogClient.tsx`, `ProgramPriceNote.tsx`, `[slug]/ProgramDetailsClient.tsx`, `ProgramDetailsExperience.tsx`, `ProgramStructuredContent.tsx`, `ProgramDepartures.tsx`, `layout.tsx`, `programs-ui.css`; regression coverage in `tests/program-ui.test.mjs`.

Local review: `http://127.0.0.1:3201/ui-preview` has synthetic display data, 390/768/1440 widths and AR/EN. Check city-filter removal, Escape/focus, no-match reset, long headings, section wrapping and the mobile information strip. Check success, loading, error, empty results and secondary-service failure. Browser access remains disabled in Work settings, so automated DOM/HTTP checks do not establish visual approval. No screenshots were captured.

Source backup before this batch: `C:\Users\Laven\.codex\visualizations\2026\10\29\01a18a17-484e-7bd3-86a2-ed5257fb02c5\nour-ui-review\before-program-usability-20261102.zip`. Restore individual files from `website/` after reviewing later changes. No secrets were printed or copied. Web booking remains paused; no app release, Laravel integration, push, merge or deployment was performed.


## Remaining UI refinements — 2026-11-02 / استكمال تحسينات الواجهة

حُفظ ترتيب الرئيسية وصورها ومكوّن عرضها الأصلي؛ لا إعادة تصميم للأقسام. استُبدلت الأرقام المكتوبة مباشرة بلا مصدر في قسم الإحصاءات بأربع أولويات وصفية داخل البطاقات نفسها. أُزيلت وعود الدعم 24/7 والدفع المتاح من النصوص الثابتة، وأصبحت حالة الحجز والتطبيق واضحة بالعربية والإنجليزية. لم تُعدّل بيانات المحتوى المخزنة أو التراخيص أو قنوات التواصل أو الحسابات أو الأسعار.

The original page component is preserved byte-for-byte as `app/HomeClient.tsx` (from `09bcc73:app/page.tsx`). `app/page.tsx` now supplies language-specific title/description, query-based canonical/alternate links and a real existing branded share image. Existing configured SEO text is preserved. `app/metadata-settings.ts` deduplicates the layout/page public-settings read within the React server render; the underlying data source and settings service are unchanged.

Interaction changes: `SiteIntro.tsx` no longer locks body scrolling, can be skipped with its button/Escape/Tab and is omitted for reduced motion. `SiteEnhancements.tsx` respects reduced motion for reveal and back-to-top. `Header.tsx` remains visible while it contains keyboard focus. `app/accessibility.css` adds visible focus and reduced-motion rules without changing normal layout; it is imported by `app/layout.tsx`.

Content files: `app/components/home/HeroPhones.tsx`, `WhyNour.tsx`, `NourStatistics.tsx`, `app/data/home.ts`, and `app/components/layout/Header.tsx`. The stats background photo and card layout are retained; descriptive words replace unsupported figures. `Showcase.tsx` and `HeroPhones.tsx` use the existing Next image optimizer for local images only; remote configured images keep their existing behavior. `ArticlesPreview.tsx` and `CeoMessage.tsx` defer offscreen images. `why-nour/NourWorldMap.tsx` keeps its position and reserved height, mounting the map when it approaches the viewport. No image assets or packages were replaced.

Local image response measurements at width 384 and quality 75 (WebP): front-view.png 255606 → 14314 bytes; rotated-right.png 496806 → 21098 bytes; app-screens/home.png 531957 → 13448 bytes. These are local response sizes, not LCP/INP/CLS, full-page speed, visual quality approval or real-user performance. Larger/DPR-dependent variants have different sizes.

Manual acceptance still required: use `/ui-preview` at 390/768/1440, both languages, 200% zoom, keyboard focus, mobile menu, reduced-motion preference, intro skip, map entry and image crops/clarity. The browser tool again reports disabled local browser access; no visual approval or screenshot evidence is claimed. Real business assertions in CMS content still require owner confirmation; this batch changed only static UI wording and did not rewrite stored content.

The pre-change working-source backup is `C:\Users\Laven\.codex\visualizations\2026\10\29\01a18a17-484e-7bd3-86a2-ed5257fb02c5\nour-ui-review\before-remaining-ui-20261102.zip`; clean tracked files before this batch remain recoverable from the recorded Git HEAD. No publication, merge, upload or Laravel integration was performed. Web booking remains paused.

Final validation for this batch: 80 automated tests passed; TypeScript and build passed; lint: 0 errors, 28 existing warnings. Local AR/EN home metadata returned the correct titles/canonicals/share image; program pages and preview returned 200. Booking returned 503 website_booking_paused on ports 3200 and 3201. Browser/device appearance and real-user performance remain unverified.

## Map discovery — 2026-11-03 / تحسين استعراض البرامج من الخريطة

قائمة نقاط الانطلاق تسبق الخريطة، وتعرض عدد البرامج المرتبطة مرة واحدة لكل برنامج، لا عدد المواعيد. بقيت قواعد المصدر كما هي: المدن السعودية مرتبطة بالمواعيد التي تعيدها خدمة الرحلات الحالية (المفتوحة والمستقبلية ولها مقاعد ومهلة صالحة)، والدول مرتبطة ببرامجها المنشورة. القائمة ليست إحصاءً لكل برنامج محفوظ أو ضمانًا للتوافر. الحجز متوقف والتطبيق قريبًا؛ لا تعديل للأسعار أو الحسابات أو قاعدة البيانات ولا استئناف لربط Laravel.

On mobile (up to 760px), visitors choose an origin first and explicitly open/close the map. Desktop/tablet keeps lazy map mounting near the viewport. City/country filter and program-detail links preserve language. Missing coordinates do not remove an origin from the list or fabricate its map position. A render/chunk failure stays inside MapBoundary. Tile errors and slow tile requests offer retry; meeting-point errors have an independent retry. Program browsing remains available when the map fails.

العلامات العادية زرقاء والموقع المختار ومكة بالذهبي. تُجمع العلامات داخل خلايا شاشة 64 بكسل حتى مستوى تقريب 12، والرقم يمثل مواقع لا برامج. اختيار التجمع يقرّب الخريطة، وتبقى القائمة وسيلة الاختيار للمواقع المتطابقة. الموقع المختار ومكة لا يُدمجان في التجمعات. لا حركة تلقائية، وتبديل اللغة وتحديث البيانات لا يعيدان ضبط تكبير الزائر. المسار توضيحي وليس مسار قيادة أو تتبعًا مباشرًا. دعم Enter/Space للعلامات، وتركيز مرئي ومناطق لمس أكبر.

Files: app/components/home/why-nour/NourWorldMap.tsx, NourWorldMap.module.css, MapBoundary.tsx; src/components/maps/GeographicMap.tsx and marker-groups.ts; tests/program-ui.test.mjs; scripts/fixtures/public-data.mjs and scripts/ui-preview.mjs. Clustering is opt-in for the public map. Coordinate editing retains click/drag callbacks, covered by regression tests. No package added.

المعاينة: http://127.0.0.1:3201/?lang=ar#world-map ونسخة الإنجليزية بتغيير lang=en. بيانات العرض مختلقة ومعزولة: الرياض مرتبطة ببرنامج، الدرعية وجدة بلا برامج، ونقطة تجمع تجريبية. السيناريو secondary-error في /ui-preview يعطّل نقاط التجمع أيضًا دون تعطيل البرامج. لم تُعدّل بيانات فعلية.

Validation: 94 tests passed (11 added), TypeScript and production build passed; ESLint: 0 errors, 28 existing warnings. Coverage includes AR/EN selection, unique counts, language/filter links, missing coordinates, loading/error/empty states, meeting-point retry, mobile visibility at simulated widths 390/768/1440, grouping, tile/library retry, keyboard Space, preserved pan/zoom, render failure containment and coordinate editing. These are DOM/model checks, not visual or physical-device tests. Local home AR/EN, city-filtered catalog and /ui-preview returned 200. Booking returned 503 website_booking_paused. Fixture meeting points returned 503 under secondary-error while programs returned 200; preview reset to success.

الفحص البصري غير معتمد: أداة المتصفح أعادت Local browser use is disabled in Work settings. للفحص اليدوي استخدم /ui-preview بعروض 390 و768 و1440 باللغتين، اختر الرياض وافتح/أغلق الخريطة على الجوال، ثم جدة والدولي. افحص التركيز والتكبير وعدم القص أو التمرير الأفقي. عطّل طلبات tiles في أدوات المتصفح لاختبار إعادة المحاولة. لم تُلتقط صور ولم يحدث نشر أو رفع أو دمج.

Pre-change backup: C:/Users/Laven/.codex/visualizations/2026/10/29/01a18a17-484e-7bd3-86a2-ed5257fb02c5/nour-ui-review/before-map-discovery-20261103.zip. Restore individual files after reviewing later edits; previous work remains preserved. Test/lint/build logs are alongside the archive.

## Public navigation while booking is paused — 2026-11-03 / التنقل العام أثناء إيقاف الحجز

أُخفيت إجراءات تسجيل دخول العميل وحسابي من الترويسة وقائمة الجوال. البديل «استعرض برامج العمرة» مع حفظ اللغة في الرابط، وفي تفاصيل البرنامج «استفسر عن البرنامج» عبر رابط واتساب الذي يعيده إعداد التواصل المعتمد. عند غياب الرابط يرجع الزائر إلى قسم التواصل الموجود. لم تُحذف الحسابات أو البيانات، ولم تُغيّر صلاحيات أو مسارات دخول الإدارة والعملاء. شاشة الحجز المغلقة ما زالت لا تعرض بوابة الدخول.

PublicHeader no longer reads or subscribes to customer sessions solely for its public CTA. Header now accepts actionHref/actionLabel/actionExternal; external enquiries open with noopener noreferrer, and the mobile CTA closes the menu. Account and admin authentication services, cookies, middleware and direct routes remain unchanged. This UI choice is explicit, not an automatic booking-flag toggle; restoring the account CTA requires a deliberate later decision.

Files: app/components/layout/PublicHeader.tsx, Header.tsx, tests/program-ui.test.mjs. Validation: 99 tests passed (5 new for AR/EN desktop/mobile actions, language preservation, enquiry/contact fallback, menu close and absence of session reads); TypeScript and targeted ESLint passed. Local AR/EN home, program details and admin login returned HTTP 200. Booking still returned 503 website_booking_paused. Browser visual review remains unavailable; check both languages on mobile and desktop at http://127.0.0.1:3201. No account, database, backend, package or deployment change.


### Navigation refinement — 2026-11-03 / إزالة تكرار إجراء البرامج

أزيل زر استعراض البرامج الإضافي من الترويسة وقائمة الجوال في الصفحات العامة؛ بقي رابط البرامج ضمن التنقل وزر الاستعراض في بحث الرئيسية. يظهر إجراء «استفسر عن البرنامج» في تفاصيل البرنامج فقط. لا إعادة لزر الدخول ولا تغيير للحسابات أو الإدارة أو الحجز.

The public header CTA is now rendered only on program detail routes. General pages retain their existing navigation and page-level discovery actions. AR/EN tests assert the duplicate desktop/mobile CTA is absent and the detail enquiry remains functional.


## Why Nour section — 2026-11-03 / ترتيب قسم لماذا نور آب

أصبح العنوان «رحلة أوضح مع نور آب»، والبطاقات الأربع بالترتيب: تفاصيل واضحة، خيارات يسهل استعراضها، معلومات السعر، تواصل واستفسارات. حُذفت أرقام البطاقات والزخارف الركنية والحركة عند المرور وتحريك الإضاءة بالمؤشر. الأيقونات زرقاء موحّدة والذهبي باقٍ في شارة القسم، مع نص 16 بكسل وتباين أعلى في المظهرين الفاتح والداكن. شبكة عمودين تتحول لعمود واحد عند 700 بكسل؛ ارتفاع المحتوى مرن بلا قص للنص.

WhyNour.tsx now uses a scoped WhyNour.module.css to avoid legacy global card/heading rules. The section keeps its original position, anchor and blue/gold background treatment. Content describes current browsing, filtering, published pricing information and enquiries; no payment availability, ratings or new service claims. Cards render immediately without decorative motion or hover behavior that suggests they are clickable. Existing trust-copy coverage now checks the starting-price wording instead of the removed payment card. No data, booking, authentication, other home sections or package changes.

Validation: 99 tests, TypeScript, targeted ESLint and local production build passed. AR/EN preview pages returned HTTP 200. Visual approval remains pending because browser access is disabled. Review http://127.0.0.1:3201/?lang=ar#why-nour in both languages and themes at mobile and desktop widths. No deployment performed.

## App preview rotation — 2026-11-03 / العرض التلقائي لشاشات التطبيق

تتبدل الصور داخل إطار الهاتف الثابت بانتقال تلاشي وانزلاق خفيف مدته 380 مللي ثانية، يبدأ بعد اكتمال الصورة. شاشة welcome تبقى 3 ثوانٍ وبقية الشاشات 5 ثوانٍ. يحترم العرض ترتيب الشاشات الظاهرة الذي يحدده إعداد الموقع ولا يغير البيانات أو الصور. يوجد زر تشغيل/إيقاف ومؤشر تقدم أسفل التبويب المحدد، مع تحميل مسبق للصورة التالية فقط عند ظهور الهاتف والصفحة.

Rotation starts only while at least 25% of the phone is visible, the document is visible, the current image has loaded, and two or more screens exist. Leaving the viewport or hiding the browser tab clears the timer; returning restarts the full reading interval. Manual tab/feature selection, pointer interaction/swipe and keyboard focus pause persistently until explicit Play. The playback control is exempt from capture handlers so focus/pointerdown cannot reverse its intended action. Reduced-motion preference disables automatic rotation and transitions, responds to preference changes, and explains manual mode. Without IntersectionObserver or matchMedia the safe fallback is manual navigation.

تظل أزرار الشاشات والسحب ومفاتيح الأسهم وHome/End متاحة. يفشل تحميل الصورة برسالة واضحة دون انتقال تلقائي؛ يمكن اختيار شاشة أخرى. لا تنقل تلقائي عند وجود شاشة واحدة أو عند إخفاء القسم. لا إعلانات متكررة لقارئ الشاشة أثناء العرض التلقائي. التنبيه الدائم بالعربية والإنجليزية: معاينة لتجربة التطبيق، التطبيق قريبًا، والحجز عبر الموقع متوقف. لا فتح للتطبيق أو تفعيل لحجز أو دفع.

Files: app/components/home/Showcase.tsx, Presentation.module.css (showcase-scoped additions), tests/showcase-interaction.test.mjs. No packages or stored content changed. Pre-edit working files: C:/Users/Laven/AppData/Local/Temp/nour-showcase-rotation-1793656228499.

Validation: 105 full-suite tests passed; 7 showcase interaction tests passed again after the final transition/live-region adjustment. TypeScript, targeted ESLint and production build passed. Controlled-clock tests cover AR/EN 3/5-second timing, image readiness/failure, viewport/document visibility, loop wrap, Play/Pause/focus, swipe, reduced motion, hidden/removed screens and timer cleanup. Local AR/EN pages returned 200; booking returned 503 website_booking_paused. These are automated DOM/timer and HTTP checks; rendered appearance/device behavior remains unverified because local browser control is disabled. Review http://127.0.0.1:3201/?lang=ar#showcase (or lang=en), including reduced motion and mobile swipe. No publication, upload or merge.

### توحيد بطاقات الأقسام / Consistent section cards

- اعتمدت بطاقات الخدمات وخطوات الرحلة تنسيق «لماذا نور»: أيقونة زرقاء بجانب المحتوى، حدود هادئة، مسافات ثابتة وشبكة من عمودين تتحول إلى عمود على الجوال. أرقام الخطوات والنصوص والروابط محفوظة؛ أزيلت حركات رفع البطاقات والزخارف الزائدة.
- تستخدم الأقسام المعلوماتية HomeCards.module.css، وتستخدم بطاقات البرامج والمقالات MediaCards.module.css لتوحيد الحواف والمسافات والخطوط وأغلفة 16:9، دون تغيير البيانات أو السعر أو الفلاتر. بقيت الشعارات والروابط الرسمية وخلفية التوثيق الداكنة.
- Services and journey steps share the accepted Why Nour card system: blue icons beside content, subtle borders, consistent spacing and a two-column grid that stacks on mobile. Step numbers, copy and links remain; decorative card lift animations are removed.
- HomeCards.module.css defines informational cards. MediaCards.module.css scopes image card styling to public programs and articles, preserving data, filters and pricing. Official footer logos, links and dark background remain. Website booking stays disabled.
- المعاينة المحلية تستخدم بيانات عرض فقط. يلزم اعتماد بصري للعربية والإنجليزية والوضعين الفاتح والداكن عند 390 و768 و1440 بكسل.
- Local preview uses display fixtures only. Visual approval remains pending in Arabic/English, light/dark themes at 390, 768 and 1440px.


### شعار نور بصيغة SVG / Nour SVG brand assets
- ملفات public/images/brand شفافة ومكوّنة من مسارات متجهية، دون صور نقطية مضمّنة أو اعتماد على خطوط الجهاز. حُوّلت الكتابة من الصورة المقدمة وأعيد رسم الرمز هندسيًا؛ علامة ® أضيفت وفق طلب صاحب الموقع.
- الشعار الأفقي في الترويسة والتذييل، والرمز وحده على الجوال وأيقونة الموقع، والنسخة العمودية في شاشة الترحيب وصفحة التطبيق. النسخة ذات الكتابة البيضاء مخصصة للخلفيات الداكنة. الشعارات السابقة محفوظة دون حذف.
- Transparent path-based SVGs preserve the supplied lettering, with a geometrically redrawn symbol and the requested ® mark. No embedded raster images or font dependencies. Horizontal assets serve the header/footer; mobile uses the symbol. Stacked assets serve intro/app pages. Light lettering is provided for dark surfaces. Original logo files remain available.


### الترحيب المختصر / Brief welcome
- خلفية كحلية وشعار SVG بكتابة بيضاء، وعبارة «رفيقك لرحلة السعادة» دون شبكة أو خط أو دوران وانتقال للشعار نحو الترويسة.
- تظهر المقدمة مرة واحدة لكل جلسة تبويب على الرئيسية، لمدة تقارب ثانية تشمل التلاشي. يمكن تخطيها بالزر أو Escape أو Tab. تفضيل تقليل الحركة يتخطاها، ولا يُقفل تمرير الصفحة.
- Navy background, white-lettered SVG and a short tagline. The homepage welcome appears once per tab session, for about one second including its fade. Skip button, Escape and Tab dismiss it. Reduced-motion users bypass it; page scrolling is never locked.
- Session storage contains only the welcome-seen flag. If storage is blocked, a memory fallback prevents repeat playback during client navigation; a full reload may show it again. No booking, account or data-source behavior changes.
- مخزن الجلسة يحفظ علامة العرض فقط. عند حظره تُستخدم الذاكرة أثناء التنقل؛ وقد تظهر المقدمة مجددًا بعد إعادة تحميل كاملة. لا تغييرات في الحجز أو الحسابات أو مصادر البيانات.


### وضوح شعارات الجهات الرسمية / Official issuer logo clarity
- عُزلت صور جهات التوثيق عن قاعدة التذييل القديمة التي تصغّر الصور إلى 94 بكسل وتضيف حشوة. أبعاد الملفات الأصلية صحيحة، ومساحة العرض متجاوبة وروابط التحقق محفوظة.
- شعارا السياحة والزكاة شفافان أصلًا. تُقص هوامش التجارة والسياحة بصريًا داخل نافذة CSS محددة دون تعديل الملفات أو ألوانها أو كتاباتها، مع هامش أمان حول الرسم. يُحتفظ بمساحة بيضاء هادئة لأن النص الرسمي داكن.
- Issuer logos now override legacy footer image sizing/padding. Commerce and tourism blank margins are clipped in dedicated CSS viewports without altering original assets, colors, lettering or verification links. ZATCA remains an original transparent vector asset; tourism already has transparency. A light surface keeps official dark lettering readable. External business-verification seals are unchanged.


### فصل الاشتراك عن قسم التطبيق / Newsletter layout isolation
- أزيل التذييل من حركة إظهار الأقسام، وأصبح تدفقه ثابتًا. تخطيط الاشتراك ونموذجه يستخدمان CSS Modules بدل القواعد العامة القديمة: ارتفاع تلقائي، مسافات واضحة، خط مقروء وحقول متجاوبة دون قصّ.
- Footer reveal motion is removed. Scoped newsletter styles replace legacy compressed rules. Layout uses content-driven height, readable labels/consent, two columns on desktop and a stacked layout on smaller screens. Subscription fields, consent requirements, submission service and content are unchanged. No live subscription was submitted.


### خلفية البداية المستوحاة من الشعار / Brand-inspired hero background
- استُبدلت صورة الخلفية الزخرفية الكبيرة بتدرّج أزرق وكحلي ثابت، ونقشة SVG خافتة مشتقة من خطوط الجزء العلوي للشعار، في جهة صور الجوال بعيدًا عن النص والبحث. تنتقل الإضاءة إلى جهة الصور عند تبديل اللغة، وتُخفف النقشة على الشاشات الصغيرة.
- HeroBackground.module.css scopes the new static blue/navy background to the phone hero. The lightweight SVG motif uses the upper symbol geometry at 7% opacity (5% on smaller containers). Text/search stay on the quiet side; illumination follows the visual column in RTL/LTR. Phone images, section order, content, search and booking logic remain unchanged. The old background image remains on disk for recovery.


### إضاءة خطوط النقشة / Hero line shimmer
- لمعة زرقاء ولمسة ذهبية تتكرران بسلاسة في دورة من 3 ثوانٍ دون فترة انتظار، على الكمبيوتر والجوال. إضاءة الجوال أخف، وتستمر طوال ظهور القسم.
- تتوقف الحركة خارج الشاشة أو عند إخفاء التبويب وتستأنف من موضعها. تفضيل تقليل الحركة يبقي النقشة ثابتة.
- Blue and gold strokes loop seamlessly every three seconds with no idle phase, including on mobile (at lower opacity). A normalized dash period keeps cycle boundaries continuous. Viewport/page visibility still pause and resume the timeline; reduced motion disables animation. No changes to content, layout, search or booking.


### نقشة قسم التطبيق / App section ornament
- نقشة هندسية متجهية مستوحاة من المرجع على طرف قسم «التطبيق قريبًا» فقط، نصفها خارج الحافة. الخطوط البيضاء والذهبي خافتان، والدوران دورة كل 75 ثانية دون تكبير أو نبض.
- A faint geometric SVG ornament sits half outside the app-coming-soon section, rotating once every 75 seconds. A clipped edge window keeps it away from copy; on small containers it stays within the bottom padding. Viewport and tab visibility pause the animation. Reduced motion renders a static ornament. Text, unavailable app status, booking and footer flow are unchanged.


- تنقيح قسم التطبيق: رفع ظهور الذهبي إلى 20%، وتصغير قطر النقشة إلى 340 بكسل (180 على الجوال)، وإزالة شارة الحالة المكررة مع الاحتفاظ بعنوان ووصف «التطبيق قريبًا» والدوران كل 75 ثانية.
- App section refinement: gold opacity is 20%; ornament diameter is 340px (180px on mobile). The duplicate coming-soon badge is removed; title, explanation and 75-second rotation remain.


### توحيد اسم العلامة العربية / Arabic brand name consistency
- اسم العلامة في النصوص العربية هو «نور آب»: التنقل، عرض التطبيق، الشراكات والتوظيف والمقالات وعناوين الإدارة ووصف الصور والعناوين الوصفية المحلية. أسماء الأماكن المستقلة مثل «فندق نور مكة» لا تتغير.
- Arabic website brand copy now uses «نور آب», without duplicating the suffix. Home-presentation Arabic display text also normalizes the old short brand name; the footer maps a legacy exact platform name to the full name. Stored content, customer data, URLs, identifiers and English copy are unchanged. No database writes or deployment.


### خلفية قسم الأولويات / Focus section background
خلفية ثابتة بصورة الحرم الحالية، مع تدرّج هادئ خلف العنوان وبطاقات شبه مصمتة وحدود زرقاء خفيفة. أُزيل التوهج والنبضات والزخرفة داخل البطاقات؛ تُخفّف زخارف أطراف الصورة الأصلية بقناع دون تعديل الأصل. على الجوال تظهر الصورة أسفل القسم فقط. المحتوى وترتيبه محفوظان، مع دعم الوضع الداكن.
The focus section uses the existing Haram image with a static neutral fade and nearly opaque cards. Extra glow/pulses and card ornaments are removed; a mask softens ornaments baked into the image edges without modifying the source asset. Mobile imagery stays at the bottom. Content/order and dark-theme support are preserved.


### خيارات الخصوصية / Privacy choices
- نافذة عربية/إنجليزية غير حاجبة للتصفح: قبول الكل، رفض الاختياري، وتخصيص التحليلات، مع إعادة الفتح من التذييل أو زر الخصوصية. لا يُعد الاستمرار في التصفح موافقة.
- الزيارات وتفاعلات الخريطة متوقفة افتراضيًا؛ يُفحص الإذن داخل نقطتي التسجيل أيضًا قبل إنشاء العميل أو المعرّف أو إرسال/تخزين الأحداث. لا تُعاد أحداث سابقة للموافقة. صفحات الإدارة والحساب مستثناة من تحليلات الزوار.
- الاختيار المحلي تحت مفتاح nour:privacy:v1 لمدة 180 يومًا وبإصدار واضح. عند الفساد أو انتهاء المدة يُطلب اختيار جديد. عند تعذر التخزين، يُحفظ الاختيار في ذاكرة الصفحة ويظهر تنبيه.
- سحب الإذن يمسح فقط nourapp_visitor_session_key وnour:map-events ويمنع التسجيل اللاحق؛ لا يمحو بيانات الخادم أو يسترجع طلبًا أُرسل بالفعل. يتزامن عبر التبويبات وتُفحص الصلاحية عند كل حدث.
- جلسات الدخول، اختيارات اللغة/المظهر التي يحددها المستخدم، وظهور شاشة الترحيب تبقى وظيفية. لا تتغير حسابات الإدارة أو مصدر البرامج أو حالة توقف الحجوزات.
- هذا التحكم يغطي تحليلات الموقع المعروفة، ولا يمثل إدارة شاملة لملفات طرف ثالث داخل ختم التوثيق الرسمي أو مزود الخرائط، ولا يحذف بيانات تاريخية. لا تُحمّل حزمة تحليلات أو إعلانات جديدة. نص سياسة الخصوصية المنشور في إدارة المحتوى لم يُعدّل.
- An Arabic/English non-modal panel provides equally visible accept/reject options and analytics customization. Reopen from the footer or persistent privacy button. Browsing alone is not consent.
- Page visits and map events are denied by default at both tracker and service boundaries. No pre-consent replay; no analytics on admin/account routes. Acceptance records the current public page.
- Versioned browser choice lasts 180 days. Invalid/expired choices fail closed; blocked storage falls back to page memory with an explicit notice. Cross-tab changes and expiry are observed.
- Withdrawal removes only the site's visitor identifier and local map-event history, blocking subsequent recording. Previously sent requests/server records are not deleted. Authentication and explicitly selected functional preferences remain unchanged.
- Scope: existing first-party analytics and conditional map-event forwarding only; official verification embeds/map providers are not a universal third-party-cookie blocking system. No new analytics SDK, database migration, deployment, or published CMS policy update.
- Manual review: test first visit, accept, reject, reopen, customize, keyboard navigation, Arabic/English, dark/light, and 390/768/1440 widths. Browser-based visual approval remains pending while browser access is disabled.


### شعارات وسائل الدفع / Payment brand cards
أُعيد عرض أصول الشعارات الشفافة الموجودة دون تعديل ملفاتها أو ألوانها: تأطير الفراغ الداخلي في CSS وتوحيد الحجم البصري وإزالة الصناديق البيضاء الزائدة. تبقى خلفية صغيرة لمدى لحماية تباين الكتابة، وخلفيات العلامات الأصلية مثل Apple Pay محفوظة. البطاقات عمودان على الكمبيوتر وعمود على الجوال؛ حُذف الوصف المكرر وشارات الدفع المرن، ووُضعت شروطه مرة واحدة تحت المجموعة. يبقى تنبيه توقف الحجز والدفع واضحًا، ولا تُعد الشعارات تأكيدًا لتفعيل الوسائل.
Existing transparent payment assets are framed in CSS without altering source files, colors or proportions. Excess white boxes and repeated card captions are removed. Mada keeps a compact light backing for legibility; intrinsic provider badge backgrounds (including Apple Pay) remain intact. Cards use two columns on desktop and one on mobile, with installment terms once beneath the group. Website booking/payment remain paused; informational logos do not assert enabled payment integrations.


### التنظيم الأولي وفصل الخادم / First organization pass
حُفظت نسخة كاملة محلية قبل التنظيم. أزيلت 8 ملفات شيفرة فارغة و4 مداخل/أغلفة قديمة غير مستخدمة و5 صور من قالب Next.js، دون حذف صور المحتوى أو ملفات المقارنة أو تاريخ قاعدة البيانات.
نُقلت 5 وحدات خادم إلى src/server مع server-only وتحديث المراجع، وفُصلت أنواع الحجز المشتركة في src/features/bookings/types/booking.ts. بقيت واجهات المتصفح وأسماء الدوال ومسارات API والتحقق من الصلاحيات دون تغيير. بقاء الحجز مغلقًا لا يُعد سببًا لحذف ملفاته.
The first cleanup removes only confirmed empty/legacy files and unused starter images. Server modules now live under src/server with explicit server-only boundaries. Shared booking contracts remain browser-safe. Production content assets, comparison fixtures, migrations, authentication behavior and the paused booking gate are preserved. Historical documentation may mention the former server paths; see src/server/README.md for current locations.

تنظيم قسم الدفع: نُقلت كتلة التنسيق المضمّنة إلى Payments.module.css مع حصرها داخل القسم عبر :where دون زيادة أولوية محدداتها أو تغيير قيمها. Payment styles are now scoped in the existing CSS Module; declaration values and relative specificity are preserved.

### Visual audit corrections / إصلاحات الفحص البصري

- The program information bar shares its measured height with the privacy controls. Clearance adapts to wrapping, language and viewport changes, resets on desktop and is removed on navigation. The panel remains scrollable within the remaining viewport.
- يقيس شريط البرنامج ارتفاعه الفعلي لوضع إعدادات الخصوصية فوقه، مع مراعاة التفاف النص وتغيير اللغة والحجم وإزالة المسافة عند مغادرة الصفحة.
- Structured program details pair dark surfaces with readable titles, descriptions and inclusion/exclusion labels, scoped to program pages. No pricing, data-source or booking behavior changed.
- ضُبطت خلفيات وألوان تفاصيل الرحلة ونقاط التجمع والمشمول وغير المشمول للوضع الداكن ضمن صفحات البرامج فقط.
- Automated tests do not replace visual rechecking at 390/768/1440 in both languages/themes. Next.js development indicators are local tools, not production UI.
- لا تغني الاختبارات الآلية عن إعادة الفحص البصري بالأحجام الثلاثة واللغتين والوضعين. مؤشر Next.js خاص ببيئة التطوير.

### استكمال التنظيم / Organization follow-up

See [website organization](../docs/website-organization.md) for the current structure, removed legacy files, protected assets and recovery notes.
راجع توثيق تنظيم الموقع لمعرفة بنية الملفات الحالية والمكونات القديمة المحذوفة والصور المحفوظة وطريقة الاستعادة.
