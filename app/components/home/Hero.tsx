"use client";
import Image from "next/image";
import ProgramSearch from "./ProgramSearch";
import type { HomeCopy } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./Presentation.module.css";

export default function Hero({
  t,
  presentation,
}: {
  t: HomeCopy;
  presentation?: Presentation;
}) {
  const language = t.lang === "English" ? "ar" : "en";
  const { hero } = usePresentation(presentation);
  return (
    <div className={styles.root}>
      <section
        id="home"
        className={styles.hero}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.eyebrow}>{hero.eyebrow[language]}</span>
            <h1>{hero.title[language]}</h1>
            <p>{hero.description[language]}</p>
            <ProgramSearch language={language} />
            {hero.href && hero.button[language] && (
              <a className={styles.textLink} href={hero.href}>
                {hero.button[language]}{" "}
                <span aria-hidden="true">{language === "ar" ? "←" : "→"}</span>
              </a>
            )}
          </div>
          <div className={styles.visual}>
            {hero.image ? (
              <Image
                className={styles.heroImage}
                src={hero.image}
                alt={hero.imageAlt[language]}
                fill
                sizes="(max-width:760px) 100vw, 45vw"
                unoptimized
                priority
              />
            ) : (
              <div className={styles.brandArt} aria-hidden="true">
                <strong>نــور · NOUR</strong>
                <span>
                  {language === "ar"
                    ? "رفيقك في رحلة السعادة"
                    : "Your happiness journey companion"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
