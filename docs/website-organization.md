# تنظيم الموقع / Website organization

## نطاق التنفيذ / Scope

تنظيم محلي على feat/website-ui-improvements. لا تغيير للتصميم أو الأقسام الحالية أو الحسابات أو التسعير. الحجز مغلق، وربط Laravel ملغى. لم تُشغّل ترحيلات أو أوامر لكتابة البيانات، ولم يحدث نشر.
Local maintenance preserves the active UI, pricing, authentication and paused booking behavior. Laravel integration remains cancelled. No database writes, migration execution, package changes or deployment.

## بنية الشيفرة / Code layout

- app: Next.js routes, layouts and public UI. app/api remains the HTTP entry layer with existing authorization checks.
- src/server: server-only implementation modules. See ../src/server/README.md; shared booking DTOs stay under src/features/bookings/types.
- src/features: feature services, contracts and active admin screens; browser-safe clients stay under src/lib/supabase.
- app/programs/ProgramCatalog.styles.ts and app/programs/[slug]/ProgramDetails.styles.ts: static styles extracted through the existing styled-jsx/css API. Exact selectors/declarations and component mount order remain unchanged. No new style registry or dependency was added.
- فُصلت كتل التنسيق عن قائمة البرامج وتفاصيل البرنامج مع إبقاء أسماء المحددات وقيمها وترتيب تطبيقها كما كانت. بقيت قواعد سهولة الاستخدام وتصحيح التباين في programs-ui.css.

## الملفات القديمة المحذوفة / Removed legacy files

فُحصت مداخل الصفحات والاختبارات والسكربتات والاستيرادات المباشرة والديناميكية ذات المسار الثابت. المجموعة التالية غير متصلة بها؛ مراجعها الداخلية أزيلت كمجموعة. احتُفظ بأداة navigation.ts لأنها مستخدمة في اختبار، وبالمكونات الفعلية المشابهة داخل src/core وsrc/components/ui.
A current TypeScript dependency graph and repository reference search found no live route/test/script import path to this closed group. The navigation helper remains because regression tests use it. Active toast, dialog, admin layout and UI components are retained.

- src/components/ui/toast/ToastProvider.tsx
- src/features/countries/dialogs/CountryDialog.tsx
- src/components/ui/dialogs/ConfirmDialog.tsx
- src/components/ui/Card.tsx
- src/features/countries/services/countries.mock.ts
- src/features/visas/index.ts
- src/components/admin/layout/AdminShell.tsx
- src/features/programs/index.ts
- src/features/hotels/index.ts
- src/features/transports/index.ts
- src/features/media/hooks/index.ts
- src/features/media/hooks/useDeleteMedia.ts
- src/features/media/hooks/useUploadMedia.ts
- app/data/testimonials.ts
- app/data/programs.ts
- app/components/home/About.tsx
- app/components/home/Goals.tsx
- app/components/home/Features.tsx
- app/components/shared/AppStoreBadge.tsx
- app/components/shared/FeatureIcon.tsx
- app/components/home/TrustMetrics.tsx
- app/components/home/testimonials/Testimonials.tsx
- app/components/home/testimonials/TestimonialCard.tsx
- app/components/home/testimonials/StarRating.tsx
- app/components/home/testimonials/index.ts
- app/components/ui/SectionTitle.tsx
- app/components/ui/Container.tsx
- app/components/ui/Card.tsx
- app/components/ui/Button.tsx
- app/components/ui/Badge.tsx
- app/components/ui/table/Table.tsx
- app/components/ui/table/index.ts
- app/components/ui/table/TableHeader.tsx
- app/components/ui/table/TableToolbar.tsx
- app/components/ui/ui.module.css
- app/components/home/testimonials/Testimonials.module.css

## الصور والبيانات / Assets and data

لا تكفي نتيجة البحث المحلي لإثبات عدم استخدام صور المحتوى: قد تأتي روابطها من إدارة المحتوى أو نصوص محفوظة. لذلك لم تُحذف صور الشعارات أو الصور الأصلية أو المكررة في هذه الدفعة، ولم تُغيّر روابطها. صور المتاجر محفوظة أيضًا رغم أن التطبيق غير منشور. بيانات fixtures وأداة ui-preview محفوظتان.
No content image was removed or renamed: CMS-held URLs and stored content are outside this local dependency proof. Duplicate images and former brand artwork remain available. Fixture data and preview tools remain isolated from production. Supabase migrations, SQL history and all account/booking modules remain in place.

## الاستعادة / Recovery

A complete pre-pass local snapshot, binary Git patches and SHA-256 file manifest are stored at:
C:/Users/Laven/AppData/Local/Temp/nour-organization-final-1793664810872

