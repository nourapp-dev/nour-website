export const navigation = [
  [
    "workspace",
    "مساحة العمل",
    "Workspace",
    [
      ["dashboard", "الرئيسية", "Overview", ""],
      ["tasks", "مهامي", "My tasks", ""],
      ["notifications", "الإشعارات", "Notifications", ""],
    ],
  ],
  [
    "requests",
    "الطلبات والعلاقات",
    "Requests & relationships",
    [
      ["applications", "طلبات الانضمام", "Join applications", "applications"],
      ["partners", "الشراكات", "Partnerships", "partners"],
      ["subscribers", "المشتركون", "Subscribers", "subscribers"],
    ],
  ],
  [
    "services",
    "البرامج والخدمات",
    "Programs & services",
    [
      ["programs", "البرامج", "Programs", "programs"],
      ["bookings", "سجلات الحجوزات", "Booking records", "bookings"],
      ["hotels", "الفنادق", "Hotels", "hotels"],
      ["transports", "النقل", "Transport", "transports"],
      ["visas", "التأشيرات", "Visas", "visas"],
      ["countries", "الدول", "Countries", "countries"],
      ["cities", "مدن الانطلاق", "Departure cities", "countries"],
    ],
  ],
  [
    "content",
    "المحتوى والموقع",
    "Content & site",
    [
      ["articles", "المقالات", "Articles", "articles"],
      ["ceo-message", "كلمة الرئيس التنفيذي", "CEO message", "settings"],
      ["media", "الوسائط", "Media", "media"],
      ["website", "واجهة الموقع", "Website showcase", "website"],
    ],
  ],
  [
    "monitoring",
    "المتابعة والتحليل",
    "Monitoring",
    [
      ["analytics", "التحليلات", "Analytics", "analytics"],
      ["activity", "سجل النشاط", "Activity", ""],
    ],
  ],
  [
    "system",
    "إدارة النظام",
    "System",
    [
      ["users", "المستخدمون والأدوار", "Users & roles", "users"],
      ["legal", "المحتوى القانوني", "Legal content", "legal"],
      ["settings", "الإعدادات", "Settings", "settings"],
    ],
  ],
] as const;
export function routePermission(path: string) {
  const section = path.split("/")[2];
  return (
    navigation
      .flatMap((group) => [...group[3]])
      .find((item) => item[0] === section)?.[3] ?? ""
  );
}
export function routeTitle(path: string, lang: "ar" | "en") {
  const item = navigation
    .flatMap((group) => [...group[3]])
    .find((item) => item[0] === path.split("/")[2]);
  return (
    item?.[lang === "ar" ? 1 : 2] ??
    (lang === "ar" ? "لوحة الإدارة" : "Administration")
  );
}
export function mayView(
  module: string,
  permissions: string[],
  superAdmin = false,
) {
  return (
    (module==="website"&&["website.edit","website.publish","settings.manage"].some(p=>permissions.includes(p))) ||
    !module ||
    superAdmin ||
    ["view", "read", "manage"].some((action) =>
      permissions.includes(`${module}.${action}`),
    )
  );
}
