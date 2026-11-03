import type { AdminLanguage } from "./LanguageProvider";

export const adminTranslations = {
  ar: {
    topbar: {
      title: "لوحة إدارة نور آب",
      subtitle: "إدارة المحتوى والخدمات والإعدادات",
      searchPlaceholder: "بحث في لوحة الإدارة...",
      notifications: "الإشعارات",
      switchLanguage: "Switch to English",
    },

    sidebar: {
      dashboard: "لوحة التحكم",
      countries: "الدول",
      programs: "البرامج",
      media: "الوسائط",
      users: "المستخدمون",
    },

    countries: {
      pageTitle: "الدول",
      pageDescription:
        "إدارة جميع الدول المتاحة داخل منصة نور آب.",
      addCountry: "إضافة دولة",
      recycleBin: "سلة المحذوفات",
      tableTitle: "قائمة الدول",
      tableDescription:
        "إدارة جميع الدول المتاحة في منصة نور آب",
      searchPlaceholder: "ابحث عن دولة...",
    },
  },

  en: {
    topbar: {
      title: "Nour Admin",
      subtitle: "Manage content, services and settings",
      searchPlaceholder: "Search the admin panel...",
      notifications: "Notifications",
      switchLanguage: "التبديل إلى العربية",
    },

    sidebar: {
      dashboard: "Dashboard",
      countries: "Countries",
      programs: "Programs",
      media: "Media",
      users: "Users",
    },

    countries: {
      pageTitle: "Countries",
      pageDescription:
        "Manage all countries available on Nour App.",
      addCountry: "Add Country",
      recycleBin: "Recycle Bin",
      tableTitle: "Countries List",
      tableDescription:
        "Manage all countries available on Nour App",
      searchPlaceholder: "Search for a country...",
    },
  },
} as const;

export function getAdminTranslations(
  language: AdminLanguage,
) {
  return adminTranslations[language];
}