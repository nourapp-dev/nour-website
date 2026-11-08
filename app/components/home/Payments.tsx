"use client";
import Image from "next/image";
import { usePresentation } from "../../../src/features/website/usePresentation";
import type { Language } from "../../data/home";
import { paymentMethods } from "../../data/home";
import publicStyles from "../../../src/styles/public-content.module.css";
import styles from "./Payments.module.css";
const logoFrames = {
  Mada: { x: 151, y: 50, width: 898, height: 300, display: 100 },
  Visa: { x: 363, y: 50, width: 474, height: 300, display: 70 },
  Mastercard: { x: 364, y: 50, width: 472, height: 300, display: 72 },
  "Apple Pay": { x: 365, y: 50, width: 469, height: 300, display: 78 },
  Tabby: { x: 224, y: 50, width: 751, height: 299, display: 98 },
  Tamara: { x: 126, y: 50, width: 947, height: 300, display: 108 },
} as const;

function PaymentLogo({
  method,
  isArabic,
}: {
  method: (typeof paymentMethods)[number];
  isArabic: boolean;
}) {
  const frame = logoFrames[method.nameEn];
  const width = frame.width + 16;
  const height = frame.height + 16;
  return (
    <div className="nr-payment-brand-logo">
      <span
        className={
          method.nameEn === "Mada" ? styles.lightSurface : styles.logoSurface
        }
      >
        <span
          className={styles.artwork}
          style={{ width: frame.display, aspectRatio: width + "/" + height }}
        >
          <Image
            src={method.image}
            alt={isArabic ? method.nameAr : method.nameEn}
            width={1200}
            height={400}
            sizes="300px"
            style={{
              position: "absolute",
              maxWidth: "none",
              width: (1200 / width) * 100 + "%",
              height: (400 / height) * 100 + "%",
              left: (-(frame.x - 8) / width) * 100 + "%",
              top: (-(frame.y - 8) / height) * 100 + "%",
            }}
          />
        </span>
      </span>
    </div>
  );
}

export default function Payments({ language }: { language: Language }) {
  const content = usePresentation().sections.payments;
  return (
    <section
      id="payments"
      className={
        publicStyles.surface +
        " " +
        styles.section +
        " nr-payments-before-launch"
      }
      dir={language === "ar" ? "rtl" : "ltr"}
      aria-labelledby="nr-payments-title"
    >
      <div className="nr-container">
        <header className={styles.heading}>
          <h2 id="nr-payments-title" className={publicStyles.sectionTitle}>
            {content.title[language]}
          </h2>
          {content.description[language] && (
            <p className={publicStyles.sectionDescription}>
              {content.description[language]}
            </p>
          )}
        </header>
        <div className={styles.grid + " payment-logos"}>
          {paymentMethods.map((method) => (
            <figure className={styles.logoCard} key={method.nameEn}>
              <PaymentLogo method={method} isArabic={language === "ar"} />
              <figcaption>
                {language === "ar" ? method.nameAr : method.nameEn}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
