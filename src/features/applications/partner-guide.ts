import arContent from "./data/partner-guide.ar.json";
import enContent from "./data/partner-guide.en.json";

export type GuideBlock =
  | { kind: "paragraph" | "heading" | "field"; text: string }
  | { kind: "table"; rows: string[][] };
export type GuideDocument = {
  language: string;
  title: string;
  version: string;
  updatedAt: string;
  sections: { id: string; title: string; blocks: GuideBlock[] }[];
};

// Versions reflect the supplied originals. The user accepted Arabic v1.1;
// it is deliberately not relabelled as the English v1.2 release.
const documents: Record<"ar" | "en", GuideDocument> = {
  ar: arContent as GuideDocument,
  en: enContent as GuideDocument,
};
export const partnerGuide = Object.fromEntries(
  (["ar", "en"] as const).map((language) => {
    const document = documents[language];
    const base = `/documents/partners/v${document.version}/${language}/partner-readiness`;
    return [language, { ...document, downloads: { pdf: `${base}.pdf`, word: `${base}.docx` } }];
  }),
) as Record<"ar" | "en", GuideDocument & { downloads: { pdf: string; word: string } }>;
