# إدارة عرض الرئيسية / Managed homepage presentation

Updated: 2026-11-03. Current UI behavior; see [release readiness](release-readiness.md) for verification limits.

## الإدارة / Editor

`/admin/website` manages hero, showcase and app-section presentation. Existing permissions remain: `settings.read` to load, `settings.manage` to save/publish and `media.upload` to upload images. RPC permission checks and media RLS are unchanged.

حفظ المسودة يكتب `website.home_presentation_draft`، والنشر يكتب `website.home_presentation` عبر RPC الحالي. لا تنشر بيانات تجريبية لمجرد اختبار الواجهة. الصور المرفوعة في مخزن الوسائط العام؛ خصوصية المسودة تخص الإعدادات ولا تجعل روابط صورها خاصة.
Draft and publication are separate. The generic settings editor excludes these keys. Published settings refresh on new page loads and editor publication; already open visitor tabs may need reload. No booking or program record is created by this editor.

## البداية / Hero

Defaults to the original two-phone composition when `hero.mode` is missing. Both `phones` and `photo` modes remain supported, with bilingual content/alt text and independent front/back mockups. Clearing a mockup restores its original asset; changing modes preserves saved images. Transparent framed-device assets are suitable for phone mode. Photo mode uses the saved photo.

تستخدم البداية هوية نور آب بالأزرق والذهبي وزخرفة منخفضة الحضور. البحث وحالة توقف الحجز يتبعان إعدادات الموقع الحالية، ولا يعرضان وعدًا بحجز متاح.

## عرض التطبيق / Showcase

Up to eight ordered/visible screens, named bilingual tabs, portrait images, keyboard navigation and swipe. Removing a screen removes configuration only, not its media file. Hiding all screens hides the section.

التنقل التلقائي الحالي يعرض شاشة الترحيب 3 ثوانٍ وبقية الشاشات 5 ثوانٍ، بعد جاهزية الصورة وأثناء ظهور القسم ونشاط الصفحة. التفاعل اليدوي يوقف التنقل حتى اختيار التشغيل؛ إعداد تقليل الحركة يستخدم التنقل اليدوي، وفشل الصورة يوقف التتابع. تظل الشاشات بيانات توضيحية حتى استبدالها بمحتوى معتمد.
Autoplay is visibility-aware, pauses on manual interaction and respects reduced motion. Keep the illustrative-data label when screenshots contain examples.

## التطبيق قريبًا / App coming soon

The current public release shows “التطبيق قريبًا / App coming soon”. It does not advertise active store downloads, QR installation or automatic app opening. Store-link configuration and supporting helpers may remain in the codebase; their presence is not launch approval. Keep `NEXT_PUBLIC_NOUR_APP_LINKS_READY=false` for this release.
لا توجد مطابقة معتمدة بين معرّفات برامج الموقع والتطبيق، ولا وعد باستعادة البرنامج بعد التثبيت. تفعيل روابط التطبيق مستقبلًا يحتاج إصدار التطبيق وإعداد النطاق والتحقق على الأجهزة ضمن مهمة منفصلة.

## البيانات والتحقق / Data and verification

Historical record: `20261003170200_managed_home_presentation.sql` was documented as applied on 2026-10-03, adding configuration rows without overwriting values. This documentation update did not query the live schema or replay migrations.

Automated tests cover content normalization, link/image validation, separate draft/publication writes, showcase interaction and autoplay. The supplied visual report covers public pages, not live administrative upload/publish acceptance. Use the [current verification record](release-readiness.md), not historical README counts, for release preparation.

النشر على Hostinger يدوي وفق [دليل التشغيل](hostinger-vps.md). تعديل المستندات أو رفع Git لا ينشر إعدادات إدارة المحتوى ولا الموقع تلقائيًا.
