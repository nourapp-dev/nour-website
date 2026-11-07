# Admin workspace development — 2026-11-07

Repository: nourapp-dev/nour-website; branch: feat/partner-interest-workflow.
Existing uncommitted partnership/careers/guide work is preserved. Next.js 16.3.8,
React 19, Supabase SSR and TanStack Query are the existing stack. Work targets
localhost:3107 and the isolated nour-intake-local stack (API 54331) exclusively.

## Initial inventory and findings

Existing sections: dashboard, applications, partners, bookings, countries, cities,
programs (detail/content/departures/pricing), hotels, transports, visas, articles,
CEO message, media (detail), legal (detail/versions), analytics, subscribers,
users, settings, website showcase, login and invitation acceptance.

Existing CRUD services and private file storage are reused. Confirmed defects:
login inherits the protected sidebar/topbar; topbar identity and sidebar online/
production claims are static; generic jobs mapping drops talent-pool preferences;
lists fetch all records and lack reliable cancellation/URL state; legacy approval
labels imply recruitment; dashboard depends on modules missing from local intake
schema. Local and published versions use different databases; no production
records are queried or changed. The cited QA record will be inspected locally.

## Navigation and implementation sequence

1. Separate authentication frame, safe intended destinations, private-session
   lifecycle, central navigation/permission registry and truthful environment.
2. Shared tokens, responsive shell, language/theme/accessibility and common states.
3. Reference intake list/details: database pagination, typed bilingual values,
   private attachments, optimistic concurrency, trusted audit/status/assignment.
4. Partnership integration preserving existing qualification/contract requirements.
5. Apply shared frame, table/form conventions and unsaved-change protections to
   existing service/content/user/settings editors without replacing their domain
   logic or changing prices, booking or payment behavior.
6. Actual tasks, notifications, limited intake search, scoped activity and daily
   dashboard with independent loading/error/permission/zero states.
7. Local synthetic end-to-end checks, permission negatives, type/lint/tests/build.

Groups: workspace; requests and relationships; programmes and services; content
and site; monitoring; system. Keep existing routes; add functioning tasks,
notifications, scoped activity and direct intake details. No dummy destinations.

## Constraints

Local stack contains intake/RBAC only, not a production data clone. Existing
historical migration ordering is broken; required SQL is bootstrapped locally.
Missing service/catalogue modules must be reported accurately rather than seeded
with invented data. Browser access host was unavailable earlier; visual checks
will be retried and explicitly distinguished from HTTP/JSDOM tests.
No deploy, merge, push, Laravel integration or production writes are authorized.
Web booking stays closed and the app stays coming soon. No outbound candidate
messages, secrets in output, or fake success states.

