# مصفوفة أدوار الداشبورد وصلاحياتها

**الحالة: مطبقة على الإنتاج بتاريخ 2026-11-11 بعد الموافقة الصريحة على المصفوفة.** أُنشئت ستة أدوار وحُدّثت أربعة؛ العدد الإجمالي 11 مع المدير الأعلى.

النطاق: تحديث أربعة أدوار حالية غير مسندة، وإنشاء ستة أدوار. يبقى دور super_admin كما هو، ولا تتغير أي إسنادات للموظفين.

إدارة المستخدمين والأدوار وإعدادات النظام وسجل التدقيق والأعلام التشغيلية تبقى للمدير الأعلى. لا تتضمن المصفوفة صلاحيات الحذف الصريحة ذات اللاحقة .delete.

تنبيه للمعنى الوظيفي: صلاحيات .manage تشمل الإجراءات التي يربطها القسم بها حاليًا، وقد تشمل إجراءات واسعة. articles.manage تشمل نشر المقالات؛ website.edit وحدها لا تسمح بنشر الموقع. لا تعني إزالة .delete منع جميع إجراءات الحذف داخل الأقسام ذات صلاحية .manage.

| الدور | عدد الصلاحيات | نطاق العمل |
|---|---:|---|
| مدير عام | 46 | إدارة الأقسام التشغيلية والمحتوى والنشر والتقارير، دون إدارة أمن النظام أو صلاحيات الحذف المنفصلة. |
| مدير العمليات | 18 | إدارة الحجوزات والسكن والنقل والتأشيرات وإعداد البرامج ومتابعة الشركاء تشغيليًا. |
| مدير البرامج والوجهات | 17 | إنشاء البرامج وتعديلها ونشرها وإدارة الدول ومدن الانطلاق، دون الحذف النهائي. |
| مسؤول الحجوزات | 8 | متابعة سجلات الحجوزات وتحديث حالاتها والاطلاع على تفاصيل البرامج والخدمات. |
| مدير الشراكات | 11 | إدارة طلبات الشراكة والإحالة والمتطلبات والمرفقات والأرشفة والتصدير. |
| مسؤول طلبات الانضمام | 8 | إدارة طلبات الانضمام والإحالة والحالات والمرفقات والأرشفة والتصدير. |
| مدير المحتوى والموقع | 10 | إدارة المقالات والوسائط والفيديوهات ومحتوى الموقع ونشره والاطلاع على التحليلات. |
| مدير التسويق | 13 | إدارة المشتركين وتصديرهم والمقالات والوسائط والتحليلات وإعداد مسودات الموقع. |
| مسؤول المحتوى القانوني | 7 | عرض وتحرير ونشر الصفحات القانونية وإدارة وسائطها. |
| مستعرض | 14 | عرض أقسام العمل والتقارير دون تعديل أو نشر أو تنزيل مرفقات الطلبات أو تصدير بياناتها. |

## مدير عام — `admin`

إدارة الأقسام التشغيلية والمحتوى والنشر والتقارير، دون إدارة أمن النظام أو صلاحيات الحذف المنفصلة.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `applications.archive` |
| `applications.assign` |
| `applications.attachments` |
| `applications.export` |
| `applications.manage` |
| `applications.status` |
| `applications.view` |
| `articles.manage` |
| `articles.read` |
| `bookings.manage` |
| `bookings.view` |
| `countries.archive` |
| `countries.create` |
| `countries.publish` |
| `countries.read` |
| `countries.update` |
| `dashboard.read` |
| `hotels.manage` |
| `hotels.read` |
| `legal.edit` |
| `legal.publish` |
| `legal.view` |
| `media.read` |
| `media.update` |
| `media.upload` |
| `partners.archive` |
| `partners.assign` |
| `partners.attachments` |
| `partners.export` |
| `partners.manage` |
| `partners.status` |
| `partners.view` |
| `programs.create` |
| `programs.publish` |
| `programs.read` |
| `programs.update` |
| `subscribers.export` |
| `subscribers.manage` |
| `subscribers.read` |
| `transports.manage` |
| `transports.read` |
| `visas.manage` |
| `visas.read` |
| `website.edit` |
| `website.publish` |

## مدير العمليات — `operations_manager`

إدارة الحجوزات والسكن والنقل والتأشيرات وإعداد البرامج ومتابعة الشركاء تشغيليًا.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `bookings.manage` |
| `bookings.view` |
| `countries.read` |
| `dashboard.read` |
| `hotels.manage` |
| `hotels.read` |
| `partners.assign` |
| `partners.attachments` |
| `partners.status` |
| `partners.view` |
| `programs.create` |
| `programs.read` |
| `programs.update` |
| `transports.manage` |
| `transports.read` |
| `visas.manage` |
| `visas.read` |

