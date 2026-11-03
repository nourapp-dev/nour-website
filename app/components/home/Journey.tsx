"use client";

import type { HomeCopy, Language } from "../../data/home";
import styles from "./HomeCards.module.css";

type Props = { t: HomeCopy; language: Language };

export default function Journey({ t, language }: Props) {
  const isArabic = language === "ar";
  return (
    <section className={styles.section} id="journey" dir={isArabic ? "rtl" : "ltr"} lang={language} aria-labelledby="nr-journey-title">
      <div className={"nr-container " + styles.inner}>
        <header className={styles.heading}>
          <span className={styles.kicker}><RouteIcon />{t.journeyLabel}</span>
          <h2 id="nr-journey-title">{t.journeyTitle}</h2>
          <p>{t.journeyText}</p>
        </header>
        <div className={styles.grid}>
          {t.journeySteps.map((step, index) => (
            <article className={styles.card} key={step.number}>
              <span className={styles.icon}>{getJourneyIcon(index)}</span>
              <div className={styles.copy}>
                <span className={styles.step}>{isArabic ? "الخطوة" : "Step"} <bdi>{step.number}</bdi></span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getJourneyIcon(index: number) {
  const icons = [
    <SearchIcon key="search" />,
    <CompareIcon key="compare" />,
    <CheckIcon key="check" />,
    <SupportIcon key="support" />,
  ];

  return icons[index % icons.length];
}

function RouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h3c4 0 5-2 5-5V8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" strokeLinecap="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M4 7h13M14 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 17H7M10 14l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
      <path d="M4 13a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2v2ZM20 13a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2v2Z" />
      <path d="M17 17c-.7 2-2.3 3-5 3" strokeLinecap="round" />
    </svg>
  );
}
