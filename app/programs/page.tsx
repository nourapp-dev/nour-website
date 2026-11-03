import ProgramCatalogClient from "./ProgramCatalogClient";
import { parsePublicLanguage } from "../../src/core/i18n/public-language";
import { programPageMetadata } from "../../src/features/programs/utils/program-metadata";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = parsePublicLanguage((await searchParams).lang) ?? "ar";
  return programPageMetadata({ path: "/programs", language,
    title: language === "ar" ? "برامج العمرة" : "Umrah programs",
    description: language === "ar" ? "استعرض برامج العمرة وقارن المدة والإقامة والنقل والأسعار المعلنة. الحجز عبر الموقع متوقف مؤقتًا." : "Explore Umrah programs, duration, accommodation, transport and published prices. Website booking is temporarily paused." });
}

export default function ProgramsPage() { return <ProgramCatalogClient />; }
