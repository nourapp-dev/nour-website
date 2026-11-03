
# وحدات الخادم / Server modules

هذه الوحدات خاصة بالخادم داخل مشروع Next.js الحالي وليست باك اند Laravel أو خدمة منشورة جديدة.
Every runtime module in this directory imports server-only. Do not import these modules from use client components, browser services, or shared barrels.

- supabase/admin.ts: عميل الإدارة بالمفتاح السري؛ يستدعى من مسارات الإدارة المحمية فقط.
- supabase/session.ts: جلسة الطلب مع فصل cookies الإدارة والعميل؛ لا تستخدم عميلًا عامًا مشتركًا بين الطلبات.
- bookings/program-booking.server.ts: عقد الحجز الحالي دون تغيير الحسابات أو RPC أو فتح الحجز.
- programs/public-program-metadata.server.ts: قراءة بيانات البرامج العامة للـ metadata.
- settings/public-settings.server.ts: قراءة الإعدادات العامة من الخادم.

Keep Next.js route entrypoints under app/api and app/auth. Preserve their permission/origin/input validation before calling services. Client Supabase utilities remain under src/lib/supabase; shared booking DTOs live under src/features/bookings/types.
Do not move Supabase migrations or run SQL as part of structural cleanup. No package or backend integration is introduced.
Tests stub the Next-only module marker, exercise the implementations, check transitive client imports, and are complemented by next build.