داخل النسخة ملفات العمل السابقة بما فيها الملفات غير المتتبعة، وسجل changes.json للملفات المعدلة والجديدة والمحذوفة. لاستعادة هذه الدفعة فقط، أعد المسارات المسجلة من files واحذف فقط الملفات المسجلة كجديدة؛ لا تستخدم reset أو clean. تتضمن النسخة إعدادات محلية خاصة، فلا ترفعها.
Restore only the paths recorded in changes.json from files/ and remove only paths listed as newly added to undo this pass while preserving unrelated work. The backup includes private local settings; keep it private.

## حدود الاعتماد البصري / Visual verification

أعقب الفحص الداكن الأول تقرير من المستخدم يغطي 36 تركيبة بالمظهرين. أُصلحت الملاحظات الأربع الأخيرة محليًا واعتمدها المستخدم؛ لا يوجد فحص بصري جديد موثّق بعد هذه الإصلاحات. تفاصيل الأدلة وحدودها والقائمة المتبقية في [تجهيز الإصدار](release-readiness.md).
The later user-supplied 36-combination recheck supersedes the initial dark-only report. Latest fixes are user-approved, but a fresh post-fix rendered check, populated hotel/transport review and physical-device testing remain separate verification work.

## متابعة إعادة الفحص البصري / Visual recheck follow-up

أثبت التقرير المقدم من المستخدم نجاح التباين السابق وتمرير لوحة الخصوصية وتحديث موضعها، مع بقاء تداخل الزر العائم مع بطاقة السعر عند التمرير. عند ظهور شريط البرنامج على الجوال والتابلت أصبح زر الخصوصية داخله، ويختفي الزر العائم في هذه الحالة فقط. تبقى لوحة الاختيارات فوق الشريط، وتعود البؤرة إلى زر فتحها بعد الإغلاق. في الكمبيوتر والقائمة والرئيسية يبقى المدخل المعتاد، والتذييل متاح دائمًا.
The supplied recheck confirmed the previous contrast, panel scrolling and responsive positioning fixes. The remaining floating trigger could cover in-flow price content. At widths up to 900px, rendered program bars now contain their own privacy trigger, and CSS hides the floating duplicate only while that bar exists. The choices panel still clears the measured bar; close returns focus. Desktop, catalog, home and unavailable program behavior retain the normal entry point.

حُسّن تباين عنوان ووصف تنبيه الطيران في الوضعين دون تغيير سياسة الشمول. أصبحت الفلاتر عمودين بين 701 و1100 بكسل، وعمودًا واحدًا حتى 700، مع إزالة الحشوة الجانبية القديمة المتعارضة. العدد الإنجليزي يستخدم 1 program و0/2+ programs.
Flight notices now explicitly pair readable text and surface colors without changing inclusion semantics. Filters use two columns at 701–1100px and one up to 700px; a scoped padding rule overrides the old RTL padding. English counts distinguish 1 program from 0/2+ programs. These local changes require a fresh visual recheck; the supplied report predates them.

## إغلاق ملاحظات التقرير النهائي / Final audit follow-up — 2026-11-03

أثبت التقرير النهائي المقدم نجاح موضع الخصوصية وتباين الطيران والفلاتر والعدّ. عولجت الملاحظتان المتبقيتان: استُثنيت شارة «التطبيق قريبًا» من قواعد span الخاصة بالنصوص الثانوية في بطاقة السعر، لتحتفظ بالنص الداكن والمحاذاة الوسطية. صار Escape يستجيب على مستوى النافذة أثناء فتح لوحة الخصوصية العامة ذات الاختيار المحفوظ، حتى عند تركيز زر اللغة؛ لا يحفظ التعديل غير المؤكد ويعيد التركيز للمدخل المناسب. يُزال المستمع عند إغلاق اللوحة أو الخروج من الصفحات العامة، ويحترم حدثًا منعته أداة داخلية.
The price-card status is excluded from generic secondary-text selectors in both detail and shared styles. Privacy Escape handling is active only while the public panel is visible with an existing consent choice; it closes without saving draft changes, restores focus, respects already-handled events and cleans up on close/navigation. First-visit consent behavior is unchanged.

التحقق: 146/146 اختبارًا، فحص الأنواع وWebpack ناجحان، وESLint دون أخطاء مع 28 تحذيرًا سابقًا. التفاصيل بالعربية والإنجليزية HTTP 200 والحجز HTTP 503 / website_booking_paused. الاختبارات الستة الجديدة أعادت إنتاج الخلل قبل الإصلاح ثم نجحت بعده. لا يوجد اعتماد بصري جديد بعد الإصلاحين لتعذر اتصال أداة المتصفح؛ راجع [قائمة الإصدار](release-readiness.md).
