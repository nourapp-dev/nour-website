import type { Metadata } from "next";
import type { PublicLanguage } from "../../../core/i18n/public-language";

export function programPageMetadata({ path, language, title, description, image, available = true }: {
  path: string; language: PublicLanguage; title: string; description: string; image?: string | null; available?: boolean;
}): Metadata {
  const canonical = `${path}?lang=${language}`;
  const images = [{ url: image || "/images/site/v-logo.png", alt: title }];
  return {
    title: { absolute: `${title} | NourApp` }, description,
    alternates: { canonical, languages: { ar: `${path}?lang=ar`, en: `${path}?lang=en` } },
    openGraph: { type: "website", title, description, url: canonical, siteName: "NourApp", locale: language === "ar" ? "ar_SA" : "en_US", images },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: images.map(item => item.url) },
    robots: { index: available, follow: true },
  };
}
