import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";

import QueryProvider from "../src/components/providers/QueryProvider";
import PrivacyPreferences from "./components/PrivacyPreferences";
import VisitorAnalyticsTracker from "../src/features/analytics/components/VisitorAnalyticsTracker";
import { getConfiguredSiteOrigin } from "../src/core/config/site-url";
import { LanguageProvider } from "../src/core/i18n";

import "../src/styles/tokens.css";
import "./globals.css";
import "./nour-redesign.css";
import "./modern-upgrade.css";
import "./ui-consistency.css";
import "./accessibility.css";

import {
  getPublicServerSettings,
  getServerTextSetting,
} from "./metadata-settings";

const cairo = localFont({
  src: [
    { path: "./fonts/cairo-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/cairo-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/cairo-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/cairo-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/cairo-800.ttf", weight: "800", style: "normal" }
  ],
  variable: "--font-cairo",
  display: "swap",
});

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicServerSettings();

  const titleAr = getServerTextSetting(
    settings,
    "seo.meta_title_ar",
    "نور آب | خدمات وبرامج العمرة",
  );
  const titleEn = getServerTextSetting(
    settings,
    "seo.meta_title_en",
    "NourApp | Umrah Services",
  );
  const descriptionAr = getServerTextSetting(
    settings,
    "seo.meta_description_ar",
    "منصة نور آب الرقمية لخدمات وبرامج العمرة.",
  );
  const descriptionEn = getServerTextSetting(
    settings,
    "seo.meta_description_en",
    "NourApp digital platform for Umrah programs and services.",
  );
  const settingsSiteUrl = getServerTextSetting(
    settings,
    "contact.website_url",
    "https://nourappglobal.com",
  );
  const siteOrigin = getConfiguredSiteOrigin(settingsSiteUrl);

  return {
    metadataBase: siteOrigin,
    title: {
      default: titleAr,
      template: `%s | ${titleAr}`,
    },
    description: descriptionAr,
    alternates: {
      canonical: "/",
      languages: {
        ar: "/?lang=ar",
        en: "/?lang=en",
      },
    },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      alternateLocale: ["en_US"],
      url: "/",
      siteName: titleAr,
      title: titleAr,
      description: descriptionAr,
    },
    twitter: {
      card: "summary_large_image",
      title: titleEn,
      description: descriptionEn,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={cairo.variable}
        style={{ fontFamily: "var(--font-cairo), sans-serif" }}
      >
        <QueryProvider>
          <LanguageProvider>
            <Suspense fallback={null}>
              <VisitorAnalyticsTracker />
              <PrivacyPreferences />
            </Suspense>
            {children}
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