Primary files: app/admin/layout.tsx; src/features/admin-workspace/*;
src/components/admin/layout/*; src/lib/supabase/proxy.ts;
src/styles/admin/workspace.css; intake contracts/services and a local-tested SQL
migration. Final implementation/verification results will be appended here.

## النتيجة المنفذة محليًا — 2026-11-08

- فصل إطار الدخول والدعوات عن الإدارة المحمية. لا تُعرض هوية أو قائمة محمية
  قبل التحقق. شعار نور آب الفعلي، لغتان، مظهران، إظهار كلمة المرور، autocomplete،
  قفل الإرسال، رسائل شبكة/رفض وصول منفصلة، ووجهة داخلية آمنة بعد الدخول.
  لا يوجد رابط استعادة وهمي؛ نص واضح للتواصل مع مسؤول النظام لأن رحلة الاستعادة
  الإدارية المستقلة لم تكن مهيأة في المشروع.
- إطار موحد يطبق على جميع مسارات الإدارة الموجودة: قائمة مجموعات قابلة للطي،
  تمييز المسار، قائمة جوال، مسار تنقل، بحث فعلي محدود بالطلبات، إشعارات فعلية،
  هوية من القاعدة، لغة ومظهر محفوظان. وسم البيئة مشتق من عنوان الخدمة الفعلي.
- حماية المسارات بحسب صلاحيات القسم داخل proxy، وحماية التنفيذ بـ RLS ودوال
  القاعدة. لا تنهي أخطاء الشبكة الجلسة. تُلغى استعلامات البيانات الخاصة وتُمسح
  ذاكرتها بعد خروج ناجح، وتُحجب الصفحة قبل حفظها في bfcache مع إعادة التحقق
  عند العودة. لا تُمسح تفضيلات العرض. إشعار قرب الانتهاء مشتق من expires_at
  الفعلي مع بقاء التجديد التلقائي لدى Supabase.
- الانضمام والشراكات: قالب واحد للقائمة والتفاصيل المباشرة والمعاينة، دون جدول
  طلبات جديد. البحث مربوط بمعلمات SQL؛ الفرز والترقيم والتصفية في القاعدة،
  20 سجلًا للصفحة وإجمالي مطابق مستقل. الفلاتر غير الحساسة في URL؛ البحث الحساس
  في ذاكرة الجلسة ويُستعاد مع رابط العودة من التفاصيل، ويُمسح عند الخروج.
- تفاصيل كاملة للحقول الموجودة، ترجمة الدول والقيم المشتركة مع النموذج، عزل
  البريد والجوال والمراجع، إظهار صفر الخبرة، بيانات الموافقة المسجلة والمرفقات
  الاختيارية. روابط المرفقات خاصة لمدة دقيقتين وتحتاج صلاحية مرفقات أو manage؛
  صلاحية العرض وحدها لا تكفي. التصدير لصاحب الصلاحية ويقتصر على الصفحة وحقول
  المرجع والاسم والدولة والحالة والتاريخ، مع تحييد صيغ CSV.
- ملاحظات وإسناد وحالات وأرشفة واستعادة عبر مسار موثوق، مع قفل الصف ومقارنة
  updated_at وإرجاع تعارض HTTP 409. لا تُمحى مسودة المستخدم عند الفشل أو عند
  إنشاء متابعة. اختيار «تحميل أحدث نسخة» يطلب تأكيد تجاهل المسودة.
- تسميات قاعدة المواهب بحسب application_kind: «مناسب لفرصة / غير مناسب حاليًا»
  دون إعادة كتابة approved/rejected القديمة أو تغيير معناها للسجلات السابقة.
  الشراكات لها انتقالات منفصلة؛ الاعتماد والتشغيل يتطلبان صلاحية الإدارة ومراجع
  العقد وإشعار الاعتماد وملحق الدولة للشريك الدولي.
- مهام متابعة فعلية مرتبطة بالسجل الأصلي: مسؤول وعنوان وموعد اختياري وحالة،
  قائمة «مهامي» بترقيم وتصفية، وإكمال/إعادة فتح/إلغاء. التأخر لا يُحسب دون موعد
  فعلي. تنبيهات داخلية للإسناد وتغيير حالة السجل المسند، مقروء/غير مقروء، روابط
  للسجل وقيود مشاهدة ومنع تكرار الحدث. التحديث عند الفعل/التركيز وليس polling
  شاملًا. لم تُرسل رسائل بريد أو SMS أو WhatsApp.
- سجل أحداث الطلبات بإلحاق من trigger موثوق، مع الفاعل والتوقيت والتغييرات
  المهمة. لا تُنسخ الملاحظات أو محتويات الملفات أو الأسرار إلى السجل. لا يمكن
  لمستخدم الإدارة العادي تعديله. عُرض أيضًا سجل المستخدمين/الأدوار الموجود
  وبيانات أحداث المحتوى والبرامج للمدير الأعلى؛ دون قيم الإعدادات أو old_data.
- الرئيسية بأرقام مستقلة للطلبات الجديدة والمراجعة والإسناد والمهام والنشاط،
  مع تعريف الرقم ورابط الفلتر المطابق. الصفر والتحميل والخطأ وعدم الصلاحية حالات
  منفصلة، وكل قسم يُعاد تحميله وحده. سجلات الحجوزات السابقة متاحة بحسب الصلاحية،
  مع إعلان بقاء استقبال حجز الويب مغلقًا والتطبيق قريبًا.
- تعميم tokens والجداول القابلة للتمرير والأزرار والحقول على المحررات القائمة.
  أضيفت حماية المغادرة للبرامج والدول والفنادق ومعرضها والنقل والتأشيرات والوسائط
  والمقالات وكلمة الرئيس والمحتوى القانوني والإعدادات. حسّنت ترجمة محرري المقالات
  وكلمة الرئيس والفنادق، ورسائل التحقق داخل نماذج البرامج والنقل والتأشيرات.
  بقيت علاقات البرامج والأسعار ومنطق الحجز والدفع كما هي.
- المستخدمون: إعادة استخدام الواجهة وAPI الحاليين، وإضافة إدارة تعريف الأدوار
  والصلاحيات للمدير الأعلى، مع تدقيق التغييرات ومنع تعديل دوره الحالي أو دور
  super_admin. لم تُغيّر صلاحيات مستخدم حقيقي أثناء الاختبارات.

## التحقق من الملاحظات الأصلية

الطلب `312e48f5-8837-4868-a67b-0b89f489b926` موجود في القاعدة المحلية، بحالة new.
القيم الفعلية: opportunity_type=freelance، employment_type=other للتوافق،
work_mode=no_preference، country=SA. سبب العرض الخاطئ كان إسقاط الحقول الجديدة
من عقد الإدارة، لا فقدان قيمة freelance. لم يُعد تفسير بيانات الطلب أو تعديله.

قورنت ملفات JavaScript العامة لشاشة الدخول المنشورة قراءةً فقط؛ تحمل عنوان
`fsgxtdhmmbkadjozqgck.supabase.co`. المعاينة تقرأ فعليًا `127.0.0.1:54331`،
وهي قاعدة معزولة. عدم ظهور الطلب المحلي في السحابي لا يثبت فقدانه؛ لم تُنسخ
طلبات ولم تُقرأ جداول طلبات الإنتاج للتحقق. لم يُنشر أي تغيير.

## الملفات والمخطط

- `app/admin/layout.tsx` و`src/features/admin-workspace/AdminFrame.tsx` وProvider:
  فصل الإطارات والتحقق والجلسة؛ Sidebar/Topbar للتنقل والهوية والأدوات.
- `src/features/admin-workspace/contracts.ts`, `navigation.ts`, `data.ts`:
  القيم المشتركة والتسمية والصلاحيات والعقود والاستعلامات والتحديث.
- `IntakeList.tsx`, `IntakeDetail.tsx`, `RecordFollowups.tsx`, `WorkspacePages.tsx`,
  `SystemActivity.tsx`, `RolePanel.tsx`, `Dashboard.tsx`: الرحلات الفعلية.
- `useUnsaved.ts`, `useModalFocus.ts`, `src/core/dialogs/ConfirmDialog.tsx`,
  مكونات الجدول والترقيم و`src/styles/admin/workspace.css`: الحماية والإتاحة
  والقالب المشترك؛ تعديلات المحررات المذكورة أعلاه تحافظ على خدماتها الحالية.
- `src/features/applications/types/jobApplications.ts` وخدمة adminJobApplications:
  تضمين حقول المواهب الجديدة مع الحفاظ على المستهلكين السابقين.
- `supabase/migrations/20261107200730_admin_workspace_workflow.sql`: ترحيل جديد
  متوافق، طُبق محليًا فقط وسُجل في سجل المشروع المعزول. يضيف followups/events/
  notifications وصلاحيات فرعية وRLS ودوال محدودة ومشغلات تدقيق؛ لا ينشئ نظام
  طلبات موازيًا ولا يغيّر enum الحالات أو يعيد تصنيف البيانات القديمة.
- `scripts/careers/bootstrap-local-admin-modules.mjs`: إعادة ترحيلات الأقسام
  الموجودة إلى المخطط المحلي، لا نسخ بيانات الإنتاج. احتُفظ بالترحيلات التاريخية.
- `tests/admin-workspace.test.mjs`, `verify-admin-workspace.mjs`,
  `verify-admin-migration.mjs`: اختبارات الواجهة والتكامل والترحيل النظيف.

## نتائج التحقق وحدوده

اختبارات الواجهة السبعة نجحت: الدخول ومنع التكرار، الأخطاء الآمنة، حجب المحتوى
قبل التحقق، بيانات المواهب والبلدان والاتجاهات والقيم القديمة، الفلاتر والترقيم
وروابط التفاصيل، وحصر التركيز والإغلاق وإعادته. هذه اختبارات JSDOM وليست فحصًا
بصريًا أو إثباتًا لتخطيط الشاشة.

نجح اختبار تكامل فعلي مع Next.js وSupabase Auth/Storage/RLS المحلي: تقديم طلب
وسيرة اصطناعية، مرجع القاعدة، ظهور وقراءة القيم، ملاحظة وإسناد ومتابعة وتغيير حالة،
إشعارات وتدقيق وتعارض تعديل وأرشفة واستعادة. اختُبرت صلاحيات محدودة ورفض تنزيل
وتصدير وتعديل ورفع صلاحيات غير مصرح؛ ودورة شريك دولي حتى اعتماد العقد والملحق.
اختُبر API المستخدمين وقائمة الأدوار. حُذفت فقط السجلات والأدوار والمستخدمون
والملفات الاصطناعية التي أنشأها الاختبار، مع بقاء سجل QA الأصلي.

نجح تشغيل الترحيل على قاعدة PostgreSQL جديدة داخل Docker، مع Auth/Storage stubs
معلنة لهذا الاختبار وحده؛ اختبار التكامل السابق يستخدم الخدمات الفعلية منفصلًا.
نجح فحص SQL لمخطط admin_private. الفحص الشامل لـ public كشف خطأ سابقًا خارج
نطاق هذه المهمة في `create_program_booking`: التباس `booking_id` (42702).
لم تُعدّل الدالة لأن الطلب يستبعد تغيير منطق الحجز والدفع؛ يبقى حجز الويب مغلقًا.

تعذّر الفحص البصري والتقاط الصور: أداة المتصفح أعادت
`The browser access host is unavailable`. لم يُدّعَ اجتياز معاينة 1440/1024/390
أو المظهرين بصريًا. توجد قواعد responsive ودعم RTL/LTR وتقليل الحركة وحالات
تركيز، لكن يلزم استكمال الفحص البصري عند توفر المتصفح. لا توجد صور مصطنعة بديلة.
لم تُنفذ رحلات كتابة من المتصفح لكل محرر قديم؛ فحصها هنا إعادة استخدام خدماتها
مع فحوص الأنواع وlint والبناء واختبارات المشروع، والتكامل الكامل للطلبات.

نتائج التشغيل النهائي بعد آخر تعديل:

- `npm test`: نجح 166 اختبارًا، بلا فشل أو تجاوز، منها 7 اختبارات الإدارة الجديدة.
- `npm run quality`: نجح؛ TypeScript دون أخطاء، وESLint دون أخطاء مع 25 ملاحظة
  موجودة في الشفرة القديمة. لا توجد ملاحظات lint في مجلد admin-workspace الجديد.
- `npm run build`: نجح البناء، بما في ذلك تفاصيل الانضمام والشراكات والمهام
  والإشعارات والنشاط والبحث. مسارات الإدارة server-rendered عند الطلب.
- اختبارا `verify-admin-workspace.mjs` و`verify-admin-migration.mjs`: ناجحان،
  مع تنظيف بيانات الاختبار فقط. API الحجز المحلي أرجع 503 ورمز
  website_booking_paused كما هو مطلوب.
- فحص SQL لـ admin_private: بلا أخطاء. الفحص العام ما زال يبيّن خطأ الحجز
  السابق الموثق أعلاه؛ لم يُخفَ أو يُعتبر ناجحًا.
- فحص Git: لا أخطاء whitespace. ملفات البيئة والحساب المحلي والسجلات مستثناة
  من Git، ولم تتغير package.json/package-lock.json. استُخدم formatter مؤقت
  بإصدار ثابت دون إضافة اعتماد للمشروع. المعاينة المحلية النهائية ترجع HTTP 200.

أضيفت معاينة نص المسودة الآمنة ثنائية اللغة في المقالات وكلمة الرئيس التنفيذي
قبل الحفظ أو النشر، مع إبقاء HTML المدخل نصًا في هذه المعاينة لتجنب تشغيله.
رُبط عرض أحداث النظام بسجل التدقيق الموجود، مع صلاحية قراءة metadata فقط
لجدول audit_logs دون السماح بقراءة old_data/new_data من هذا التوسيع.

## المعاينة والتشغيل

الموقع يعمل على `http://localhost:3107`؛ الدخول `/admin/login`، والرئيسية
`/admin/dashboard`، والانضمام `/admin/applications`، والشراكات `/admin/partners`،
والمهام `/admin/tasks`، والإشعارات `/admin/notifications`، والنشاط `/admin/activity`،
والبحث `/admin/search`، والمستخدمون والأدوار `/admin/users`.

من جذر الموقع، راجع `docs/local-supabase-intake.md` لتشغيل Docker/Supabase المعزول.
أوامر التحقق: `npm test`، `npm run quality`، `npm run build`، ثم
`node scripts/careers/verify-admin-workspace.mjs` و
`node scripts/careers/verify-admin-migration.mjs`.
لا تطبع `.env.local` أو ملف الحساب المحلي. بيانات الدخول السابقة لم تتغير.

لم يحدث نشر أو دمج أو push أو reset، ولم تُغيّر بيانات الإنتاج أو إعداد الحجز
أو حالة التطبيق، ولم يُعد تفعيل الربط مع Laravel.
