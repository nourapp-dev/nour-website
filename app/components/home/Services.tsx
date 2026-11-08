"use client";

import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./HomeCards.module.css";
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
  badgeAr?: string;
  badgeEn?: string;
  paymentMethods?: string[];
};

import { services as serviceDefaults } from "../../../src/features/website/home-content-defaults";
const services = serviceDefaults as Service[];

export default function Services({ language }: { language: Language }) {
  const isArabic = language === "ar";
  const content = usePresentation().sections.services;
  const rows = services.map((service) => {
    const item = content.items.find((i) => i.id === service.icon);
    return item && service.icon !== "payment"
      ? {
          ...service,
          titleAr: item.title.ar,
          titleEn: item.title.en,
          textAr: item.description.ar,
          textEn: item.description.en,
        }
      : service;
  });
  return (
    <section
      className={styles.section}
      id="services"
      dir={isArabic ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="nr-services-title"
    >
      <div className={"nr-container " + styles.inner}>
        <header className={styles.heading}>
          <span className={styles.kicker}>
            <ServicesGridIcon />
            {isArabic ? "خدمات نور آب" : "NourApp services"}
          </span>
          <h2 id="nr-services-title">{content.title[language]}</h2>
          <p>{content.description[language]}</p>
        </header>
        <div className={styles.grid}>
          {rows.map((service) => (
            <article key={service.titleEn} className={styles.card}>
              <span className={styles.icon}>
                <ServiceIcon name={service.icon} />
              </span>
              <div className={styles.copy}>
                <h3>{isArabic ? service.titleAr : service.titleEn}</h3>
                {service.badgeAr && (
                  <span className={styles.badge}>
                    {isArabic ? service.badgeAr : service.badgeEn}
                  </span>
                )}
                <p>{isArabic ? service.textAr : service.textEn}</p>
                {service.paymentMethods && (
                  <div
                    className={styles.methods}
                    aria-label={
                      isArabic
                        ? "وسائل الدفع المتاحة"
                        : "Available payment methods"
                    }
                  >
                    {service.paymentMethods.map((method) => (
                      <span key={method}>{method}</span>
                    ))}
                  </div>
                )}
                <a
                  className={styles.link}
                  href={
                    service.icon === "packages" || service.icon === "hotel"
                      ? "#programs"
                      : service.icon === "payment"
                        ? WEBSITE_BOOKING_ENABLED
                          ? "#payments"
                          : "#contact"
                        : "#service-details"
                  }
                >
                  <span>{service.icon==='packages'?(isArabic?'استكشف البرامج':'Explore programs'):service.icon==='payment'?(isArabic?'تواصل معنا':'Contact us'):(isArabic?'كيف تظهر الخدمة في البرامج؟':'How is this service shown in programs?')}</span>
                  <ArrowIcon isArabic={isArabic} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceIcon({ name }: { name: ServiceIconName }) {
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

function ServicesGridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
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
