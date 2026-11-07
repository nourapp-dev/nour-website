"use client";

import { launchCopy } from "../../../src/core/config/launch-state";
import Image from "next/image";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./Payments.module.css";
import { motion, type Variants } from "framer-motion";
import {
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

import type { Language } from "../../data/home";
import { paymentMethods } from "../../data/home";
import { WEBSITE_BOOKING_ENABLED } from "../../../src/core/config/website-booking";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Existing transparent assets have large internal margins. Frame the artwork in CSS
// without altering provider colors, proportions or original image files.
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
  const isArabic = language === "ar";
  const content = usePresentation().sections.payments;

  const directMethods = paymentMethods.filter(
    (method) => method.type !== "installment",
  );

  const flexibleMethods = paymentMethods.filter(
    (method) => method.type === "installment",
  );

  if (!WEBSITE_BOOKING_ENABLED)
    return (
      <section
        id="payments"
        className="nr-payments-before-launch"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="nr-container">
          <h2>{content.title[language]}</h2>
          <p>{content.description[language]}</p>
          <p>{launchCopy[language].paymentNotice}</p>
          <div className="payment-logos">
            {paymentMethods.map((method) => (
              <figure key={method.nameEn}>
                <Image
                  src={method.image}
                  alt={isArabic ? method.nameAr : method.nameEn}
                  width={150}
                  height={50}
                  style={{ objectFit: "contain" }}
                />
                <figcaption>
                  {isArabic ? method.nameAr : method.nameEn}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <style jsx>{`
          .nr-payments-before-launch {
            padding: 48px 0;
            background: var(--nour-surface);
            color: var(--nour-text-primary);
          }
          p {
            max-width: 800px;
            line-height: 1.9;
          }
          .payment-logos {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
          }
          figure {
            margin: 0;
            padding: 12px;
            background: #fff;
            color: #16324e;
            border: 1px solid #dce5ee;
            border-radius: 10px;
          }
          figcaption {
            text-align: center;
            font-size: 12px;
            margin-top: 6px;
          }
        `}</style>
      </section>
    );
  return (
    <section
      className={"nr-payments-premium " + styles.section}
      id="payments"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-payments-title"
    >
      <div className="nr-payments-pattern" aria-hidden="true" />
      <div
        className="nr-payments-orb nr-payments-orb-blue"
        aria-hidden="true"
      />
      <div
        className="nr-payments-orb nr-payments-orb-gold"
        aria-hidden="true"
      />

      <div className="nr-container nr-payments-inner">
        <motion.header
          className="nr-payments-heading"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.62,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="nr-payments-kicker">
            <CreditCard />
            {isArabic ? "وسائل الدفع" : "Payment options"}
          </span>

          <h2 id="nr-payments-title">{content.title[language]}</h2>

          <p>{content.description[language]}</p>
        </motion.header>

        {!WEBSITE_BOOKING_ENABLED ? (
          <p className="nr-payments-availability" role="note">
            <strong>
              {isArabic
                ? "الحجز والدفع عبر الموقع متوقفان حاليًا"
                : "Website booking and payment are currently paused"}
            </strong>
            <span>
              {isArabic
                ? "وسائل الدفع المعروضة للتعريف فقط؛ الدفع الإلكتروني غير متاح حاليًا عبر الموقع."
                : "Payment methods are shown for information only; online payment is currently unavailable on this website."}
            </span>
          </p>
        ) : null}

        <div className="nr-payments-layout">
          <motion.div
            className="nr-payments-methods-panel"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="nr-payments-group">
              <div className="nr-payments-group-heading">
                <div>
                  <span>{isArabic ? "الدفع المباشر" : "Direct payment"}</span>
                  <small>
                    {isArabic
                      ? "البطاقات والمحافظ الرقمية"
                      : "Cards and digital wallets"}
                  </small>
                </div>

                <ShieldCheck />
              </div>

              <div className="nr-payments-logo-grid">
                {directMethods.map((method) => (
                  <motion.article
                    className="nr-payment-brand-card"
                    key={method.nameEn}
                    variants={cardVariants}
                  >
                    <PaymentLogo method={method} isArabic={isArabic} />

                    <div className="nr-payment-brand-meta">
                      <strong>
                        {isArabic ? method.nameAr : method.nameEn}
                      </strong>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>

            {flexibleMethods.length > 0 ? (
              <div className="nr-payments-group nr-payments-flex-group">
                <div className="nr-payments-group-heading">
                  <div>
                    <span>{isArabic ? "الدفع المرن" : "Flexible payment"}</span>
                    <small>
                      {isArabic ? "خيارات التقسيط" : "Installment options"}
                    </small>
                  </div>

                  <Clock3 />
                </div>

                <div className="nr-payments-logo-grid nr-payments-flex-grid">
                  {flexibleMethods.map((method) => (
                    <motion.article
                      className="nr-payment-brand-card nr-payment-brand-flexible"
                      key={method.nameEn}
                      variants={cardVariants}
                    >
                      <PaymentLogo method={method} isArabic={isArabic} />

                      <div className="nr-payment-brand-meta">
                        <strong>
                          {isArabic ? method.nameAr : method.nameEn}
                        </strong>
                      </div>
                    </motion.article>
                  ))}
                </div>
                <p className={styles.terms}>
                  {isArabic
                    ? "عند تفعيل الحجز، تخضع خيارات التقسيط للأهلية والدولة وشروط مزوّد الدفع."
                    : "When booking opens, installment options depend on eligibility, country and provider terms."}
                </p>
              </div>
            ) : null}
          </motion.div>

          <motion.aside
            className="nr-payments-trust-panel"
            initial={{
              opacity: 0,
              x: isArabic ? -30 : 30,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{
              duration: 0.65,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="nr-payments-trust-icon">
              <LockKeyhole />
            </span>

            <span className="nr-payments-trust-eyebrow">
              {isArabic
                ? "ثقة من لحظة الاختيار"
                : "Confidence from selection to payment"}
            </span>

            <h3>
              {isArabic
                ? "تجربة دفع أبسط وأكثر وضوحًا"
                : "A simpler, clearer payment experience"}
            </h3>

            <p>
              {isArabic
                ? "عند تفعيل الحجز، راجع السعر النهائي ووسائل الدفع المتاحة قبل التأكيد. عرض الشعارات هنا لا يعني تفعيل جميع الوسائل."
                : "When booking opens, review the final price and available payment methods before confirming. Displayed logos do not mean all methods are enabled."}
            </p>

            <div className="nr-payments-trust-list">
              <div>
                <span>
                  <ShieldCheck />
                </span>
                <div>
                  <strong>
                    {isArabic ? "مزوّد الدفع" : "Payment provider"}
                  </strong>
                  <small>
                    {isArabic
                      ? "التوافر حسب الدولة والمزوّد"
                      : "Availability varies by country and provider"}
                  </small>
                </div>
              </div>

              <div>
                <span>
                  <ListChecks aria-hidden="true" />
                </span>
                <div>
                  <strong>{isArabic ? "خيارات واضحة" : "Clear options"}</strong>
                  <small>
                    {isArabic
                      ? "اعرف وسيلة الدفع قبل الحجز"
                      : "Know your payment method before checkout"}
                  </small>
                </div>
              </div>

              <div>
                <span>
                  <Clock3 />
                </span>
                <div>
                  <strong>{isArabic ? "دفع مرن" : "Flexible payment"}</strong>
                  <small>
                    {isArabic
                      ? "حسب التفعيل والأهلية والشروط"
                      : "Subject to activation, eligibility and terms"}
                  </small>
                </div>
              </div>
            </div>

            <div className="nr-payments-security-note">
              <Check />
              <span>
                {isArabic
                  ? "تحقّق من الوسائل المتاحة وشروط مزوّد الدفع عند إتمام الحجز."
                  : "Check available methods and provider terms at checkout."}
              </span>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
