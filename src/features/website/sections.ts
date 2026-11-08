import { copy } from "../../../app/data/home";
import { services, reasons, priorities } from "./home-content-defaults";
export type Localized = { ar: string; en: string };
export type TextSection = {
  visible: boolean;
  title: Localized;
  description: Localized;
  items: { id: string; title: Localized; description: Localized }[];
};
export const sectionKeys = [
  "services",
  "map",
  "journey",
  "why",
  "payments",
  "priorities",
] as const;
export type TextSectionKey = (typeof sectionKeys)[number];
const pair = (ar: string, en: string) => ({ ar, en });
export const defaultSections: Record<TextSectionKey, TextSection> = {
  priorities: {
    visible: true,
    title: pair(
      "رؤية تنمو لخدمة ضيوف الرحمن",
      "A growing vision for serving the Guests of Allah",
    ),
    description: pair(
      "أولويات تساعدك على استكشاف البرامج وفهم خدماتها والتواصل معنا.",
      "Priorities that help you explore programs, understand their services and contact us.",
    ),
    items: priorities.map((p, i) => ({
      id: String(i),
      title: pair(p.labelAr, p.labelEn),
      description: pair(p.descriptionAr, p.descriptionEn),
    })),
  },
  services: {
    visible: true,
    title: pair(
      "رحلة عمرة متكاملة، من التخطيط حتى العودة",
      "A complete Umrah journey, from planning to return",
    ),
    description: pair(
      "برامج، تأشيرات، سكن، نقل وإرشاد ضمن تجربة رقمية واحدة تساعدك على مقارنة الخدمات والتخطيط لرحلتك بسهولة.",
      "Programs, visas, accommodation, transport, and guidance in one digital experience to help you compare services and plan your journey.",
    ),
    items: services.map((s) => ({
      id: s.icon,
      title: pair(s.titleAr, s.titleEn),
      description: pair(s.textAr, s.textEn),
    })),
  },
  map: {
    visible: true,
    title: pair("من أين تبدأ رحلتك؟", "Where does your journey begin?"),
    description: pair(
      "اختر نقطة الانطلاق واستعرض البرامج والمواعيد المنشورة.",
      "Choose your origin and explore published programs and departures.",
    ),
    items: [],
  },
  journey: {
    visible: true,
    title: pair(copy.ar.journeyTitle, copy.en.journeyTitle),
    description: pair(copy.ar.journeyText, copy.en.journeyText),
    items: copy.ar.journeySteps.map((s, i) => ({
      id: String(i),
      title: pair(s.title, copy.en.journeySteps[i].title),
      description: pair(s.text, copy.en.journeySteps[i].text),
    })),
  },
  why: {
    visible: true,
    title: pair("رحلة أوضح مع نور آب", "A clearer journey with NourApp"),
    description: pair(
      "استعرض البرامج، وافهم تفاصيلها، واختر ما يناسبك.",
      "Explore programs, understand the details and find what suits you.",
    ),
    items: reasons.map((r) => ({
      id: r.id,
      title: pair(r.titleAr, r.titleEn),
      description: pair(r.descriptionAr, r.descriptionEn),
    })),
  },
  payments: {
    visible: true,
    title: pair("وسائل الدفع", "Payment methods"),
    description: pair(
      "تعرّف على وسائل الدفع. تتحدد الخيارات المتاحة عند تفعيل الحجز حسب الدولة ومزوّد الدفع.",
      "Explore payment methods. Available options will depend on the country and payment provider when booking opens.",
    ),
    items: [],
  },
};
export function normalizeSections(
  value: unknown,
): Record<TextSectionKey, TextSection> {
  const obj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  const localized = (v: unknown, f: Localized) => {
    const o = obj(v);
    return {
      ar: typeof o.ar === "string" ? o.ar.slice(0, 1600) : f.ar,
      en: typeof o.en === "string" ? o.en.slice(0, 1600) : f.en,
    };
  };
  const root = obj(value);
  return Object.fromEntries(
    sectionKeys.map((key) => {
      const fallback = defaultSections[key],
        s = obj(root[key]);
      const items = Array.isArray(s.items) ? s.items : [];
      return [
        key,
        {
          visible: s.visible !== false,
          title: localized(s.title, fallback.title),
          description: localized(s.description, fallback.description),
          items: fallback.items.map((item) => {
            const source = obj(items.find((i) => obj(i).id === item.id));
            return {
              ...item,
              title: localized(source.title, item.title),
              description: localized(source.description, item.description),
            };
          }),
        },
      ];
    }),
  ) as Record<TextSectionKey, TextSection>;
}
