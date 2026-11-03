# دليل قاعدة البيانات / Database documentation

Updated: 2026-11-03. Documentation index only; no database inspection or changes were performed.

الموقع الحالي يستخدم Supabase للبيانات والمصادقة والتخزين. فصل وحدات `src/server` تنظيم داخل Next.js وليس ربطًا بـLaravel أو إنشاء قاعدة جديدة. خطة الربط بـLaravel ملغاة.

- [Architecture reference](Database-Architecture.md): design documentation; confirm its date/scope before treating it as a deployed-schema description.
- [Historical ER diagram](Database-ERD.md): foundation draft dated 2026-07-24, not a complete current-schema guarantee.
- [Migration history](../supabase/migrations/): versioned SQL files; their presence does not prove they have been applied to any environment.
- [Managed presentation](managed-home-presentation.md): published/draft configuration behavior and historical migration record.
- [Server-only modules](../src/server/README.md): runtime ownership and client/server boundaries.

إصدار تحسين الواجهة الحالي لا يحتاج تطبيق ترحيل جديد ضمن نطاقه الموثق. لا تُشغّل reset أو seed أو SQL قديم استعدادًا للنشر. إذا ظهرت حاجة فعلية لتغيير مخطط، تُراجع حالة الترحيلات والنسخ الاحتياطي والأثر على البيانات في مهمة منفصلة قبل التطبيق.
The UI release does not authorize migrations, seed execution, data cleanup or a Supabase-to-server migration. Preserve existing SQL history and content assets. Do not publish credentials or local backups in documentation.
