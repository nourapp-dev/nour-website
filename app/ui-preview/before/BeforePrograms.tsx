"use client";
import Image from "next/image";
import Link from "next/link";
import type { Language } from "../../data/home";
import usePublicProgramCatalog from "../../../src/features/programs/hooks/usePublicProgramCatalog";
import { languageHref } from "../../../src/core/i18n/public-language";
import ProgramPriceNote from "../../programs/ProgramPriceNote";
import ProgramSectionState from "../../programs/ProgramSectionState";

export default function ProgramsPreview({ language }: { language: Language }) {
  const ar = language === "ar";
  const { data: programs = [], isLoading, isError, refetch } = usePublicProgramCatalog();
  return <section id="programs" className="nour-home-section" aria-labelledby="home-programs-title">
    <header className="nour-home-section-heading">
      <div><span className="nour-home-eyebrow">{ar ? "برامج العمرة" : "Umrah programs"}</span><h2 id="home-programs-title">{ar ? "ابدأ بالبرنامج المناسب لك" : "Start with the program that suits you"}</h2><p>{ar ? "راجع بلد الانطلاق والمدة والخدمات، ثم افتح التفاصيل." : "Review the departure country, duration and services, then explore the details."}</p></div>
      <Link className="program-action" href={languageHref("/programs", language)}>{ar ? "عرض جميع البرامج" : "View all programs"}</Link>
    </header>
    {isLoading ? <ProgramSectionState language={language} title={ar ? "البرامج" : "Programs"} state="loading" />
      : isError ? <ProgramSectionState language={language} title={ar ? "تعذر تحميل البرامج" : "Programs could not load"} state="error" onRetry={() => void refetch()} />
      : !programs.length ? <ProgramSectionState language={language} title={ar ? "البرامج" : "Programs"} state="empty" />
      : <><ProgramPriceNote language={language} /><div className="nour-home-programs">{programs.slice(0, 3).map(program => {
        const title = ar ? program.titleAr : program.titleEn;
        const href = languageHref("/programs/" + encodeURIComponent(program.slug), language);
        return <article className="nour-home-program" key={program.id}>
          <Link className="nour-home-program-cover" href={href} aria-label={title}>{program.coverUrl ? <Image src={program.coverUrl} alt={title} fill unoptimized sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <span>{ar ? "لا توجد صورة منشورة" : "No published photo"}</span>}</Link>
          <div className="nour-home-program-body"><span>{ar ? program.countryNameAr : program.countryNameEn}</span><h3><Link href={href}>{title}</Link></h3><p>{ar ? program.summaryAr : program.summaryEn}</p>
            <p>{program.durationDays} {ar ? "أيام" : "days"} · {program.durationNights} {ar ? "ليالٍ" : "nights"}</p>
            <p>{ar ? "يبدأ من" : "Starting from"} <strong>{new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }).format(program.basePrice)} {program.currencyCode}</strong></p>
            <Link className="program-action" href={href}>{ar ? "تفاصيل البرنامج" : "Program details"}</Link>
          </div>
        </article>;
      })}</div></>}
  </section>;
}
