"use client";

import Link from "next/link";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Language } from "../../data/home";
import { createClient } from "../../../src/lib/supabase/client";
import usePublicProgramCatalog from "../../../src/features/programs/hooks/usePublicProgramCatalog";
import { getNextPublicDepartures } from "../../../src/features/programs/services/program-departures.service";

type Props = {
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
    y: 34,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function formatPrice(
  value: number,
  language: Language,
) {
  return new Intl.NumberFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatDuration(
  days: number,
  language: Language,
) {
  if (language === "ar") {
    if (days === 1) return "يوم واحد";
    if (days === 2) return "يومان";
    if (days >= 3 && days <= 10) {
      return `${days} أيام`;
    }

    return `${days} يومًا`;
  }

  return days === 1
    ? "1 day"
    : `${days} days`;
}

function formatNights(
  nights: number,
  language: Language,
) {
  if (language === "ar") {
    if (nights === 0) return "بدون ليالٍ";
    if (nights === 1) return "ليلة واحدة";
    if (nights === 2) return "ليلتان";
    if (nights >= 3 && nights <= 10) {
      return `${nights} ليالٍ`;
    }

    return `${nights} ليلة`;
  }

  if (nights === 0) {
    return "No nights";
  }

  return nights === 1
    ? "1 night"
    : `${nights} nights`;
}

export default function ProgramsPreview({
  language,
}: Props) {
  const isArabic =
    language === "ar";

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const { data: programs = [], isLoading, isError, refetch } = usePublicProgramCatalog();
  const visiblePrograms = programs.slice(0, 3);
  const programIds = visiblePrograms.map((program) => program.id);
  const departuresQuery = useQuery({
    queryKey: ["public", "programs-preview-departures", programIds],
    queryFn: () => getNextPublicDepartures(supabase, programIds),
    enabled: programIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <section
      className="nr-programs-preview"
      id="programs"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-programs-title"
    >
      <div
        className="nr-programs-orb nr-programs-orb-one"
        aria-hidden="true"
      />

      <div
        className="nr-programs-orb nr-programs-orb-two"
        aria-hidden="true"
      />

      <div className="nr-container">
        <motion.div
          className="nr-programs-heading"
          initial={{
            opacity: 0,
            y: 24,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.6,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        >
          <span className="nr-programs-kicker">
            <span className="nr-programs-kicker-dot" aria-hidden="true" />
            {isArabic
              ? "برامج مختارة بعناية"
              : "Curated Umrah programs"}
          </span>

          <div className="nr-programs-heading-row">
            <div>
              <h2 id="nr-programs-title">
                {isArabic
                  ? "رحلتك تبدأ من البرنامج المناسب"
                  : "Your journey starts with the right program"}
              </h2>

              <p>
                {isArabic
                  ? "قارن بلد الانطلاق والمدة والسعر، ثم راجع المواعيد والخدمات واختر رحلتك."
                  : "Compare departure countries, duration, and prices, then review dates and services to choose your trip."}
              </p>
            </div>

            <Link
              className="nr-programs-all-link"
              href="/programs"
            >
              <span>
                {isArabic
                  ? "عرض جميع البرامج"
                  : "View all programs"}
              </span>

              <ArrowIcon
                language={language}
              />
            </Link>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="nr-programs-state">
            {isArabic
              ? "جارٍ تحميل البرامج..."
              : "Loading programs..."}
          </div>
        ) : null}

        {isError ? (
          <div
            className="nr-programs-state"
            role="alert"
          >
            {isArabic
              ? "تعذر تحميل البرامج حاليًا."
              : "Unable to load programs right now."}
            <button type="button" className="nr-programs-retry" onClick={() => void refetch()}>{isArabic ? "إعادة المحاولة" : "Try again"}</button>
          </div>
        ) : null}

        {!isLoading &&
        !isError &&
        visiblePrograms.length === 0 ? (
          <div className="nr-programs-state">
            {isArabic
              ? "لا توجد برامج منشورة حاليًا."
              : "There are no published programs right now."}
          </div>
        ) : null}

        {visiblePrograms.length > 0 ? (
          <motion.div
            className="nr-programs-grid"
            variants={
              containerVariants
            }
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.12,
            }}
          >
            {visiblePrograms.map(
              (program, index) => {
                const title =
                  isArabic
                    ? program.titleAr
                    : program.titleEn;

                const description =
                  isArabic
                    ? program.summaryAr
                    : program.summaryEn;

                const countryName =
                  isArabic
                    ? program.countryNameAr
                    : program.countryNameEn;

                const detailsUrl =
                  `/programs/${encodeURIComponent(
                    program.slug,
                  )}`;

                return (
                  <motion.article
                    key={program.id}
                    className="nr-program-card"
                    variants={
                      cardVariants
                    }
                    whileHover={{
                      y: -10,
                    }}
                  >
                    <Link
                      className="nr-program-card-link"
                      href={detailsUrl}
                      aria-label={
                        isArabic
                          ? `عرض تفاصيل ${title}`
                          : `View details for ${title}`
                      }
                    >
                      <div className="nr-program-media">
                        {program.coverUrl ? (
                          <Image
                            src={
                              program.coverUrl
                            }
                            alt={title}
                            fill
                            unoptimized
                            sizes="(max-width: 760px) 88vw, (max-width: 1100px) 46vw, 370px"
                            className="nr-program-image"
                          />
                        ) : (
                          <div className="nr-program-image-placeholder">
                            <ProgramPlaceholderIcon />

                            <span>
                              {isArabic
                                ? "صورة البرنامج"
                                : "Program image"}
                            </span>
                          </div>
                        )}

                        <div
                          className="nr-program-overlay"
                          aria-hidden="true"
                        />

                        <div className="nr-program-image-meta">
                          <span>
                            <LocationIcon />
                            {countryName ||
                              (isArabic
                                ? "برنامج عمرة"
                                : "Umrah program")}
                          </span>
                          <span>
                            <CalendarIcon />
                            {formatDuration(
                              program.durationDays,
                              language,
                            )}
                          </span>
                        </div>

                        {program.isFeatured ? (
                          <span className="nr-program-badge">
                            {isArabic
                              ? "مميز"
                              : "Featured"}
                          </span>
                        ) : null}

                        <span className="nr-program-index">
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </span>
                      </div>
                    </Link>

                    <div className="nr-program-body">
                      <div className="nr-program-title-row">
                        <div>
                          <span className="nr-program-category">
                            {countryName ||
                              (isArabic
                                ? "برنامج عمرة"
                                : "Umrah Program")}
                          </span>

                          <h3>
                            <Link
                              href={
                                detailsUrl
                              }
                            >
                              {title}
                            </Link>
                          </h3>
                        </div>

                        {program.isFeatured ? (
                          <span className="nr-program-featured-mark">
                            <SparkIcon />
                            {isArabic ? "مختار" : "Selected"}
                          </span>
                        ) : null}
                      </div>

                      <p className="nr-program-description">
                        {description ||
                          (isArabic
                            ? "استعرض تفاصيل البرنامج والخدمات المتاحة."
                            : "Review the program details and available services.")}
                      </p>

                      <div className="nr-program-features">
                        <span>
                          <CalendarIcon />
                          <b>
                            {formatDuration(
                              program.durationDays,
                              language,
                            )}
                          </b>
                          <small>
                            {isArabic ? "المدة" : "Duration"}
                          </small>
                        </span>

                        <span>
                          <NightIcon />
                          <b>
                            {formatNights(
                              program.durationNights,
                              language,
                            )}
                          </b>
                          <small>
                            {isArabic ? "الإقامة" : "Stay"}
                          </small>
                        </span>

                        <span>
                          <LocationIcon />
                          <b>
                            {countryName ||
                              (isArabic
                                ? "غير محدد"
                                : "Not specified")}
                          </b>
                          <small>
                            {isArabic ? "بلد الانطلاق" : "Departure country"}
                          </small>
                        </span>
                      </div>

                      <div className="nr-program-departure">
                        <CalendarIcon />
                        <div>
                          <small>{isArabic ? "أقرب موعد متاح" : "Next available departure"}</small>
                          {departuresQuery.data?.[program.id] ? <time dateTime={departuresQuery.data[program.id]}>{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric", calendar: "gregory", timeZone: "Asia/Riyadh" }).format(new Date(departuresQuery.data[program.id]))}</time> : <span>{departuresQuery.isLoading ? (isArabic ? "جارٍ تحميل المواعيد..." : "Loading dates...") : (isArabic ? "راجع المواعيد في تفاصيل البرنامج" : "See dates in the program details")}</span>}
                        </div>
                      </div>
                      <div className="nr-program-divider" />

                      <div className="nr-program-footer">
                        <div className="nr-program-price">
                          <small>
                            {isArabic
                              ? "يبدأ من"
                              : "Starting from"}
                          </small>

                          <strong>
                            {formatPrice(
                              program.basePrice,
                              language,
                            )}

                            <span>
                              {" "}
                              {
                                program.currencyCode
                              }
                            </span>
                          </strong>
                        </div>

                        <div className="nr-program-actions">
                          <Link
                            className="nr-program-primary"
                            href={detailsUrl}
                          >
                            <span>
                              {isArabic
                                ? "تفاصيل البرنامج"
                                : "Program details"}
                            </span>

                            <ArrowIcon
                              language={language}
                            />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              },
            )}
          </motion.div>
        ) : null}

        <motion.div
          className="nr-programs-note"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
        >
          <InfoIcon />

          <p>
            {isArabic
              ? "السعر يبدأ من القيمة المعروضة، وقد يختلف حسب موعد الرحلة والفئة وعدد المسافرين. راجع التفاصيل قبل تأكيد الحجز."
              : "Prices start from the amount shown and may vary by departure, tier, and traveler count. Review the details before confirming your booking."}
          </p>
        </motion.div>
      </div>

      <style jsx global>{`
        .nr-programs-preview a:focus-visible, .nr-programs-preview button:focus-visible { outline: 3px solid #176fe8; outline-offset: 4px; }
        .nr-program-departure { display: flex; align-items: center; gap: 10px; margin-top: 16px; color: var(--nr-blue); }
        .nr-program-departure > svg { width: 20px; height: 20px; flex: 0 0 20px; }
        .nr-program-departure small { display: block; font-size: 11px; color: var(--nr-muted); margin-bottom: 3px; }
        .nr-program-departure time, .nr-program-departure span { display: block; font-size: 13px; font-weight: 700; color: var(--nr-text); }
        .nr-programs-retry { display: block; margin: 12px auto 0; padding: 10px 20px; border: 1px solid var(--nr-border); border-radius: 10px; background: var(--nr-card); color: var(--nr-blue); font: inherit; cursor: pointer; }

        .nr-programs-preview {
          position: relative;
          overflow: hidden;
          padding: 96px 0 104px;
          background:
            radial-gradient(
              circle at 12% 8%,
              rgba(23, 111, 232, 0.09),
              transparent 24%
            ),
            radial-gradient(
              circle at 88% 92%,
              rgba(255, 195, 19, 0.08),
              transparent 24%
            ),
            linear-gradient(
              180deg,
              color-mix(
                in srgb,
                var(--nr-soft) 72%,
                transparent
              ),
              var(--nr-bg)
            );
          scroll-margin-top: 108px;
        }

        .nr-programs-preview::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.33;
          background-image:
            linear-gradient(
              rgba(
                  23,
                  111,
                  232,
                  0.055
                )
                1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(
                  23,
                  111,
                  232,
                  0.055
                )
                1px,
              transparent 1px
            );
          background-size:
            52px 52px;
          mask-image:
            linear-gradient(
              to bottom,
              transparent,
              #000 18%,
              #000 78%,
              transparent
            );
        }

        .nr-programs-preview
          .nr-container {
          position: relative;
          z-index: 2;
        }

        .nr-programs-state {
          display: grid;
          min-height: 190px;
          place-items: center;
          padding: 30px;
          border: 1px solid
            var(--nr-border);
          border-radius: 24px;
          color: var(--nr-muted);
          background: var(--nr-card);
          text-align: center;
        }

        .nr-programs-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(10px);
          pointer-events: none;
        }

        .nr-programs-orb-one {
          width: 380px;
          height: 380px;
          top: -210px;
          inset-inline-start: -180px;
          background:
            rgba(
              23,
              111,
              232,
              0.12
            );
        }

        .nr-programs-orb-two {
          width: 330px;
          height: 275px;
          right: -170px;
          bottom: -180px;
          background:
            rgba(
              255,
              195,
              19,
              0.12
            );
        }

        .nr-programs-heading {
          margin-bottom: 45px;
        }

        .nr-programs-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding-inline: 14px;
          border: 1px solid
            rgba(
              23,
              111,
              232,
              0.14
            );
          border-radius: 999px;
          color: var(--nr-blue);
          background:
            color-mix(
              in srgb,
              var(--nr-blue) 8%,
              var(--nr-card)
            );
          font-size: 12px;
          font-weight: 900;
        }

        .nr-programs-kicker-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--nr-gold);
          box-shadow: 0 0 0 5px rgba(255, 195, 19, 0.12);
        }

        .nr-programs-heading-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 35px;
          margin-top: 16px;
        }

        .nr-programs-heading-row
          > div {
          max-width: 760px;
        }

        .nr-programs-heading h2 {
          margin: 0;
          color: var(--nr-text);
          font-size:
            clamp(
              34px,
              4vw,
              54px
            );
          line-height: 1.25;
        }

        .nr-programs-heading p {
          max-width: 720px;
          margin: 16px 0 0;
          color: var(--nr-muted);
          font-size: 16px;
          line-height: 1.9;
        }

        .nr-programs-all-link {
          flex: 0 0 auto;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-inline: 17px;
          border: 1px solid
            var(--nr-border);
          border-radius: 14px;
          color: var(--nr-text);
          background: var(--nr-card);
          font-size: 13px;
          font-weight: 900;
          box-shadow:
            0 12px 28px
            rgba(
              18,
              67,
              130,
              0.06
            );
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
        }

        .nr-programs-all-link svg {
          width: 17px;
          height: 17px;
          transition:
            transform 0.2s ease;
        }

        .nr-programs-all-link:hover {
          color: var(--nr-blue);
          border-color:
            rgba(
              23,
              111,
              232,
              0.28
            );
          transform:
            translateY(-2px);
        }

        .nr-programs-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 22px;
        }

        .nr-program-card {
          position: relative;
          z-index: 2;
          min-width: 0;
          overflow: hidden;
          border: 1px solid
            var(--nr-border);
          border-radius: 30px;
          background:
            var(--nr-card);
          box-shadow:
            0 20px 58px
            rgba(
              18,
              67,
              130,
              0.09
            );
          transition:
            border-color
              0.25s ease,
            box-shadow
              0.25s ease;
        }

        .nr-program-card:hover {
          border-color:
            rgba(
              23,
              111,
              232,
              0.34
            );
          box-shadow:
            0 35px 90px
            rgba(
              18,
              67,
              130,
              0.18
            );
        }

        .nr-program-card-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .nr-program-media {
          position: relative;
          height: 330px;
          overflow: hidden;
          background: #dbe8f8;
        }

        .nr-program-image {
          object-fit: cover;
          transition:
            transform
              0.8s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );
        }

        .nr-program-card:hover
          .nr-program-image {
          transform: scale(1.12);
        }

        .nr-program-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          color: #7c94ad;
          background:
            linear-gradient(
              145deg,
              #dceafa,
              #edf4fb
            );
        }

        .nr-program-image-placeholder
          svg {
          width: 42px;
          height: 42px;
        }

        .nr-program-image-placeholder
          span {
          font-size: 12px;
          font-weight: 800;
        }

        .nr-program-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              rgba(
                4,
                20,
                43,
                0.02
              )
                0%,
              rgba(
                4,
                20,
                43,
                0.08
              )
                25%,
              rgba(
                4,
                20,
                43,
                0.48
              )
                62%,
              rgba(
                4,
                20,
                43,
                0.92
              )
                100%
            ),
            linear-gradient(
              135deg,
              rgba(
                23,
                111,
                232,
                0.18
              ),
              transparent 45%
            );
        }

        .nr-program-image-meta {
          position: absolute;
          inset-inline-start: 17px;
          inset-inline-end: 17px;
          bottom: 16px;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #fff;
        }

        .nr-program-image-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          padding: 7px 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          background: rgba(7, 27, 58, 0.42);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-image-meta svg {
          width: 14px;
          height: 14px;
        }

        .nr-program-badge {
          position: absolute;
          top: 17px;
          inset-inline-start: 17px;
          z-index: 2;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: 12px;
          border-radius: 999px;
          color: #14335c;
          background: #ffc313;
          box-shadow:
            0 10px 25px
            rgba(
              255,
              195,
              19,
              0.25
            );
          font-size: 11px;
          font-weight: 900;
        }

        .nr-program-index {
          position: absolute;
          inset-inline-end: 17px;
          top: 16px;
          z-index: 2;
          color:
            rgba(
              255,
              255,
              255,
              0.82
            );
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .nr-program-body {
          padding: 20px 21px 19px;
        }

        .nr-program-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .nr-program-category {
          display: block;
          margin-bottom: 6px;
          color: var(--nr-blue);
          font-size: 11px;
          font-weight: 900;
        }

        .nr-program-title-row h3 {
          margin: 0;
          color: var(--nr-text);
          font-size: 19px;
          line-height: 1.4;
        }

        .nr-program-title-row h3 a {
          color: inherit;
          text-decoration: none;
        }

        .nr-program-featured-mark {
          flex: 0 0 auto;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding-inline: 10px;
          border-radius: 999px;
          color: #7a5d00;
          background: rgba(255, 195, 19, 0.14);
          border: 1px solid rgba(255, 195, 19, 0.24);
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nr-program-featured-mark svg {
          width: 13px;
          height: 13px;
        }

        .nr-program-description {
          min-height: 46px;
          margin: 10px 0 14px;
          overflow: hidden;
          color: var(--nr-muted);
          font-size: 12px;
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .nr-program-features {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 7px;
        }

        .nr-program-features span {
          min-width: 0;
          min-height: 62px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 5px;
          border: 1px solid
            var(--nr-border);
          border-radius: 13px;
          color: var(--nr-muted);
          background:
            var(--nr-soft);
          text-align: center;
        }

        .nr-program-features b {
          max-width: 100%;
          overflow: hidden;
          color: var(--nr-text);
          font-size: 12px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nr-program-features small {
          color: var(--nr-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .nr-program-features svg {
          width: 18px;
          height: 18px;
          color: var(--nr-blue);
        }

        .nr-program-divider {
          height: 1px;
          margin: 15px 0;
          background:
            var(--nr-border);
        }

        .nr-program-footer {
          display: flex;
          align-items: flex-end;
          justify-content:
            space-between;
          gap: 12px;
        }

        .nr-program-price small {
          display: block;
          margin-bottom: 7px;
          color: var(--nr-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .nr-program-price strong {
          display: block;
          color: var(--nr-text);
          font-size: 32px;
          font-weight: 900;
          line-height: 1;
        }

        .nr-program-price
          strong
          span {
          margin-inline-start: 4px;
          color: var(--nr-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .nr-program-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .nr-program-details,
        .nr-program-primary {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
          text-decoration: none;
          transition:
            transform 0.2s ease,
            border-color
              0.2s ease,
            box-shadow
              0.2s ease;
        }

        .nr-program-details {
          padding-inline: 12px;
          border: 1px solid
            var(--nr-border);
          color: var(--nr-text);
          background:
            var(--nr-card);
        }

        .nr-program-primary {
          gap: 7px;
          padding-inline: 15px;
          color: #fff;
          background:
            linear-gradient(135deg, var(--nr-blue), #0b59c6);
          box-shadow:
            0 11px 25px
            rgba(
              23,
              111,
              232,
              0.2
            );
        }

        .nr-program-primary svg {
          width: 15px;
          height: 15px;
        }

        .nr-program-details:hover,
        .nr-program-primary:hover {
          transform:
            translateY(-2px);
        }

        .nr-programs-note {
          max-width: 830px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 9px;
          margin: 28px auto 0;
          color: var(--nr-muted);
          text-align: center;
        }

        .nr-programs-note svg {
          flex: 0 0 18px;
          width: 18px;
          height: 18px;
          margin-top: 2px;
          color: var(--nr-blue);
        }

        .nr-programs-note p {
          margin: 0;
          font-size: 11px;
          line-height: 1.7;
        }

        @media (max-width: 1080px) {
          .nr-programs-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (max-width: 760px) {
          .nr-programs-preview {
            padding: 78px 0;
          }

          .nr-programs-heading-row {
            align-items:
              flex-start;
            flex-direction: column;
            gap: 22px;
          }

          .nr-programs-all-link {
            width: 100%;
          }

          .nr-programs-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 22px;
            max-width: 480px;
            margin-inline: auto;
          }

          .nr-program-card { width: 100%; }

          .nr-program-media {
            height: 245px;
          }
        }

        @media (max-width: 430px) {
          .nr-programs-heading h2 {
            font-size: 32px;
          }

          .nr-program-body {
            padding: 19px;
          }

          .nr-program-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .nr-program-actions {
            display: grid;
            grid-template-columns:
              1fr;
          }

          .nr-program-details,
          .nr-program-primary {
            width: 100%;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .nr-program-card,
          .nr-program-image,
          .nr-programs-preview a,
          .nr-programs-preview svg {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
      />

      <path
        d="M8 3v4M16 3v4M3 10h18"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 21s7-4.3 7-11a7 7 0 1 0-14 0c0 6.7 7 11 7 11Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function ProgramPlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
      />

      <circle
        cx="9"
        cy="10"
        r="2"
      />

      <path
        d="m5 18 4.5-4.5 3 3 2-2L19 18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path
        d="M12 11v5M12 8h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}


function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({
  language,
}: {
  language: Language;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {language === "ar" ? (
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
