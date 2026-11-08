"use client";

import { motion } from "framer-motion";
import styles from "./NourStatistics.module.css";
import { fadeUp, type Language } from "../../data/home";

// Descriptive priorities, not unsupported customer counts or service guarantees.
import { priorities } from "../../../src/features/website/home-content-defaults";
import { usePresentation } from "../../../src/features/website/usePresentation";

export default function Statistics({ language }: { language: Language }) {
  const content = usePresentation().sections.priorities;
  return (
    <section
      className={`nr-statistics nr-statistics-haram ${styles.section}`}
      aria-labelledby="nr-statistics-title"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.photo} aria-hidden="true" />

      <div className={styles.overlay} aria-hidden="true" />

      <div className="nr-container nr-statistics-content">
        <motion.div
          className="nr-statistics-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.3,
          }}
          variants={fadeUp}
        >
          <span className="nr-kicker nr-statistics-kicker">
            {language === "ar" ? "ما نركز عليه" : "Our focus"}
          </span>

          <h2 id="nr-statistics-title">{content.title[language]}</h2>

          <p>{content.description[language]}</p>
        </motion.div>

        <div className="nr-statistics-grid">
          {priorities.map((stat, index) => (
            <motion.article
              key={stat.labelEn}
              className="nr-statistic-card nr-statistic-card-glass"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.25,
              }}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 28,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.55,
                    delay: index * 0.08,
                  },
                },
              }}
            >
              <span className="nr-statistic-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <strong
                className="nr-statistic-value"
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                {language === "ar" ? stat.valueAr : stat.valueEn}
              </strong>

              <h3>
                {content.items[index]?.title[language] ??
                  (language === "ar" ? stat.labelAr : stat.labelEn)}
              </h3>

              <p>
                {content.items[index]?.description[language] ??
                  (language === "ar" ? stat.descriptionAr : stat.descriptionEn)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
