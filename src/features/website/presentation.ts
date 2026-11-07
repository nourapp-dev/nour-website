import { defaultPages, type PageContent } from "./page-content";
import {
  defaultSections,
  normalizeSections,
  type TextSection,
  type TextSectionKey,
} from "./sections";
import type { SupabaseClient } from "@supabase/supabase-js";
export const PRESENTATION_KEY = "website.home_presentation";
export const DRAFT_KEY = "website.home_presentation_draft";
export type Bilingual = { ar: string; en: string };
export type AppScreen = {
  id: string;
  image: string;
  title: Bilingual;
  description: Bilingual;
  visible: boolean;
  preview: boolean;
};
export type Presentation = {
  programs: { ids: string[]; title: Bilingual; description: Bilingual };
  pages: Record<"partner" | "careers", PageContent>;
  navigation: { partnerVisible: boolean; partnerLabel: Bilingual };
  sections: Record<TextSectionKey, TextSection>;
  hero: {
    focusX?: number;
    focusY?: number;
    mode: "phones" | "photo";
    frontImage: string;
    backImage: string;
    frontAlt: Bilingual;
    backAlt: Bilingual;
    title: Bilingual;
    description: Bilingual;
    eyebrow: Bilingual;
    image: string;
    imageAlt: Bilingual;
    button: Bilingual;
    href: string;
  };
  showcase: {
    title: Bilingual;
    description: Bilingual;
    button: Bilingual;
    href: string;
    visible: boolean;
    screens: AppScreen[];
  };
  download: {
    title: Bilingual;
    description: Bilingual;
    visible: boolean;
    appStore: string;
    googlePlay: string;
    appGallery: string;
  };
};
export const defaultPresentation: Presentation = {
  programs: {
    ids: [],
    title: {
      ar: "رحلتك تبدأ من البرنامج المناسب",
      en: "Your journey starts with the right program",
    },
    description: {
      ar: "قارن بيانات الانطلاق والإقامة والخدمات المنشورة.",
      en: "Compare published origins, stays and services.",
    },
  },
  pages: defaultPages,
  navigation: {
    partnerVisible: true,
    partnerLabel: { ar: "كن شريك نور آب", en: "Partner with Nour" },
  },
  sections: defaultSections,
  hero: {
    focusX: 50,
    focusY: 50,
    mode: "phones",
    frontImage: "/images/site/front-view.png",
    backImage: "/images/site/rotated-right.png",
    frontAlt: { ar: "واجهة تطبيق نور آب", en: "NourApp app interface" },
    backAlt: { ar: "معاينة تطبيق نور آب", en: "NourApp preview" },
    title: {
      ar: "رحلتك إلى العمرة تبدأ بطمأنينة",
      en: "Your Umrah journey starts with peace of mind",
    },
    description: {
      ar: "استكشف البرامج وقارن تفاصيل الإقامة والنقل والخدمات، واختر ما يناسب رحلتك.",
      en: "Explore programs, compare accommodation, transport and services, and find the journey that suits you.",
    },
    eyebrow: {
      ar: "نور آب · رفيق رحلة العمرة",
      en: "NourApp · Your Umrah companion",
    },
    image: "",
    imageAlt: { ar: "الحرم المكي", en: "The Holy Mosque in Makkah" },
    button: { ar: "كيف تبدأ رحلتك؟", en: "How does your journey begin?" },
    href: "#journey",
  },
  showcase: {
    title: {
      ar: "رحلتك مع نور آب… بين يديك",
      en: "Your journey with Nour, in your hands",
    },
    description: {
      ar: "تعرّف على التطبيق، وتنقّل بين شاشاته لتكتشف كيف يساعدك في تفاصيل رحلتك.",
      en: "Explore the app screens and discover how Nour helps you follow the details of your journey.",
    },
    button: { ar: "اكتشف البرامج", en: "Explore programs" },
    href: "#programs",
    visible: true,
    screens: [
      {
        id: "welcome",
        image: "/images/app-screens/home.png",
        title: { ar: "مرحبًا بنور آب", en: "Welcome" },
        description: {
          ar: "رفيقك في رحلة السعادة.",
          en: "Your happiness journey companion.",
        },
        visible: true,
        preview: true,
      },
      {
        id: "programs",
        image: "/images/app-screens/packages.png",
        title: { ar: "البرامج", en: "Programs" },
        description: {
          ar: "استعرض البرامج وتعرّف على تفاصيلها.",
          en: "Browse programs and explore their details.",
        },
        visible: true,
        preview: true,
      },
      {
        id: "details",
        image: "/images/app-screens/package-details.png",
        title: { ar: "تفاصيل الرحلة", en: "Trip details" },
        description: {
          ar: "الإقامة والخدمات وتفاصيل البرنامج في مكان واحد.",
          en: "Accommodation, services and program details in one place.",
        },
        visible: true,
        preview: true,
      },
      {
        id: "booking",
        image: "/images/app-screens/booking.png",
        title: { ar: "الحجز", en: "Booking" },
        description: {
          ar: "معاينة خطوات الحجز داخل التطبيق.",
          en: "Preview the booking steps inside the app.",
        },
        visible: true,
        preview: true,
      },
      {
        id: "trip",
        image: "/images/app-screens/trip.png",
        title: { ar: "رحلتي", en: "My trip" },
        description: {
          ar: "تعرّف على طريقة متابعة رحلتك.",
          en: "Discover how to follow your journey.",
        },
        visible: true,
        preview: true,
      },
    ],
  },
  download: {
    title: { ar: "نور آب معك في كل خطوة", en: "Nour, with you at every step" },
    description: {
      ar: "حمّل التطبيق عند توفره في المتجر، واجعل تفاصيل رحلتك بين يديك.",
      en: "Download the app when available in your store and keep your journey details at hand.",
    },
    visible: true,
    appStore: "",
    googlePlay: "",
    appGallery: "",
  },
};
function obj(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown, fallback: string, limit = 1600) {
  return typeof value === "string" ? value.slice(0, limit) : fallback;
}
function pair(value: unknown, fallback: Bilingual): Bilingual {
  const v = obj(value);
  return {
    ar: text(v.ar, fallback.ar).replace(
      /(?<![\p{L}\p{N}_])([وبلكف]?)نـ*وـ*ر(?!\s*آب)(?=$|[^\p{L}\p{N}_])/gu,
      "$1نور آب",
    ),
    en: text(v.en, fallback.en),
  };
}
export function safeLink(value: unknown): string {
  if (typeof value !== "string" || !value || /[\\\s\u0000-\u001f]/.test(value))
    return "";
  if (
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//"))
  )
    return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
export function safeImage(value: unknown): string {
  const link = typeof value === "string" ? value : "";
  if (!link || /[\\\s\u0000-\u001f]/.test(link)) return "";
  if (
    link.startsWith("/images/") &&
    !link.includes("..") &&
    !link.includes("%")
  )
    return link;
  try {
    const u = new URL(link);
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return supabase &&
      u.origin === new URL(supabase).origin &&
      !u.username &&
      !u.password &&
      (u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(u.hostname))) &&
      u.pathname.startsWith("/storage/v1/object/public/media/")
      ? link
      : "";
  } catch {
    return "";
  }
}
export function storeLink(
  value: unknown,
  store: "appStore" | "googlePlay" | "appGallery",
): string {
  const link = safeLink(value);
  try {
    const u = new URL(link);
    const host = {
      appStore: "apps.apple.com",
      googlePlay: "play.google.com",
      appGallery: "appgallery.huawei.com",
    }[store];
    return u.hostname === host ? link : "";
  } catch {
    return "";
  }
}
export function normalizePresentation(value: unknown): Presentation {
  const root = obj(value),
    h = obj(root.hero),
    s = obj(root.showcase),
    d = obj(root.download),
    defaults = defaultPresentation;
  const rawScreens = Array.isArray(s.screens)
    ? s.screens
    : defaults.showcase.screens;
  const ids = new Set<string>();
  const screens = rawScreens.slice(0, 8).map((value, index) => {
    const row = obj(value);
    let id = text(row.id, `screen-${index}`, 80);
    if (!id || ids.has(id)) id = `screen-${index}`;
    while (ids.has(id)) id += "-copy";
    ids.add(id);
    return {
      id,
      image: safeImage(row.image),
      title: pair(row.title, { ar: "شاشة التطبيق", en: "App screen" }),
      description: pair(row.description, { ar: "", en: "" }),
      visible: row.visible !== false,
      preview: row.preview !== false,
    };
  });
  return {
    programs: {
      ids: [
        ...new Set(
          (Array.isArray(obj(root.programs).ids)
            ? (obj(root.programs).ids as unknown[])
            : []
          ).filter(
            (id): id is string =>
              typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id),
          ),
        ),
      ].slice(0, 12),
      title: pair(obj(root.programs).title, defaults.programs.title),
      description: pair(
        obj(root.programs).description,
        defaults.programs.description,
      ),
    },
    pages: Object.fromEntries(
      (["partner", "careers"] as const).map((key) => {
        const source = obj(obj(root.pages)[key]),
          fallback = defaultPages[key];
        return [
          key,
          {
            title: pair(source.title, fallback.title),
            emphasis: pair(source.emphasis, fallback.emphasis),
            description: pair(source.description, fallback.description),
            faqs: (Array.isArray(source.faqs) ? source.faqs : fallback.faqs)
              .slice(0, 30)
              .map((f, i) => {
                const row = obj(f);
                return {
                  id: String(i),
                  question: pair(row.question, { ar: "", en: "" }),
                  answer: pair(row.answer, { ar: "", en: "" }),
                };
              }),
          },
        ];
      }),
    ) as Presentation["pages"],
    navigation: {
      partnerVisible: obj(root.navigation).partnerVisible !== false,
      partnerLabel: pair(
        obj(root.navigation).partnerLabel,
        defaultPresentation.navigation.partnerLabel,
      ),
    },
    sections: normalizeSections(root.sections),
    hero: {
      focusX: Math.max(0, Math.min(100, Number(h.focusX ?? 50) || 0)),
      focusY: Math.max(0, Math.min(100, Number(h.focusY ?? 50) || 0)),
      mode: h.mode === "photo" ? "photo" : "phones",
      frontImage: safeImage(h.frontImage) || defaults.hero.frontImage,
      backImage: safeImage(h.backImage) || defaults.hero.backImage,
      frontAlt: pair(h.frontAlt, defaults.hero.frontAlt),
      backAlt: pair(h.backAlt, defaults.hero.backAlt),
      title: pair(h.title, defaults.hero.title),
      description: pair(h.description, defaults.hero.description),
      eyebrow: pair(h.eyebrow, defaults.hero.eyebrow),
      image: safeImage(h.image),
      imageAlt: pair(h.imageAlt, defaults.hero.imageAlt),
      button: pair(h.button, defaults.hero.button),
      href: safeLink(h.href === undefined ? defaults.hero.href : h.href),
    },
    showcase: {
      title: pair(s.title, defaults.showcase.title),
      description: pair(s.description, defaults.showcase.description),
      button: pair(s.button, defaults.showcase.button),
      href: safeLink(s.href === undefined ? defaults.showcase.href : s.href),
      visible: s.visible !== false,
      screens,
    },
    download: {
      title: pair(d.title, defaults.download.title),
      description: pair(d.description, defaults.download.description),
      visible: d.visible !== false,
      appStore: storeLink(d.appStore, "appStore"),
      googlePlay: storeLink(d.googlePlay, "googlePlay"),
      appGallery: storeLink(d.appGallery, "appGallery"),
    },
  };
}
export function validatePresentation(value: Presentation): string | null {
  for (const page of Object.values(value.pages))
    if (
      !page.title.ar.trim() ||
      !page.title.en.trim() ||
      page.faqs.some(
        (f) =>
          !f.question.ar.trim() ||
          !f.question.en.trim() ||
          !f.answer.ar.trim() ||
          !f.answer.en.trim(),
      )
    )
      return "أكمل عناوين الصفحات والأسئلة والأجوبة باللغتين / Complete bilingual page titles and FAQs.";
  for (const section of Object.values(value.sections))
    if (
      section.visible &&
      (!section.title.ar.trim() || !section.title.en.trim())
    )
      return "أكمل عناوين الأقسام الظاهرة باللغتين / Complete visible section titles in both languages.";
  for (const section of [
    value.hero,
    value.showcase,
    value.download,
    value.programs,
  ])
    if (!section.title.ar.trim() || !section.title.en.trim())
      return "أدخل العناوين بالعربية والإنجليزية / Enter Arabic and English titles.";
  for (const image of [value.hero.frontImage, value.hero.backImage])
    if (!safeImage(image))
      return "ارفع صور الجوالين من مكتبة الموقع / Upload phone images through this editor.";
  if (value.hero.image && !safeImage(value.hero.image))
    return "ارفع صورة الواجهة من مكتبة الموقع / Upload the hero image through this editor.";
  for (const section of [value.hero, value.showcase])
    if (section.href && !safeLink(section.href))
      return "رابط الزر غير صالح / Invalid action link.";
  for (const screen of value.showcase.screens)
    if (
      !screen.title.ar.trim() ||
      !screen.title.en.trim() ||
      !safeImage(screen.image)
    )
      return "أكمل صور الشاشات وعناوينها باللغتين / Complete each screen image and bilingual title.";
  for (const key of ["appStore", "googlePlay", "appGallery"] as const)
    if (value.download[key] && !storeLink(value.download[key], key))
      return "استخدم رابط المتجر الرسمي الصحيح / Use the correct official store link.";
  return null;
}

export async function savePresentation(
  client: SupabaseClient,
  value: Presentation,
  publish: boolean,
) {
  if (publish) {
    const error = validatePresentation(value);
    if (error) throw new Error(error);
  }
  void client;
  void value;
  void publish;
  throw new Error(
    "Use the versioned website workflow through /api/admin/website.",
  );
}
