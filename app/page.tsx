import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { parsePublicLanguage } from "../src/core/i18n/public-language";
import { getPublicServerSettings, getServerTextSetting } from "./metadata-settings";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  const language = parsePublicLanguage((await searchParams).lang) ?? "ar";
  const settings = await getPublicServerSettings();
  const title = getServerTextSetting(settings, `seo.meta_title_${language}`, language === "ar" ? "نور آب | خدمات وبرامج العمرة" : "NourApp | Umrah Services");
  const description = getServerTextSetting(settings, `seo.meta_description_${language}`, language === "ar" ? "استعرض برامج العمرة وتفاصيل الخدمات. الحجز عبر الموقع متوقف، والتطبيق قريبًا." : "Explore Umrah programs and service details. Website booking is paused; the app is coming soon.");
  const canonical = `/?lang=${language}`;
  const image = "/images/site/nour-hero-brand-background-1920x900.webp";
  return {
    title: { absolute: title }, description,
    alternates: { canonical, languages: { ar: "/?lang=ar", en: "/?lang=en" } },
    openGraph: { type: "website", url: canonical, title, description, siteName: "NourApp", locale: language === "ar" ? "ar_SA" : "en_US", images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default HomeClient;
