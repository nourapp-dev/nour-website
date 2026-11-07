"use client";

import {
  CircleCheck,
  FileText,
  SlidersHorizontal,
  Tag,
  MessageCircle,
} from "lucide-react";
import type { Language } from "../../data/home";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./HomeCards.module.css";

import { reasons as reasonDefaults } from "../../../src/features/website/home-content-defaults";
const reasonIcons = { FileText, SlidersHorizontal, Tag, MessageCircle };
const reasons = reasonDefaults.map((r) => ({
  ...r,
  icon: reasonIcons[r.icon as keyof typeof reasonIcons],
}));

export default function WhyNourApp({ language }: { language: Language }) {
  const ar = language === "ar";
  const content = usePresentation().sections.why;
  return (
    <section
      id="why-nour"
      className={styles.section}
      dir={ar ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="why-nour-title"
    >
      <div className={"nr-container " + styles.inner}>
        <header className={styles.heading}>
          <span className={styles.kicker}>
            <CircleCheck aria-hidden="true" />
            {ar ? "لماذا نور آب" : "Why NourApp"}
          </span>
          <h2 id="why-nour-title">{content.title[language]}</h2>
          <p>{content.description[language]}</p>
        </header>
        <div className={styles.grid}>
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <article key={reason.id} className={styles.card}>
                <span className={styles.icon}>
                  <Icon aria-hidden="true" />
                </span>
                <div className={styles.copy}>
                  <h3>
                    {content.items.find((i) => i.id === reason.id)?.title[
                      language
                    ] ?? (ar ? reason.titleAr : reason.titleEn)}
                  </h3>
                  <p>
                    {content.items.find((i) => i.id === reason.id)?.description[
                      language
                    ] ?? (ar ? reason.descriptionAr : reason.descriptionEn)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
