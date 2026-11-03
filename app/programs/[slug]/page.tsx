import ProgramDetailsClient from "./ProgramDetailsClient";
import { parsePublicLanguage } from "../../../src/core/i18n/public-language";
import { programPageMetadata } from "../../../src/features/programs/utils/program-metadata";
import { getPublicProgramMetadata } from "../../../src/server/programs/public-program-metadata.server";

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const language = parsePublicLanguage(query.lang) ?? "ar";
  const program = await getPublicProgramMetadata(slug);
  const title = program
    ? (language === "ar" ? program.title_ar || program.title_en : program.title_en || program.title_ar)
    : (language === "ar" ? "تفاصيل البرنامج غير متاحة" : "Program details unavailable");
  return programPageMetadata({ path: `/programs/${encodeURIComponent(slug)}`, language,
    title,
    description: program ? (language === "ar" ? program.summary_ar : program.summary_en) || (language === "ar" ? "اطلع على تفاصيل برنامج العمرة. الحجز عبر الموقع متوقف مؤقتًا." : "Explore this Umrah program. Website booking is temporarily paused.") : (language === "ar" ? "تعذر عرض تفاصيل البرنامج حاليًا." : "Program information is currently unavailable."),
    image: program?.coverUrl, available: Boolean(program) });
}

export default function ProgramPage() { return <ProgramDetailsClient />; }
