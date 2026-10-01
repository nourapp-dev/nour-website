"use client";

import { motion, type Variants } from "framer-motion";
import type { Language } from "../../data/home";
import { WEBSITE_BOOKING_ENABLED } from "../../../src/core/config/website-booking";

type ServiceIconName =
  | "packages"
  | "visa"
  | "hotel"
  | "transport"
  | "guidance"
  | "payment";

type Service = {
  titleAr: string;
  titleEn: string;
  textAr: string;
  textEn: string;
  labelAr: string;
  labelEn: string;
  icon: ServiceIconName;
  accent: "blue" | "gold" | "cyan";
  badgeAr?: string;
  badgeEn?: string;
  paymentMethods?: string[];
  featured?: boolean;
};

const services: Service[] = [
  {
    titleAr: "برامج وباقات العمرة",
    titleEn: "Umrah programs and packages",
    textAr:
      "خيارات مدروسة تناسب الاحتياجات والميزانيات المختلفة، مع تفاصيل واضحة لكل برنامج.",
    textEn:
      "Carefully designed options for different needs and budgets, with clear details for every program.",
    labelAr: "استكشف البرامج",
    labelEn: "Explore programs",
    icon: "packages",
    accent: "blue",
    badgeAr: "الأكثر طلبًا",
    badgeEn: "Most popular",
    featured: true,
  },
  {
    titleAr: "خدمات التأشيرات",
    titleEn: "Visa services",
    textAr:
      "إجراءات رقمية مبسطة تساعد على تجهيز المتطلبات ومتابعة حالة الطلب بوضوح.",
    textEn:
      "Simplified digital steps for preparing requirements and following application status clearly.",
    labelAr: "تعرف على الخدمة",
    labelEn: "Learn more",
    icon: "visa",
    accent: "gold",
    badgeAr: "إجراءات مبسطة",
    badgeEn: "Simplified",
    featured: true,
  },
  {
    titleAr: "حجوزات الفنادق",
    titleEn: "Hotel bookings",
    textAr:
      "خيارات سكن متنوعة بالقرب من الحرمين، مع مقارنة واضحة للموقع والخدمات والتكلفة.",
    textEn:
      "A range of accommodation near the holy mosques, with clear comparisons of location, service, and price.",
    labelAr: "استعرض الفنادق",
    labelEn: "Browse hotels",
    icon: "hotel",
    accent: "cyan",
  },
  {
    titleAr: "النقل والتنقلات",
    titleEn: "Transport and transfers",
    textAr:
      "تنسيق خدمات النقل بين المطار والسكن والمشاعر بما يمنح المعتمر راحة وطمأنينة أكبر.",
    textEn:
      "Coordinated transfers between airports, accommodation, and key destinations for greater comfort.",
    labelAr: "تفاصيل النقل",
    labelEn: "Transport details",
    icon: "transport",
    accent: "blue",
    badgeAr: "تنسيق أسرع",
    badgeEn: "Faster coordination",
  },
  {
    titleAr: "الإرشاد والمساندة",
    titleEn: "Guidance and assistance",
    textAr:
      "معلومات وإرشادات عملية تساعد المعتمر على الاستعداد ومتابعة تفاصيل رحلته بثقة.",
    textEn:
      "Practical information and guidance helping pilgrims prepare and follow their journey confidently.",
    labelAr: "اعرف المزيد",
    labelEn: "Learn more",
    icon: "guidance",
    accent: "gold",
  },
  {
    titleAr: WEBSITE_BOOKING_ENABLED ? "الدفع المرن" : "الحجز والدفع",
    titleEn: WEBSITE_BOOKING_ENABLED ? "Flexible payment" : "Booking and payment",
    textAr:
      WEBSITE_BOOKING_ENABLED ? "خيارات دفع آمنة ومرنة تساعدك على اختيار الطريقة الأنسب لميزانيتك وإتمام الحجز بسهولة." : "الحجز والدفع عبر الموقع متوقفان مؤقتًا. تواصل مع فريق نور آب للاستفسار عن البرامج والخدمات.",
    textEn:
      WEBSITE_BOOKING_ENABLED ? "Secure and flexible payment options that help you choose what fits your budget and complete booking easily." : "Website booking and payment are temporarily paused. Contact the NourApp team with questions about programs and services.",
    labelAr: WEBSITE_BOOKING_ENABLED ? "استعرض خيارات الدفع" : "تواصل معنا",
    labelEn: WEBSITE_BOOKING_ENABLED ? "View payment options" : "Contact us",
    icon: "payment",
    accent: "cyan",
    badgeAr: WEBSITE_BOOKING_ENABLED ? "خيارات متعددة" : "متوقف مؤقتًا",
    badgeEn: WEBSITE_BOOKING_ENABLED ? "Multiple options" : "Temporarily paused",
    paymentMethods: WEBSITE_BOOKING_ENABLED ? ["Tabby", "Tamara", "Visa", "Mastercard", "Apple Pay"] : undefined,
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
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

export default function Services({
  language,
}: {
  language: Language;
}) {
  const isArabic = language === "ar";

  return (
    <section
      className="nr-services-premium"
      id="features"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-services-title"
    >
      <div className="nr-services-pattern" aria-hidden="true" />
      <div className="nr-services-glow nr-services-glow-blue" aria-hidden="true" />
      <div className="nr-services-glow nr-services-glow-gold" aria-hidden="true" />

      <div className="nr-container nr-services-inner">
        <motion.header
          className="nr-services-heading"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.64,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="nr-services-kicker">
            <SparkleIcon />
            {isArabic ? "خدمات  نور آب" : "NourApp services"}
          </span>

          <h2
            id="nr-services-title"
            lang={isArabic ? "ar" : "en"}
          >
            {isArabic
              ? "رحلة عمرة متكاملة، من التخطيط حتى العودة"
              : "A complete Umrah journey, from planning to return"}
          </h2>

          <p>
            {isArabic
              ? "برامج، تأشيرات، سكن، نقل وإرشاد ضمن تجربة رقمية واحدة تساعدك على مقارنة الخدمات والتخطيط لرحلتك بسهولة."
              : "Programs, visas, accommodation, transport, and guidance in one digital experience to help you compare services and plan your journey."}
          </p>
        </motion.header>

        <motion.div
          className="nr-services-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          {services.map((service, index) => (
            <motion.article
              key={service.titleEn}
              className={`nr-service-card nr-service-card-${service.accent} ${
                service.featured ? "is-featured" : ""
              }`}
              variants={cardVariants}
              whileHover={{
                y: -10,
                scale: 1.018,
              }}
            >
              {service.badgeAr && (
                <span className="nr-service-badge">
                  {isArabic ? service.badgeAr : service.badgeEn}
                </span>
              )}

              <span className="nr-service-card-orb" aria-hidden="true" />

              <div className="nr-service-card-head">
                <motion.span
                  className="nr-service-icon"
                  whileHover={{ rotate: isArabic ? -7 : 7, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <ServiceIcon name={service.icon} />
                </motion.span>

                <span className="nr-service-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3>
                {isArabic ? service.titleAr : service.titleEn}
              </h3>

              <p>
                {isArabic ? service.textAr : service.textEn}
              </p>

              {service.paymentMethods && (
                <div
                  className="nr-payment-methods"
                  aria-label={isArabic ? "وسائل الدفع المتاحة" : "Available payment methods"}
                >
                  {service.paymentMethods.map((method) => (
                    <span key={method}>{method}</span>
                  ))}
                </div>
              )}

              <a
                className="nr-service-link"
                href={
                  service.icon === "packages"
                    ? "#programs"
                    : service.icon === "payment"
                      ? (WEBSITE_BOOKING_ENABLED ? "#payments" : "#contact")
                      : service.icon === "hotel"
                        ? "#programs"
                        : "#journey"
                }
                aria-label={isArabic ? service.labelAr : service.labelEn}
              >
                <span>{isArabic ? service.labelAr : service.labelEn}</span>
                <ArrowIcon isArabic={isArabic} />
              </a>

              <span className="nr-service-line" aria-hidden="true" />
            </motion.article>
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        .nr-services-premium {
          position: relative;
          overflow: hidden;
          padding: 96px 0 104px;
          background:
            radial-gradient(
              circle at 10% 18%,
              rgba(23, 111, 232, 0.11),
              transparent 24%
            ),
            radial-gradient(
              circle at 90% 82%,
              rgba(255, 195, 19, 0.12),
              transparent 24%
            ),
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--nr-bg) 96%, #eef6ff),
              color-mix(in srgb, var(--nr-soft) 84%, #ffffff)
            );
          scroll-margin-top: 105px;
        }

        .nr-services-pattern {
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

        .nr-services-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(24px);
        }

        .nr-services-glow-blue {
          width: 340px;
          height: 340px;
          top: -190px;
          inset-inline-start: -165px;
          background: rgba(23, 111, 232, 0.14);
        }

        .nr-services-glow-gold {
          width: 330px;
          height: 330px;
          right: -170px;
          bottom: -190px;
          background: rgba(255, 195, 19, 0.15);
        }

        .nr-services-inner {
          position: relative;
          z-index: 2;
        }

        .nr-services-heading {
          max-width: 900px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .nr-services-kicker {
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

        .nr-services-kicker svg {
          width: 17px;
          height: 17px;
          color: var(--nr-gold);
        }

        .nr-services-heading h2 {
          margin: 18px 0 14px;
          color: var(--nr-text);
          font-size: clamp(36px, 4.4vw, 56px);
          line-height: 1.2;
          letter-spacing: -0.025em;
          text-wrap: balance;
        }

        .nr-services-heading p {
          max-width: 760px;
          margin: 0 auto;
          color: var(--nr-muted);
          font-size: 15px;
          line-height: 1.88;
        }

        .nr-services-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .nr-service-card.is-featured {
          grid-column: span 2;
        }

        .nr-service-card {
          position: relative;
          min-height: 292px;
          overflow: hidden;
          padding: 25px;
          border: 1px solid var(--nr-border);
          border-radius: 28px;
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

        .nr-service-card-orb {
          position: absolute;
          width: 120px;
          height: 120px;
          top: -46px;
          inset-inline-end: -38px;
          border-radius: 50%;
          background: color-mix(in srgb, currentColor 11%, transparent);
          filter: blur(1px);
          pointer-events: none;
        }

        .nr-service-card.is-featured .nr-service-card-orb {
          width: 190px;
          height: 190px;
          top: -80px;
          inset-inline-end: -55px;
          opacity: .9;
        }

        .nr-service-card::before {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          inset-inline-end: -105px;
          bottom: -115px;
          border-radius: 50%;
          opacity: 0.13;
          background: currentColor;
          transition:
            transform 0.35s ease,
            opacity 0.35s ease;
        }

        .nr-service-card:hover::before {
          transform: scale(1.18);
          opacity: 0.2;
        }

        .nr-service-card:hover {
          box-shadow:
            0 34px 78px rgba(18, 67, 130, 0.15),
            0 0 34px color-mix(
              in srgb,
              currentColor 9%,
              transparent
            );
        }

        .nr-service-card.is-featured {
          min-height: 320px;
          padding: 30px;
        }

        .nr-service-card.is-featured h3 {
          font-size: 25px;
        }

        .nr-service-card.is-featured > p {
          max-width: 640px;
          font-size: 14px;
        }

        .nr-service-card.is-featured .nr-service-icon {
          width: 66px;
          height: 66px;
          border-radius: 20px;
        }

        .nr-service-card.is-featured .nr-service-icon svg {
          width: 31px;
          height: 31px;
        }

        .nr-service-card-blue {
          color: #176fe8;
        }

        .nr-service-card-gold {
          color: #d49b00;
        }

        .nr-service-card-cyan {
          color: #00a5c8;
        }

        .nr-service-badge {
          position: absolute;
          top: 18px;
          inset-inline-end: 18px;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          min-height: 27px;
          padding-inline: 10px;
          border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
          border-radius: 999px;
          color: currentColor;
          background: color-mix(in srgb, currentColor 8%, var(--nr-card));
          font-size: 10px;
          font-weight: 900;
          backdrop-filter: blur(10px);
        }

        .nr-service-card-head {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 23px;
          padding-top: 14px;
        }

        .nr-service-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border: 1px solid
            color-mix(in srgb, currentColor 18%, transparent);
          border-radius: 17px;
          color: currentColor;
          background: color-mix(
            in srgb,
            currentColor 10%,
            var(--nr-card)
          );
          box-shadow: 0 14px 30px
            color-mix(in srgb, currentColor 11%, transparent);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        .nr-service-card:hover .nr-service-icon {
          transform: translateY(-4px) rotate(-4deg) scale(1.08);
          box-shadow: 0 18px 38px
            color-mix(in srgb, currentColor 17%, transparent);
        }

        html[dir="ltr"] .nr-service-card:hover .nr-service-icon {
          transform: translateY(-4px) rotate(4deg) scale(1.08);
        }

        .nr-service-icon svg {
          width: 28px;
          height: 28px;
        }

        .nr-service-index {
          color: color-mix(
            in srgb,
            var(--nr-muted) 34%,
            transparent
          );
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .nr-service-card h3 {
          position: relative;
          z-index: 2;
          margin: 0 0 11px;
          color: var(--nr-text);
          font-size: 20px;
          line-height: 1.45;
        }

        .nr-service-card > p {
          position: relative;
          z-index: 2;
          margin: 0;
          overflow: hidden;
          color: var(--nr-muted);
          font-size: 12px;
          line-height: 1.78;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .nr-payment-methods {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 13px;
          padding-bottom: 58px;
        }

        .nr-payment-methods span {
          display: inline-flex;
          align-items: center;
          min-height: 25px;
          padding-inline: 8px;
          border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
          border-radius: 999px;
          color: var(--nr-text);
          background: color-mix(in srgb, var(--nr-card) 88%, currentColor 5%);
          font-size: 9px;
          font-weight: 850;
        }

        .nr-service-link {
          position: absolute;
          inset-inline-start: 25px;
          bottom: 22px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding-inline: 15px;
          border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
          border-radius: 13px;
          color: currentColor;
          background: color-mix(in srgb, currentColor 7%, var(--nr-card));
          font-size: 12px;
          font-weight: 900;
          transition:
            gap 0.22s ease,
            transform 0.22s ease,
            background 0.22s ease;
        }

        .nr-service-link:hover {
          gap: 12px;
          transform: translateY(-2px);
          background: color-mix(in srgb, currentColor 12%, var(--nr-card));
        }

        .nr-service-link svg {
          width: 16px;
          height: 16px;
        }

        .nr-service-line {
          position: absolute;
          inset-inline-start: 26px;
          bottom: 14px;
          width: 40px;
          height: 3px;
          border-radius: 999px;
          background: currentColor;
          transition: width 0.25s ease;
        }

        .nr-service-card:hover .nr-service-line {
          width: 76px;
        }

        html[data-theme="dark"] .nr-services-premium {
          background:
            radial-gradient(
              circle at 10% 18%,
              rgba(23, 111, 232, 0.16),
              transparent 24%
            ),
            radial-gradient(
              circle at 90% 82%,
              rgba(255, 195, 19, 0.1),
              transparent 24%
            ),
            linear-gradient(180deg, #07182c, #0a213d);
        }

        html[data-theme="dark"] .nr-service-card {
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.075),
              rgba(255, 255, 255, 0.038)
            );
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 22px 58px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        @media (max-width: 1100px) {
          .nr-services-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nr-service-card.is-featured {
            grid-column: span 1;
          }
        }

        @media (max-width: 620px) {
          .nr-services-premium {
            padding: 68px 0 72px;
          }

          .nr-services-heading {
            margin-bottom: 32px;
          }

          .nr-services-heading h2 {
            font-size: clamp(34px, 10vw, 43px);
          }

          .nr-services-heading p {
            font-size: 14px;
          }

          .nr-services-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .nr-service-card {
            min-height: 255px;
            padding: 22px;
          }

          .nr-service-card.is-featured {
            min-height: 270px;
            padding: 22px;
          }

          .nr-service-card.is-featured h3 {
            font-size: 21px;
          }

          .nr-service-card.is-featured > p {
            font-size: 12px;
          }

          .nr-service-card-head {
            margin-bottom: 24px;
          }

          .nr-service-link,
          .nr-service-line {
            inset-inline-start: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-service-card,
          .nr-service-icon,
          .nr-service-link,
          .nr-service-line,
          .nr-service-card::before {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function ServiceIcon({
  name,
}: {
  name: ServiceIconName;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "packages") {
    return (
      <svg {...common}>
        <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
        <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
      </svg>
    );
  }

  if (name === "visa") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <circle cx="9" cy="10" r="2" />
        <path d="M7 16c.8-1.6 3.2-1.6 4 0M14 9h3M14 13h3" />
      </svg>
    );
  }

  if (name === "hotel") {
    return (
      <svg {...common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M3 21h18" />
      </svg>
    );
  }

  if (name === "transport") {
    return (
      <svg {...common}>
        <path d="M5 17h14l1-5-2-5H6l-2 5 1 5Z" />
        <path d="M7 17v2M17 17v2M6 12h12M8 8h8" />
        <circle cx="8" cy="15" r="1" />
        <circle cx="16" cy="15" r="1" />
      </svg>
    );
  }

  if (name === "guidance") {
    return (
      <svg {...common}>
        <path d="M12 21s7-4.3 7-11a7 7 0 1 0-14 0c0 6.7 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h4" />
      <path d="M16.5 14.2c1.4.4 2.3 1.3 2.7 2.6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m5 16 .7 1.8 1.8.7-1.8.7L5 21l-.7-1.8-1.8-.7 1.8-.7L5 16Z" />
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