## مدير البرامج والوجهات — `programs_manager`

إنشاء البرامج وتعديلها ونشرها وإدارة الدول ومدن الانطلاق، دون الحذف النهائي.

| مفتاح الصلاحية الدقيق |
|---|
| `bookings.view` |
| `countries.archive` |
| `countries.create` |
| `countries.publish` |
| `countries.read` |
| `countries.update` |
| `dashboard.read` |
| `hotels.read` |
| `media.read` |
| `media.update` |
| `media.upload` |
| `programs.create` |
| `programs.publish` |
| `programs.read` |
| `programs.update` |
| `transports.read` |
| `visas.read` |

## مسؤول الحجوزات — `booking_officer`

متابعة سجلات الحجوزات وتحديث حالاتها والاطلاع على تفاصيل البرامج والخدمات.

| مفتاح الصلاحية الدقيق |
|---|
| `bookings.manage` |
| `bookings.view` |
| `countries.read` |
| `dashboard.read` |
| `hotels.read` |
| `programs.read` |
| `transports.read` |
| `visas.read` |

## مدير الشراكات — `partnerships_manager`

إدارة طلبات الشراكة والإحالة والمتطلبات والمرفقات والأرشفة والتصدير.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `countries.read` |
| `dashboard.read` |
| `partners.archive` |
| `partners.assign` |
| `partners.attachments` |
| `partners.export` |
| `partners.manage` |
| `partners.status` |
| `partners.view` |
| `programs.read` |

## مسؤول طلبات الانضمام — `applications_manager`

إدارة طلبات الانضمام والإحالة والحالات والمرفقات والأرشفة والتصدير.

| مفتاح الصلاحية الدقيق |
|---|
| `applications.archive` |
| `applications.assign` |
| `applications.attachments` |
| `applications.export` |
| `applications.manage` |
| `applications.status` |
| `applications.view` |
| `dashboard.read` |

## مدير المحتوى والموقع — `content_manager`

إدارة المقالات والوسائط والفيديوهات ومحتوى الموقع ونشره والاطلاع على التحليلات.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `articles.manage` |
| `articles.read` |
| `dashboard.read` |
| `legal.view` |
| `media.read` |
| `media.update` |
| `media.upload` |
| `website.edit` |
| `website.publish` |

## مدير التسويق — `marketing_manager`

إدارة المشتركين وتصديرهم والمقالات والوسائط والتحليلات وإعداد مسودات الموقع.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `articles.manage` |
| `articles.read` |
| `countries.read` |
| `dashboard.read` |
| `media.read` |
| `media.update` |
| `media.upload` |
| `programs.read` |
| `subscribers.export` |
| `subscribers.manage` |
| `subscribers.read` |
| `website.edit` |

## مسؤول المحتوى القانوني — `legal_manager`

عرض وتحرير ونشر الصفحات القانونية وإدارة وسائطها.

| مفتاح الصلاحية الدقيق |
|---|
| `dashboard.read` |
| `legal.edit` |
| `legal.publish` |
| `legal.view` |
| `media.read` |
| `media.update` |
| `media.upload` |

## مستعرض — `viewer`

عرض أقسام العمل والتقارير دون تعديل أو نشر أو تنزيل مرفقات الطلبات أو تصدير بياناتها.

| مفتاح الصلاحية الدقيق |
|---|
| `analytics.read` |
| `applications.view` |
| `articles.read` |
| `bookings.view` |
| `countries.read` |
| `dashboard.read` |
| `hotels.read` |
| `legal.view` |
| `media.read` |
| `partners.view` |
| `programs.read` |
| `subscribers.read` |
| `transports.read` |
| `visas.read` |

## التنفيذ والتحقق

المصدر التنفيذي: database/seeds/dashboard-role-policy.json؛ يولد ops/dashboard-role-policy.mjs معاملة SQL ولا يتصل بقاعدة البيانات تلقائيًا. تحفظ المعاملة القيم السابقة واللاحقة في سجل التدقيق، وتتحقق من بقاء المدير الأعلى وإسنادات الموظفين دون تغيير.

نجحت اختبارات السياسة الثلاثة، وجميع اختبارات المشروع وعددها 250. تحقق الإنتاج أكد وجود 11 دورًا نشطًا، وتسجيل عشرة تغييرات (ستة إنشاء وأربعة تحديث)، وعدم منح صلاحيات النظام للأدوار الوظيفية. بقي المدير الأعلى وإسنادات الموظفين دون تغيير.
