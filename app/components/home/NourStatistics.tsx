"use client";

import { motion } from "framer-motion";
import styles from "./NourStatistics.module.css";
import { fadeUp, type Language } from "../../data/home";

// Descriptive priorities, not unsupported customer counts or service guarantees.
const priorities = [
  { valueAr: "اطّلاع", valueEn: "Browse", labelAr: "البرامج", labelEn: "Programs", descriptionAr: "استعرض بلد الانطلاق والمدة وتفاصيل البرنامج المنشورة.", descriptionEn: "Browse published departure countries, durations and program details." },
  { valueAr: "وضوح", valueEn: "Clarity", labelAr: "الخدمات", labelEn: "Services", descriptionAr: "راجع معلومات الإقامة والنقل وما يشمله كل برنامج.", descriptionEn: "Review accommodation, transport and each program's inclusions." },
  { valueAr: "خيارات", valueEn: "Explore", labelAr: "الوجهات", labelEn: "Origins", descriptionAr: "ابحث حسب بلد الانطلاق وتعرّف على الخيارات المنشورة.", descriptionEn: "Search by departure country and explore published options." },
  { valueAr: "تواصل", valueEn: "Contact", labelAr: "الاستفسارات", labelEn: "Enquiries", descriptionAr: "تواصل معنا إذا احتجت إلى توضيح قبل اتخاذ قرارك.", descriptionEn: "Contact us if you need clarification before deciding." },
];

export default function Statistics({ language }: { language: Language }) {
  return (
    <section
      className={`nr-statistics nr-statistics-haram ${styles.section}`}
      aria-labelledby="nr-statistics-title"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={styles.photo}
        aria-hidden="true"
      />

      <div
        className={styles.overlay}
        aria-hidden="true"
      />

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
            {language === "ar"
              ? "ما نركز عليه"
              : "Our focus"}
          </span>

          <h2 id="nr-statistics-title">
            {language === "ar"
              ? "رؤية تنمو لخدمة ضيوف الرحمن"
              : "A growing vision for serving the Guests of Allah"}
          </h2>

          <p>
            {language === "ar"
              ? "أولويات تساعدك على استكشاف البرامج وفهم خدماتها والتواصل معنا."
              : "Priorities that help you explore programs, understand their services and contact us."}
          </p>
        </motion.div>

        <div className="nr-statistics-grid">
          {priorities.map(
            (stat, index) => (
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
                      delay:
                        index * 0.08,
                    },
                  },
                }}
              >
                <span
                  className="nr-statistic-index"
                  aria-hidden="true"
                >
                  {String(
                    index + 1,
                  ).padStart(2, "0")}
                </span>

                <strong
                  className="nr-statistic-value"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {language === "ar" ? stat.valueAr : stat.valueEn}
                </strong>

                <h3>
                  {language === "ar"
                    ? stat.labelAr
                    : stat.labelEn}
                </h3>

                <p>
                  {language === "ar"
                    ? stat.descriptionAr
                    : stat.descriptionEn}
                </p>
              </motion.article>
            ),
          )}
        </div>
      </div>


    </section>
  );
}