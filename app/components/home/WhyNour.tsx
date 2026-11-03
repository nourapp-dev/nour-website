"use client";

import { CircleCheck, FileText, SlidersHorizontal, Tag, MessageCircle } from "lucide-react";
import type { Language } from "../../data/home";
import styles from "./HomeCards.module.css";

const reasons = [
  {
    id: "details",
    titleAr: "تفاصيل واضحة",
    titleEn: "Clear program details",
    descriptionAr: "راجع المدة والسكن والنقل والخدمات المنشورة لكل برنامج في مكان واحد.",
    descriptionEn: "Review each program’s published duration, accommodation, transport and services in one place.",
    icon: FileText,
  },
  {
    id: "options",
    titleAr: "خيارات يسهل استعراضها",
    titleEn: "Easy-to-browse options",
    descriptionAr: "ابحث عن برامج العمرة وصفِّ الخيارات حسب بلد الانطلاق ومدة الرحلة.",
    descriptionEn: "Find Umrah programs and filter the options by departure country and trip duration.",
    icon: SlidersHorizontal,
  },
  {
    id: "pricing",
    titleAr: "معلومات السعر",
    titleEn: "Price information",
    descriptionAr: "اطّلع على السعر الابتدائي، وما تنشره بيانات البرنامج عن المشمول وغير المشمول.",
    descriptionEn: "See the starting price and the program’s published details about what is included and excluded.",
    icon: Tag,
  },
  {
    id: "contact",
    titleAr: "تواصل واستفسارات",
    titleEn: "Contact and enquiries",
    descriptionAr: "استفسر عن تفاصيل البرامج والخدمات عبر قنوات التواصل الموضّحة في الموقع.",
    descriptionEn: "Ask about programs and services through the contact channels listed on the website.",
    icon: MessageCircle,
  },
];

export default function WhyNourApp({ language }: { language: Language }) {
  const ar = language === "ar";
  return (
    <section id="why-nour" className={styles.section} dir={ar ? "rtl" : "ltr"}
      lang={language} aria-labelledby="why-nour-title">
      <div className={"nr-container " + styles.inner}>
        <header className={styles.heading}>
          <span className={styles.kicker}>
            <CircleCheck aria-hidden="true" />
            {ar ? "لماذا نور آب" : "Why NourApp"}
          </span>
          <h2 id="why-nour-title">{ar ? "رحلة أوضح مع نور آب" : "A clearer journey with NourApp"}</h2>
          <p>{ar
            ? "استعرض البرامج، وافهم تفاصيلها، واختر ما يناسبك."
            : "Explore programs, understand the details and find what suits you."}</p>
        </header>
        <div className={styles.grid}>
          {reasons.map(reason => {
            const Icon = reason.icon;
            return (
              <article key={reason.id} className={styles.card}>
                <span className={styles.icon}><Icon aria-hidden="true" /></span>
                <div className={styles.copy}>
                  <h3>{ar ? reason.titleAr : reason.titleEn}</h3>
                  <p>{ar ? reason.descriptionAr : reason.descriptionEn}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
