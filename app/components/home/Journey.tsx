"use client";

import { motion, type Variants } from "framer-motion";
import type { HomeCopy, Language } from "../../data/home";
import { WEBSITE_BOOKING_ENABLED } from "../../../src/core/config/website-booking";

type Props = {
  t: HomeCopy;
  language: Language;
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Journey({ t, language }: Props) {
  const isArabic = language === "ar";

  return (
    <section
      className="nr-journey-premium"
      id="journey"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-journey-title"
    >
      <div className="nr-journey-pattern" aria-hidden="true" />
      <div className="nr-journey-glow nr-journey-glow-blue" aria-hidden="true" />
      <div className="nr-journey-glow nr-journey-glow-gold" aria-hidden="true" />

      <div className="nr-container nr-journey-inner">
        <motion.header
          className="nr-journey-heading"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.64,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="nr-journey-kicker">
            <RouteIcon />
            {t.journeyLabel}
          </span>

          <h2
            id="nr-journey-title"
            lang={isArabic ? "ar" : "en"}
          >
            {t.journeyTitle}
          </h2>

          <p>{t.journeyText}</p>

          <div className="nr-journey-heading-meta" aria-hidden="true">
            <span>{isArabic ? "اختيار" : "Choose"}</span>
            <i />
            <span>{isArabic ? "مقارنة" : "Compare"}</span>
            <i />
            <span>{WEBSITE_BOOKING_ENABLED ? (isArabic ? "تأكيد" : "Confirm") : (isArabic ? "اطّلاع" : "Review")}</span>
            <i />
            <span>{WEBSITE_BOOKING_ENABLED ? (isArabic ? "متابعة" : "Support") : (isArabic ? "تواصل" : "Contact")}</span>
          </div>
        </motion.header>

        <motion.div
          className="nr-journey-timeline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <span className="nr-journey-line" aria-hidden="true" />

          {t.journeySteps.map((step, index) => (
            <motion.article
              className="nr-journey-step-card"
              key={`${step.number}-${step.title}`}
              variants={cardVariants}
              whileHover={{
                y: -10,
                scale: 1.018,
              }}
            >
              <div className="nr-journey-step-top">
                <span className="nr-journey-step-icon">
                  {getJourneyIcon(index)}
                </span>

                <div className="nr-journey-step-meta">
                  <small>
                    {isArabic ? "الخطوة" : "Step"}
                  </small>
                  <span className="nr-journey-step-number">
                    {step.number}
                  </span>
                </div>
              </div>

              <h3>{step.title}</h3>
              <p>{step.text}</p>

              <span className="nr-journey-step-line" aria-hidden="true" />

              {index < t.journeySteps.length - 1 && (
                <span
                  className="nr-journey-connector"
                  aria-hidden="true"
                >
                  <ArrowIcon isArabic={isArabic} />
                </span>
              )}
            </motion.article>
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        .nr-journey-premium {
          position: relative;
          overflow: hidden;
          padding: 94px 0 100px;
          background:
            radial-gradient(
              circle at 8% 20%,
              rgba(23, 111, 232, 0.1),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 82%,
              rgba(255, 195, 19, 0.12),
              transparent 24%
            ),
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--nr-soft) 84%, #ffffff),
              color-mix(in srgb, var(--nr-bg) 96%, #eef6ff)
            );
          scroll-margin-top: 105px;
        }

        .nr-journey-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.3;
          pointer-events: none;
          background-image:
            linear-gradient(
              rgba(23, 111, 232, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(23, 111, 232, 0.045) 1px,
              transparent 1px
            );
          background-size: 54px 54px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            #000 16%,
            #000 84%,
            transparent
          );
        }

        .nr-journey-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(24px);
        }

        .nr-journey-glow-blue {
          width: 340px;
          height: 340px;
          top: -190px;
          inset-inline-start: -165px;
          background: rgba(23, 111, 232, 0.14);
        }

        .nr-journey-glow-gold {
          width: 330px;
          height: 330px;
          right: -170px;
          bottom: -190px;
          background: rgba(255, 195, 19, 0.15);
        }

        .nr-journey-inner {
          position: relative;
          z-index: 2;
        }

        .nr-journey-heading {
          max-width: 880px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .nr-journey-kicker {
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

        .nr-journey-kicker svg {
          width: 17px;
          height: 17px;
          color: var(--nr-gold);
        }

        .nr-journey-heading h2 {
          margin: 18px 0 14px;
          color: var(--nr-text);
          font-size: clamp(36px, 4.5vw, 56px);
          line-height: 1.2;
          letter-spacing: -0.025em;
          text-wrap: balance;
        }

        .nr-journey-heading p {
          max-width: 730px;
          margin: 0 auto;
          color: var(--nr-muted);
          font-size: 15px;
          line-height: 1.88;
        }

        .nr-journey-heading-meta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 18px;
          color: color-mix(in srgb, var(--nr-muted) 78%, transparent);
          font-size: 10px;
          font-weight: 800;
        }

        .nr-journey-heading-meta i {
          width: 18px;
          height: 1px;
          background: color-mix(in srgb, var(--nr-blue) 28%, transparent);
        }

        .nr-journey-timeline {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .nr-journey-line {
          position: absolute;
          top: 50px;
          inset-inline: 7%;
          height: 2px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              rgba(23, 111, 232, 0.22),
              rgba(255, 195, 19, 0.9),
              rgba(23, 111, 232, 0.22)
            );
          box-shadow: 0 0 24px rgba(23, 111, 232, 0.12);
        }

        .nr-journey-step-card {
          position: relative;
          z-index: 2;
          min-height: 258px;
          overflow: visible;
          padding: 22px;
          border: 1px solid var(--nr-border);
          border-radius: 24px;
          background:
            linear-gradient(
              145deg,
              color-mix(in srgb, var(--nr-card) 94%, transparent),
              color-mix(in srgb, var(--nr-card) 82%, transparent)
            );
          box-shadow:
            0 22px 56px rgba(18, 67, 130, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .nr-journey-step-card::before {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          inset-inline-end: -84px;
          bottom: -92px;
          border-radius: 50%;
          background: rgba(23, 111, 232, 0.11);
          transition:
            transform 0.35s ease,
            opacity 0.35s ease;
        }

        .nr-journey-step-card:hover {
          border-color: rgba(255, 195, 19, 0.48);
          box-shadow:
            0 34px 78px rgba(18, 67, 130, 0.16),
            0 0 34px rgba(255, 195, 19, 0.08);
        }

        .nr-journey-step-card:hover::before {
          transform: scale(1.18);
        }

        .nr-journey-step-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 24px;
        }

        .nr-journey-step-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(23, 111, 232, 0.16);
          border-radius: 17px;
          color: var(--nr-blue);
          background: color-mix(
            in srgb,
            var(--nr-blue) 9%,
            var(--nr-card)
          );
          box-shadow: 0 14px 30px rgba(23, 111, 232, 0.1);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .nr-journey-step-card:hover .nr-journey-step-icon {
          transform: translateY(-4px) rotate(-4deg) scale(1.08);
          box-shadow: 0 18px 38px rgba(23, 111, 232, 0.18);
        }

        html[dir="ltr"]
          .nr-journey-step-card:hover
          .nr-journey-step-icon {
          transform: translateY(-4px) rotate(4deg) scale(1.08);
        }

        .nr-journey-step-icon svg {
          width: 27px;
          height: 27px;
        }

        .nr-journey-step-meta {
          display: grid;
          justify-items: end;
          gap: 1px;
        }

        html[dir="ltr"] .nr-journey-step-meta {
          justify-items: start;
        }

        .nr-journey-step-meta small {
          color: color-mix(in srgb, var(--nr-muted) 66%, transparent);
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .nr-journey-step-number {
          color: var(--nr-gold);
          font-size: 26px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .nr-journey-step-card h3 {
          position: relative;
          z-index: 2;
          margin: 0 0 10px;
          color: var(--nr-text);
          font-size: 19px;
          line-height: 1.45;
        }

        .nr-journey-step-card p {
          position: relative;
          z-index: 2;
          margin: 0;
          overflow: hidden;
          color: var(--nr-muted);
          font-size: 12px;
          line-height: 1.75;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }

        .nr-journey-step-line {
          position: absolute;
          inset-inline-start: 22px;
          bottom: 18px;
          z-index: 2;
          width: 38px;
          height: 3px;
          border-radius: 999px;
          background: var(--nr-gold);
          transition: width 0.25s ease;
        }

        .nr-journey-step-card:hover .nr-journey-step-line {
          width: 76px;
        }

        .nr-journey-connector {
          position: absolute;
          top: 31px;
          inset-inline-end: -26px;
          z-index: 4;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(23, 111, 232, 0.16);
          border-radius: 50%;
          color: var(--nr-blue);
          background: var(--nr-card);
          box-shadow: 0 10px 24px rgba(18, 67, 130, 0.12);
        }

        .nr-journey-connector svg {
          width: 17px;
          height: 17px;
        }

        html[data-theme="dark"] .nr-journey-premium {
          background:
            radial-gradient(
              circle at 8% 20%,
              rgba(23, 111, 232, 0.15),
              transparent 24%
            ),
            radial-gradient(
              circle at 92% 82%,
              rgba(255, 195, 19, 0.09),
              transparent 24%
            ),
            linear-gradient(180deg, #07182c, #0a213d);
        }

        html[data-theme="dark"] .nr-journey-step-card {
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.07),
              rgba(255, 255, 255, 0.035)
            );
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 22px 58px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        html[data-theme="dark"] .nr-journey-connector {
          border-color: rgba(255, 255, 255, 0.1);
          background: #102846;
        }

        @media (max-width: 1050px) {
          .nr-journey-timeline {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nr-journey-line {
            display: none;
          }

          .nr-journey-connector {
            display: none;
          }
        }

        @media (max-width: 620px) {
          .nr-journey-premium {
            padding: 68px 0 72px;
          }

          .nr-journey-heading {
            margin-bottom: 28px;
          }

          .nr-journey-heading h2 {
            font-size: clamp(34px, 10vw, 43px);
          }

          .nr-journey-heading p {
            font-size: 14px;
          }

          .nr-journey-heading-meta {
            gap: 6px;
            margin-top: 14px;
            font-size: 9px;
          }

          .nr-journey-heading-meta i {
            width: 10px;
          }

          .nr-journey-timeline {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .nr-journey-step-card {
            min-height: 210px;
            padding: 20px;
          }

          .nr-journey-connector {
            display: none;
          }

          .nr-journey-step-line {
            inset-inline-start: 20px;
          }
        }

        @media (max-width: 430px) {
          .nr-journey-heading h2 {
            font-size: clamp(31px, 9.5vw, 38px);
          }

          .nr-journey-step-card {
            min-height: 198px;
          }

          .nr-journey-step-icon {
            width: 48px;
            height: 48px;
          }

          .nr-journey-step-icon svg {
            width: 24px;
            height: 24px;
          }

          .nr-journey-step-card h3 {
            font-size: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-journey-step-card,
          .nr-journey-step-icon,
          .nr-journey-step-line,
          .nr-journey-step-card::before {
            transition: none !important;
          }
        }
      `}</style>
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

function ArrowIcon({
  isArabic,
}: {
  isArabic: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {isArabic ? (
        <path
          d="M19 12H5m6 6-6-6 6-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5 12h14m-6-6 6 6-6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}