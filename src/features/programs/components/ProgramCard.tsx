"use client";
import { countLabel, durationLabel, stayNights } from "../../../core/i18n/counts";
import { useState } from "react";
import { MapPin, CalendarDays, BedDouble, Route } from "lucide-react";
import publicStyles from "../../../styles/public-content.module.css";
import Image from "next/image";
import Link from "next/link";
import type { PublicProgram } from "../services/public-programs.service";
import {
  priceDescription,
  travelMode,
  travelLabel,
  upcomingDepartures,
} from "../display";
import { languageHref } from "../../../core/i18n/public-language";
import styles from "./ProgramCard.module.css";
export default function ProgramCard({
  program,
  language,
  returnTo,
  compact = false,
  preview = false,
}: {
  program: PublicProgram;
  language: "ar" | "en";
  returnTo?: string;
  compact?: boolean;
  preview?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const ar = language === "ar",
    facts = program.display,
    dates = upcomingDepartures(facts),
    first = dates[0];
  const origin = facts?.origins
    .map((c) => (ar ? c.nameAr : c.nameEn))
    .join("، ");
  const stays = facts?.stays
    .map(
      (h) => `${ar ? h.nameAr : h.nameEn} · ${stayNights(h.nights, language)}`,
    )
    .join(" / ");
  let href = languageHref(
    "/programs/" + encodeURIComponent(program.slug),
    language,
  );
  if (returnTo?.startsWith("/programs?")) {
    const filters = new URLSearchParams(returnTo.split("?")[1]);
    filters.delete("lang");
    if (filters.size)
      href += "&from=" + encodeURIComponent(languageHref(returnTo, language));
  }
  return (
    <article
      className={`${publicStyles.surface} ${styles.card} ${compact ? styles.compact : ""} ${compact ? "nr-map-program-card" : "nr-all-programs-card"} nr-program-display-card`}
      dir={ar ? "rtl" : "ltr"}
    >
      {!compact && (
        <div className={styles.image}>
          {program.coverUrl && failedSource !== program.coverUrl ? (
            <Image
              src={program.coverUrl}
              alt={
                (ar ? program.coverAltAr : program.coverAltEn) ||
                (ar ? program.titleAr : program.titleEn)
              }
              onError={() => setFailedSource(program.coverUrl)}
              fill
              sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 380px"
              unoptimized
            />
          ) : (
            <span>
              {ar ? "صورة البرنامج غير متوفرة" : "Program image unavailable"}
            </span>
          )}
          {program.isFeatured && (
            <span className={styles.badge}>
              {ar ? "برنامج مختار" : "Featured program"}
            </span>
          )}
        </div>
      )}
      <div className={styles.body}>
        <h3
          className={`${publicStyles.cardTitle} ${styles.title}`}
          title={ar ? program.titleAr : program.titleEn}
        >
          {ar ? program.titleAr : program.titleEn}
        </h3>
        {!compact && (
          <p className={styles.row}>
            <MapPin aria-hidden="true" size={16} />
            <span>
              {origin ? `${origin} · ` : ""}
              {ar ? program.countryNameAr : program.countryNameEn}
            </span>
          </p>
        )}
        <p className={styles.row}>
          <Route aria-hidden="true" size={16} />
          <span>
            {!compact && program.durationNights === 0 ? countLabel(program.durationDays,"day",language) : durationLabel(
              program.durationDays,
              program.durationNights,
              language,
            )}{" "}
            · {travelLabel(travelMode(facts), ar)}
          </span>
        </p>
        {!compact && (
          <p className={`${styles.row} ${styles.summary}`}>
            <BedDouble aria-hidden="true" size={16} />
            <span>
              {stays ||
                (program.durationNights === 0
                  ? ar
                    ? "دون إقامة فندقية"
                    : "No hotel stay"
                  : ar
                    ? "تفاصيل الإقامة غير محددة"
                    : "Accommodation details unspecified")}
            </span>
          </p>
        )}
        {program.displayError ? (
          <p role="alert">
            {ar
              ? "تعذر تحميل معلومات الانطلاق والمواعيد."
              : "Origin and departure details could not be loaded."}
          </p>
        ) : first ? (
          <p className={styles.row}>
            <CalendarDays aria-hidden="true" size={16} />
            <span>
              {ar ? "أقرب موعد: " : "Next departure: "}
              {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
                dateStyle: "medium",
                timeZone: first.timezone || "UTC",
              }).format(new Date(first.startAt))}
            </span>
          </p>
        ) : (
          <p className={styles.row}>
            <CalendarDays aria-hidden="true" size={16} />
            <span>
              {ar
                ? "لا توجد مواعيد قادمة منشورة"
                : "No upcoming published departures"}
            </span>
          </p>
        )}
        <div className={styles.price}>
          <span>{ar ? "السعر الابتدائي" : "Starting price"}</span>
          <strong className={styles.amount} dir="ltr">
            <bdi>
              {Number.isFinite(program.basePrice)
                ? new Intl.NumberFormat(ar ? "ar-SA" : "en-GB", {
                    maximumFractionDigits: 2,
                  }).format(program.basePrice)
                : "—"}
            </bdi>
            <bdi className={styles.currency}>{program.currencyCode}</bdi>
          </strong>
          <small className="program-price-note">
            {priceDescription(facts, ar, compact, program.isDemo)}
          </small>
        </div>
        <Link
          href={preview ? "#program-card-preview" : href}
          onClick={preview ? (e) => e.preventDefault() : undefined}
          aria-disabled={preview || undefined}
        >
          {ar ? "تفاصيل البرنامج" : "Program details"}
        </Link>
      </div>
    </article>
  );
}
