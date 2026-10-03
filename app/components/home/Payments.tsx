"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Check,
  Clock3,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { Language } from "../../data/home";
import { paymentMethods } from "../../data/home";
import { WEBSITE_BOOKING_ENABLED, websiteBookingCopy } from "../../../src/core/config/website-booking";

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

export default function Payments({
  language,
}: {
  language: Language;
}) {
  const isArabic = language === "ar";

  const directMethods = paymentMethods.filter(
    (method) => method.type !== "installment",
  );

  const flexibleMethods = paymentMethods.filter(
    (method) => method.type === "installment",
  );

  return (
    <section
      className="nr-payments-premium"
      id="payments"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-payments-title"
    >
      <div className="nr-payments-pattern" aria-hidden="true" />
      <div className="nr-payments-orb nr-payments-orb-blue" aria-hidden="true" />
      <div className="nr-payments-orb nr-payments-orb-gold" aria-hidden="true" />

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
            {isArabic
              ? "وسائل الدفع"
              : "Payment options"}
          </span>

          <h2 id="nr-payments-title">
            {isArabic
              ? "خيارات الدفع لرحلتك"
              : "Payment options for your journey"}
          </h2>

          <p>
            {isArabic
              ? "تعرّف على وسائل الدفع. تتحدد الخيارات المتاحة عند تفعيل الحجز حسب الدولة ومزوّد الدفع."
              : "Explore payment methods. Available options will depend on the country and payment provider when booking opens."}
          </p>
        </motion.header>

        {!WEBSITE_BOOKING_ENABLED ? (
          <p className="nr-payments-availability" role="note">
            <strong>{websiteBookingCopy[language].title}</strong>
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
                  <span>
                    {isArabic ? "الدفع المباشر" : "Direct payment"}
                  </span>
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
                    whileHover={{
                      y: -5,
                      scale: 1.015,
                    }}
                  >
                    <div className="nr-payment-brand-logo">
                      <Image
                        src={method.image}
                        alt={
                          isArabic
                            ? method.nameAr
                            : method.nameEn
                        }
                        width={160}
                        height={70}
                      />
                    </div>

                    <div className="nr-payment-brand-meta">
                      <strong>
                        {isArabic
                          ? method.nameAr
                          : method.nameEn}
                      </strong>
                      <span>
                        {isArabic
                          ? "دفع مباشر"
                          : "Direct payment"}
                      </span>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>

            {flexibleMethods.length > 0 ? (
              <div className="nr-payments-group nr-payments-flex-group">
                <div className="nr-payments-group-heading">
                  <div>
                    <span>
                      {isArabic ? "الدفع المرن" : "Flexible payment"}
                    </span>
                    <small>
                      {isArabic
                        ? "قسّم قيمة الحجز حسب الأهلية والشروط"
                        : "Split eligible bookings subject to provider terms"}
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
                      whileHover={{
                        y: -5,
                        scale: 1.015,
                      }}
                    >
                      <span className="nr-payment-flex-badge">
                        {isArabic ? "دفع مرن" : "Flexible"}
                      </span>

                      <div className="nr-payment-brand-logo">
                        <Image
                          src={method.image}
                          alt={
                            isArabic
                              ? method.nameAr
                              : method.nameEn
                          }
                          width={160}
                          height={70}
                        />
                      </div>

                      <div className="nr-payment-brand-meta">
                        <strong>
                          {isArabic
                            ? method.nameAr
                            : method.nameEn}
                        </strong>
                        <span>
                          {isArabic
                            ? "حسب الأهلية والشروط"
                            : "Subject to eligibility"}
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>
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
                <span><ShieldCheck /></span>
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
                <span><Sparkles /></span>
                <div>
                  <strong>
                    {isArabic ? "خيارات واضحة" : "Clear options"}
                  </strong>
                  <small>
                    {isArabic
                      ? "اعرف وسيلة الدفع قبل الحجز"
                      : "Know your payment method before checkout"}
                  </small>
                </div>
              </div>

              <div>
                <span><Clock3 /></span>
                <div>
                  <strong>
                    {isArabic ? "دفع مرن" : "Flexible payment"}
                  </strong>
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

      <style jsx global>{`
        .nr-payments-availability {
          display: grid;
          gap: 6px;
          margin: 0 0 24px;
          padding: 16px 20px;
          border: 1px solid var(--nr-border);
          border-inline-start: 4px solid #ffc313;
          border-radius: 14px;
          background: var(--nr-card);
          color: var(--nr-text);
          font-size: 14px;
          line-height: 1.7;
        }

        .nr-payments-premium {
          position: relative;
          overflow: hidden;
          padding: 94px 0 100px;
          background:
            radial-gradient(
              circle at 10% 20%,
              rgba(23, 111, 232, 0.11),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 78%,
              rgba(255, 195, 19, 0.1),
              transparent 23%
            ),
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--nr-soft) 86%, #ffffff),
              color-mix(in srgb, var(--nr-bg) 96%, #eef6ff)
            );
          scroll-margin-top: 105px;
        }

        .nr-payments-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(
              rgba(23, 111, 232, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(23, 111, 232, 0.04) 1px,
              transparent 1px
            );
          background-size: 52px 52px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            #000 15%,
            #000 86%,
            transparent
          );
        }

        .nr-payments-orb {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(28px);
        }

        .nr-payments-orb-blue {
          inset-inline-start: -190px;
          top: -170px;
          background: rgba(23, 111, 232, 0.14);
        }

        .nr-payments-orb-gold {
          inset-inline-end: -190px;
          bottom: -190px;
          background: rgba(255, 195, 19, 0.13);
        }

        .nr-payments-inner {
          position: relative;
          z-index: 2;
        }

        .nr-payments-heading {
          width: min(900px, 100%);
          margin: 0 auto 40px;
          text-align: center;
        }

        .nr-payments-kicker {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          gap: 8px;
          padding-inline: 15px;
          border: 1px solid rgba(23, 111, 232, 0.15);
          border-radius: 999px;
          color: var(--nr-blue);
          background: color-mix(
            in srgb,
            var(--nr-card) 86%,
            rgba(23, 111, 232, 0.08)
          );
          box-shadow: 0 12px 28px rgba(23, 111, 232, 0.08);
          font-size: 12px;
          font-weight: 900;
          backdrop-filter: blur(12px);
        }

        .nr-payments-kicker svg {
          width: 17px;
          height: 17px;
          color: var(--nr-gold);
        }

        .nr-payments-heading h2 {
          margin: 18px auto 14px;
          color: var(--nr-text);
          font-size: clamp(36px, 4.4vw, 56px);
          line-height: 1.15;
          letter-spacing: -0.025em;
          text-wrap: balance;
        }

        .nr-payments-heading p {
          max-width: 760px;
          margin: 0 auto;
          color: var(--nr-muted);
          font-size: 15px;
          line-height: 1.82;
        }

        .nr-payments-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.7fr);
          gap: 18px;
          align-items: stretch;
        }

        .nr-payments-methods-panel,
        .nr-payments-trust-panel {
          border: 1px solid var(--nr-border);
          border-radius: 28px;
          background:
            linear-gradient(
              145deg,
              color-mix(in srgb, var(--nr-card) 94%, transparent),
              color-mix(in srgb, var(--nr-card) 83%, transparent)
            );
          box-shadow:
            0 24px 60px rgba(18, 67, 130, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nr-payments-methods-panel {
          padding: 22px;
        }

        .nr-payments-group + .nr-payments-group {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid var(--nr-border);
        }

        .nr-payments-group-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .nr-payments-group-heading span,
        .nr-payments-group-heading small {
          display: block;
        }

        .nr-payments-group-heading span {
          color: var(--nr-text);
          font-size: 14px;
          font-weight: 900;
        }

        .nr-payments-group-heading small {
          margin-top: 3px;
          color: var(--nr-muted);
          font-size: 9px;
          line-height: 1.5;
        }

        .nr-payments-group-heading > svg {
          width: 22px;
          height: 22px;
          color: var(--nr-blue);
        }

        .nr-payments-flex-group
          .nr-payments-group-heading
          > svg {
          color: var(--nr-gold);
        }

        .nr-payments-logo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .nr-payment-brand-card {
          position: relative;
          min-height: 112px;
          display: grid;
          grid-template-columns: 98px minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          padding: 13px;
          overflow: hidden;
          border: 1px solid var(--nr-border);
          border-radius: 18px;
          background: color-mix(in srgb, var(--nr-card) 82%, transparent);
          transition:
            border-color 0.22s ease,
            box-shadow 0.22s ease;
        }

        .nr-payment-brand-card:hover {
          border-color: rgba(23, 111, 232, 0.25);
          box-shadow: 0 16px 34px rgba(18, 67, 130, 0.09);
        }

        .nr-payment-brand-flexible:hover {
          border-color: rgba(255, 195, 19, 0.38);
        }

        .nr-payment-brand-logo {
          min-height: 72px;
          display: grid;
          place-items: center;
          padding: 10px;
          border: 1px solid color-mix(in srgb, var(--nr-border) 88%, transparent);
          border-radius: 14px;
          background: #ffffff;
        }

        .nr-payment-brand-logo img {
          width: 100%;
          max-width: 118px;
          height: 48px;
          object-fit: contain;
        }

        .nr-payment-brand-meta {
          min-width: 0;
        }

        .nr-payment-brand-meta strong,
        .nr-payment-brand-meta span {
          display: block;
        }

        .nr-payment-brand-meta strong {
          color: var(--nr-text);
          font-size: 13px;
          line-height: 1.5;
        }

        .nr-payment-brand-meta span {
          margin-top: 4px;
          color: var(--nr-muted);
          font-size: 9px;
          line-height: 1.45;
        }

        .nr-payment-flex-badge {
          position: absolute;
          top: 8px;
          inset-inline-end: 8px;
          z-index: 2;
          min-height: 23px;
          display: inline-flex;
          align-items: center;
          padding-inline: 8px;
          border: 1px solid rgba(255, 195, 19, 0.28);
          border-radius: 999px;
          color: #9b7200;
          background: rgba(255, 195, 19, 0.11);
          font-size: 7px;
          font-weight: 900;
        }

        .nr-payments-trust-panel {
          position: relative;
          overflow: hidden;
          padding: 27px;
        }

        .nr-payments-trust-panel::before {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          inset-inline-end: -105px;
          top: -105px;
          border-radius: 50%;
          background: rgba(23, 111, 232, 0.1);
        }

        .nr-payments-trust-icon {
          position: relative;
          z-index: 2;
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(23, 111, 232, 0.16);
          border-radius: 18px;
          color: var(--nr-blue);
          background: color-mix(
            in srgb,
            var(--nr-blue) 9%,
            var(--nr-card)
          );
          box-shadow: 0 14px 32px rgba(23, 111, 232, 0.11);
        }

        .nr-payments-trust-icon svg {
          width: 26px;
          height: 26px;
        }

        .nr-payments-trust-eyebrow {
          position: relative;
          z-index: 2;
          display: block;
          margin-top: 20px;
          color: var(--nr-blue);
          font-size: 9px;
          font-weight: 900;
        }

        .nr-payments-trust-panel h3 {
          position: relative;
          z-index: 2;
          margin: 8px 0 10px;
          color: var(--nr-text);
          font-size: clamp(24px, 2.4vw, 34px);
          line-height: 1.25;
          text-wrap: balance;
        }

        .nr-payments-trust-panel > p {
          position: relative;
          z-index: 2;
          margin: 0;
          color: var(--nr-muted);
          font-size: 12px;
          line-height: 1.75;
        }

        .nr-payments-trust-list {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 9px;
          margin-top: 22px;
        }

        .nr-payments-trust-list > div {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--nr-border);
        }

        .nr-payments-trust-list > div:last-child {
          border-bottom: 0;
        }

        .nr-payments-trust-list > div > span {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: var(--nr-blue);
          background: color-mix(in srgb, var(--nr-blue) 8%, var(--nr-card));
        }

        .nr-payments-trust-list svg {
          width: 19px;
          height: 19px;
        }

        .nr-payments-trust-list strong,
        .nr-payments-trust-list small {
          display: block;
        }

        .nr-payments-trust-list strong {
          color: var(--nr-text);
          font-size: 11px;
        }

        .nr-payments-trust-list small {
          margin-top: 2px;
          color: var(--nr-muted);
          font-size: 8px;
          line-height: 1.45;
        }

        .nr-payments-security-note {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 17px;
          padding: 11px 12px;
          border: 1px solid rgba(38, 215, 149, 0.17);
          border-radius: 13px;
          color: #1b7657;
          background: rgba(38, 215, 149, 0.07);
          font-size: 8px;
          line-height: 1.5;
          font-weight: 800;
        }

        .nr-payments-security-note svg {
          width: 15px;
          height: 15px;
          flex: 0 0 auto;
          margin-top: 1px;
        }

        html[data-theme="dark"] .nr-payments-premium {
          background:
            radial-gradient(
              circle at 10% 20%,
              rgba(23, 111, 232, 0.16),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 78%,
              rgba(255, 195, 19, 0.08),
              transparent 23%
            ),
            linear-gradient(180deg, #07182c, #0a213d);
        }

        html[data-theme="dark"] .nr-payments-methods-panel,
        html[data-theme="dark"] .nr-payments-trust-panel {
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.07),
              rgba(255, 255, 255, 0.035)
            );
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 24px 62px rgba(0, 0, 0, 0.23),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        html[data-theme="dark"] .nr-payment-brand-card {
          background: rgba(255, 255, 255, 0.035);
          border-color: rgba(255, 255, 255, 0.08);
        }

        html[data-theme="dark"] .nr-payment-brand-logo {
          border-color: rgba(255, 255, 255, 0.08);
        }

        html[data-theme="dark"] .nr-payments-security-note {
          color: #8ce9c4;
        }

        @media (max-width: 1000px) {
          .nr-payments-layout {
            grid-template-columns: 1fr;
          }

          .nr-payments-trust-panel {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            column-gap: 18px;
          }

          .nr-payments-trust-icon {
            grid-row: span 3;
          }

          .nr-payments-trust-eyebrow,
          .nr-payments-trust-panel h3,
          .nr-payments-trust-panel > p {
            grid-column: 2;
          }

          .nr-payments-trust-list,
          .nr-payments-security-note {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 680px) {
          .nr-payments-premium {
            padding: 68px 0 74px;
          }

          .nr-payments-heading {
            margin-bottom: 30px;
          }

          .nr-payments-heading h2 {
            font-size: clamp(32px, 9.5vw, 42px);
          }

          .nr-payments-heading p {
            font-size: 14px;
          }

          .nr-payments-methods-panel {
            padding: 14px;
            border-radius: 22px;
          }

          .nr-payments-logo-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .nr-payment-brand-card {
            min-height: 96px;
            grid-template-columns: 82px minmax(0, 1fr);
            gap: 11px;
            padding: 10px;
          }

          .nr-payment-brand-logo {
            min-height: 64px;
            padding: 8px;
          }

          .nr-payment-brand-logo img {
            height: 42px;
          }

          .nr-payments-trust-panel {
            display: block;
            padding: 21px;
            border-radius: 22px;
          }

          .nr-payments-trust-eyebrow {
            margin-top: 16px;
          }

          .nr-payments-trust-panel h3 {
            font-size: 26px;
          }
        }

        @media (max-width: 420px) {
          .nr-payments-heading h2 {
            font-size: clamp(30px, 9vw, 37px);
          }

          .nr-payment-brand-card {
            grid-template-columns: 76px minmax(0, 1fr);
          }

          .nr-payment-brand-meta strong {
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-payment-brand-card {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}