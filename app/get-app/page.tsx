import AppDownloadClient from "./AppDownloadClient";
import { programPageMetadata } from "../../src/features/programs/utils/program-metadata";
import { parsePublicLanguage } from "../../src/core/i18n/public-language";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = parsePublicLanguage((await searchParams).lang) ?? "ar";
  return programPageMetadata({ path: "/get-app", language, title: language === "ar" ? "تطبيق نور آب" : "Nour app", description: language === "ar" ? "التطبيق قريبًا. الحجز عبر الموقع متوقف." : "App coming soon. Website booking is paused." });
}
export default AppDownloadClient;
