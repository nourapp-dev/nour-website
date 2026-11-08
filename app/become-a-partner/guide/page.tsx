import type { Metadata } from "next";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { partnerGuide } from "../../../src/features/applications/partner-guide";
import type { GuideLanguage } from "../../../src/features/applications/guide-reading";
import GuideReader, { type GuideFileSizes } from "./GuideReader";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const displayLanguage = (value: unknown): GuideLanguage => value === "en" ? "en" : "ar";
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const language = displayLanguage((await searchParams).lang);
  return {
    title: partnerGuide[language].title,
    description: language === "ar" ? "دليل نور آب للشريك الدولي لتجهيز ملف التأهيل ومتطلبات الدولة والمستندات، مع قراءة الأقسام وتنزيل قوالب PDF وWord." : "Nour App's international partner guide to qualification, country requirements and supporting documents, with searchable sections and PDF and Word templates.",
    alternates: { canonical: `/become-a-partner/guide?lang=${language}`, languages: { ar: "/become-a-partner/guide?lang=ar", en: "/become-a-partner/guide?lang=en" } },
    ...(process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_UI_PREVIEW === "true" ? { robots: { index: false, follow: false } } : {}),
  };
}
export default async function PartnerGuidePage({ searchParams }: Props) {
  const language = displayLanguage((await searchParams).lang);
  const fileSizes = Object.fromEntries(await Promise.all((["ar", "en"] as const).map(async locale => {
    const downloads = partnerGuide[locale].downloads;
    const size = async (path: string) => { try { return (await stat(join(process.cwd(), "public", path.replace(/^\//, "")))).size; } catch { return null; } };
    const [pdf, word] = await Promise.all([size(downloads.pdf), size(downloads.word)]);
    return [locale, { pdf, word }];
  }))) as GuideFileSizes;
  return <GuideReader initialLanguage={language} fileSizes={fileSizes}/>;
}
