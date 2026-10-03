import type { Metadata } from "next";
import { Suspense } from "react";
import { Cairo } from "next/font/google";
import Script from "next/script";

import QueryProvider from "../src/components/providers/QueryProvider";
import VisitorAnalyticsTracker from "../src/features/analytics/components/VisitorAnalyticsTracker";
import { getConfiguredSiteOrigin } from "../src/core/config/site-url";
import { LanguageProvider } from "../src/core/i18n";

import "../src/styles/tokens.css";
import "./globals.css";
import "./nour-redesign.css";
import "./modern-upgrade.css";
import "./ui-consistency.css";

import {
  getPublicServerSettings,
  getServerTextSetting,
} from "../src/features/settings/services/public-settings.server";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
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
        ar: "/",
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
            </Suspense>
            {children}
          </LanguageProvider>
        </QueryProvider>
        <div
          className="sbc-verify-seal"
          data-token="MndqZ0VDeWVNZ1FTUFdyZnZBVlJhQT09"
          data-position="bottom-left"
        />
        <Script
          src="https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
