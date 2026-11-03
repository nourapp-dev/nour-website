"use client";
import Image from "next/image";
import AppBookingLink from "../../components/AppBookingLink";
import ProgramSearch from "../../components/home/ProgramSearch";
import type { HomeCopy } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";
import { usePresentation } from "../../../src/features/website/usePresentation";

export default function Hero({ t, presentation }: { t: HomeCopy; presentation?: Presentation }) {
  const language = t.lang === "English" ? "ar" : "en";
  const ar = language === "ar";
  const { hero } = usePresentation(presentation);
  return <section id="home" className="nour-home-hero" dir={ar ? "rtl" : "ltr"}>
    <div className="nour-home-hero-copy">
      <span className="nour-home-eyebrow">{hero.eyebrow[language]}</span>
      <h1>{hero.title[language]}</h1>
      <p>{ar ? "استعرض برامج العمرة وتفاصيل الإقامة والنقل هنا، وتابع الحجز عبر تطبيق نور آب." : "Explore Umrah programs, accommodation and transport here, then continue booking through the Nour app."}</p>
      <AppBookingLink language={language} />
      <ProgramSearch language={language} />
    </div>
    <figure className="nour-home-photo">
      <Image src={hero.image || "/images/site/haram-statistics-bg.jpg"} alt={hero.image ? hero.imageAlt[language] : (ar ? "المسجد الحرام في مكة المكرمة" : "The Holy Mosque in Makkah")} fill sizes="(max-width: 768px) 100vw, 45vw" priority unoptimized />
      <figcaption>{ar ? "استعد لرحلتك بمعلومات واضحة" : "Prepare for your journey with clear information"}</figcaption>
    </figure>
  </section>;
}
