"use client";

import Image from "next/image";
import WebsiteBookingNotice from "../components/WebsiteBookingNotice";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  MapPin,
  Moon,
  Plane,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import usePublicProgramCatalog from "../../src/features/programs/hooks/usePublicProgramCatalog";
import { getProgramCountries, matchesProgramDuration, parseProgramDuration } from "../../src/features/programs/utils/program-discovery";

function formatPrice(
  value: number,
  language: "ar" | "en",
) {
  return new Intl.NumberFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default function PublicProgramsPage() {
  const { language } = useLanguage();
  return <Suspense fallback={<main className="nr-all-programs" dir={language === "ar" ? "rtl" : "ltr"} aria-busy="true"><p>{language === "ar" ? "جارٍ تحميل البرامج..." : "Loading programs..."}</p></main>}><PublicProgramsContent /></Suspense>;
}

function PublicProgramsContent() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [searchValue, setSearchValue] =
    useState("");
  const params = useSearchParams();
  const router = useRouter();
  const countryFilter = params.get("country") || "all";
  const durationFilter = parseProgramDuration(params.get("duration"));
  const updateDiscoveryFilter = (key: "country" | "duration", value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`/programs${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const [flightFilter, setFlightFilter] =
    useState("all");
  const [sortBy, setSortBy] =
    useState("featured");

  const { data: programs = [], isLoading, isError, error } = usePublicProgramCatalog();
  const countries = getProgramCountries(programs, language);

  const visiblePrograms = useMemo(() => {
    const search =
      searchValue.trim().toLowerCase();

    const filtered = programs.filter((program) => {
      const title = isArabic
        ? program.titleAr
        : program.titleEn;

      const summary = isArabic
        ? program.summaryAr
        : program.summaryEn;

      const country = isArabic
        ? program.countryNameAr
        : program.countryNameEn;

      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search) ||
        summary.toLowerCase().includes(search) ||
        country.toLowerCase().includes(search);

      const matchesCountry =
        countryFilter === "all" ||
        program.countryId === countryFilter;

      const matchesDuration = matchesProgramDuration(program.durationDays, durationFilter);

      const matchesFlight =
        flightFilter === "all" ||
        program.flightInclusion === flightFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesDuration &&
        matchesFlight
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") {
        return a.basePrice - b.basePrice;
      }

      if (sortBy === "price-high") {
        return b.basePrice - a.basePrice;
      }

      if (sortBy === "duration-short") {
        return a.durationDays - b.durationDays;
      }

      if (sortBy === "newest") {
        return b.id.localeCompare(a.id);
      }

      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      return 0;
    });
  }, [
    programs,
    searchValue,
    countryFilter,
    durationFilter,
    flightFilter,
    sortBy,
    isArabic,
  ]);

  const clearFilters = () => {
    setSearchValue("");
    router.replace("/programs", { scroll: false });
    setFlightFilter("all");
    setSortBy("featured");
  };
  return (
    <main
      className="nr-all-programs"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="nr-all-programs-hero">
        <div className="nr-all-programs-container">
          <Link
            href="/"
            className="nr-all-programs-back"
          >
            <ArrowLeft size={17} />
            {isArabic
              ? "العودة للرئيسية"
              : "Back Home"}
          </Link>

          <span className="nr-all-programs-kicker">
            <Sparkles size={15} />
            {isArabic
              ? "برامج نور آب"
              : "NourApp Programs"}
          </span>

          <h1>
            {isArabic
              ? "اعثر على برنامج العمرة المناسب لك"
              : "Find the Umrah program that fits you"}
          </h1>

          <p>
            {isArabic
              ? "قارن البرامج حسب الدولة والمدة والطيران والسعر، ثم افتح التفاصيل الكاملة واختر رحلتك بثقة."
              : "Compare programs by country, duration, flights, and price, then review the full details and choose with confidence."}
          </p>
          <WebsiteBookingNotice language={language} />
        </div>
      </section>

      <section className="nr-all-programs-content">
        <div className="nr-all-programs-container">
          <div className="nr-all-programs-marketbar">
            <div className="nr-all-programs-search-wrap">
              <label className="nr-all-programs-search">
                <Search size={18} />

                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) =>
                    setSearchValue(
                      event.target.value,
                    )
                  }
                  placeholder={
                    isArabic
                      ? "ابحث عن برنامج أو دولة..."
                      : "Search program or country..."
                  }
                />
              </label>

              <button
                type="button"
                className="nr-all-programs-filter-chip is-mobile-filter"
              >
                <SlidersHorizontal size={16} />
                {isArabic ? "الفلاتر" : "Filters"}
              </button>
            </div>

            <div className="nr-all-programs-filters">
              <label className="nr-all-programs-select">
                <span>
                  <MapPin size={14} />
                  {isArabic ? "الدولة" : "Country"}
                </span>

                <select
                  value={countryFilter}
                  onChange={(event) =>
                    updateDiscoveryFilter("country", event.target.value)
                  }
                >
                  <option value="all">
                    {isArabic
                      ? "جميع الدول"
                      : "All Countries"}
                  </option>

                  {countries.map((country) => (
                    <option
                      key={country.id}
                      value={country.id}
                    >
                      {country.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select">
                <span>
                  <CalendarDays size={14} />
                  {isArabic ? "المدة" : "Duration"}
                </span>

                <select
                  value={durationFilter}
                  onChange={(event) =>
                    updateDiscoveryFilter("duration", event.target.value)
                  }
                >
                  <option value="all">
                    {isArabic ? "كل المدد" : "Any duration"}
                  </option>
                  <option value="short">
                    {isArabic ? "حتى 5 أيام" : "Up to 5 days"}
                  </option>
                  <option value="medium">
                    {isArabic ? "6 - 9 أيام" : "6 - 9 days"}
                  </option>
                  <option value="long">
                    {isArabic ? "10 أيام فأكثر" : "10+ days"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select">
                <span>
                  <Plane size={14} />
                  {isArabic ? "الطيران" : "Flights"}
                </span>

                <select
                  value={flightFilter}
                  onChange={(event) =>
                    setFlightFilter(
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    {isArabic ? "كل الخيارات" : "Any option"}
                  </option>
                  <option value="included">
                    {isArabic ? "مشمول" : "Included"}
                  </option>
                  <option value="excluded">
                    {isArabic ? "غير مشمول" : "Excluded"}
                  </option>
                  <option value="dynamic">
                    {isArabic ? "ديناميكي" : "Dynamic"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select is-sort">
                <span>
                  <SlidersHorizontal size={14} />
                  {isArabic ? "الترتيب" : "Sort"}
                </span>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value,
                    )
                  }
                >
                  <option value="featured">
                    {isArabic ? "المميز أولًا" : "Featured first"}
                  </option>
                  <option value="price-low">
                    {isArabic ? "السعر: الأقل أولًا" : "Price: low to high"}
                  </option>
                  <option value="price-high">
                    {isArabic ? "السعر: الأعلى أولًا" : "Price: high to low"}
                  </option>
                  <option value="duration-short">
                    {isArabic ? "الأقصر مدة" : "Shortest duration"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>
            </div>
          </div>

          <div className="nr-all-programs-result-row">
            <div>
              <strong>
                {isArabic
                  ? `${visiblePrograms.length} برنامج`
                  : `${visiblePrograms.length} programs`}
              </strong>

              <span>
                {isArabic
                  ? "نتائج متاحة حسب اختياراتك"
                  : "results available for your filters"}
              </span>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="nr-all-programs-clear"
            >
              {isArabic ? "إعادة الضبط" : "Reset"}
            </button>
          </div>

          {isLoading ? (
            <div className="nr-all-programs-state">
              <div className="nr-all-programs-loader" />
              <strong>
                {isArabic
                  ? "جارٍ تحميل البرامج..."
                  : "Loading programs..."}
              </strong>
            </div>
          ) : isError ? (
            <div className="nr-all-programs-state is-error">
              <strong>
                {isArabic
                  ? "تعذر تحميل البرامج"
                  : "Unable to load programs"}
              </strong>

              <p>
                {error instanceof Error
                  ? error.message
                  : ""}
              </p>
            </div>
          ) : visiblePrograms.length === 0 ? (
            <div className="nr-all-programs-state">
              <strong>
                {programs.length === 0
                  ? (isArabic ? "لا توجد برامج متاحة حاليًا" : "No programs are available right now")
                  : (isArabic ? "لا توجد برامج مطابقة" : "No matching programs")}
              </strong>

              <p>
                {programs.length === 0
                  ? (isArabic ? "يسعد فريق نور آب بالإجابة عن استفساراتك حول البرامج والخدمات." : "The NourApp team is here to answer your questions about programs and services.")
                  : (isArabic ? "جرّب تغيير كلمات البحث أو اختيار دولة أخرى." : "Try another search or country.")}
              </p>
              {programs.length === 0 ? (
                <Link href="/#contact" className="nr-all-programs-details">
                  {isArabic ? "تواصل معنا" : "Contact us"}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="nr-all-programs-grid">
              {visiblePrograms.map(
                (program) => {
                  const title = isArabic
                    ? program.titleAr
                    : program.titleEn;

                  const summary = isArabic
                    ? program.summaryAr
                    : program.summaryEn;

                  const country = isArabic
                    ? program.countryNameAr
                    : program.countryNameEn;

                  const flightLabel =
                    program.flightInclusion ===
                    "included"
                      ? isArabic
                        ? "الطيران مشمول"
                        : "Flights included"
                      : program.flightInclusion ===
                          "excluded"
                        ? isArabic
                          ? "الطيران غير مشمول"
                          : "Flights excluded"
                        : isArabic
                          ? "سعر الطيران ديناميكي"
                          : "Dynamic flight price";

                  return (
                    <article
                      key={program.id}
                      className="nr-all-programs-card"
                    >
                      <Link
                        href={`/programs/${program.slug}`}
                        className="nr-all-programs-image"
                      >
                        {program.coverUrl ? (
                          <Image
                            src={program.coverUrl}
                            alt={title}
                            fill
                            unoptimized
                          />
                        ) : (
                          <div className="nr-all-programs-placeholder">
                            <Sparkles />
                          </div>
                        )}

                        <span
                          className="nr-all-programs-image-overlay"
                          aria-hidden="true"
                        />

                        <div className="nr-all-programs-image-meta">
                          <span>
                            <MapPin size={13} />
                            {country ||
                              (isArabic
                                ? "برنامج عمرة"
                                : "Umrah program")}
                          </span>

                          <span>
                            <CalendarDays size={13} />
                            {program.durationDays}{" "}
                            {isArabic ? "أيام" : "days"}
                          </span>
                        </div>

                        {program.isFeatured ? (
                          <span className="nr-all-programs-featured">
                            <Sparkles size={13} />
                            {isArabic
                              ? "مختار"
                              : "Selected"}
                          </span>
                        ) : null}
                      </Link>

                      <div className="nr-all-programs-card-body">
                        {country ? (
                          <span className="nr-all-programs-country">
                            <MapPin size={14} />
                            {country}
                          </span>
                        ) : null}

                        <h2>
                          <Link
                            href={`/programs/${program.slug}`}
                          >
                            {title}
                          </Link>
                        </h2>

                        {summary ? (
                          <p>{summary}</p>
                        ) : null}

                        <div className="nr-all-programs-meta">
                          <span>
                            <CalendarDays />
                            {program.durationDays}{" "}
                            {isArabic
                              ? "أيام"
                              : "days"}
                          </span>

                          <span>
                            <Moon />
                            {program.durationNights}{" "}
                            {isArabic
                              ? "ليالٍ"
                              : "nights"}
                          </span>

                          <span>
                            <Plane />
                            {flightLabel}
                          </span>
                        </div>

                        <div className="nr-all-programs-card-footer">
                          <div>
                            <small>
                              {isArabic
                                ? "يبدأ من"
                                : "Starting from"}
                            </small>

                            <strong>
                              {formatPrice(
                                program.basePrice,
                                language,
                              )}{" "}
                              <span>
                                {
                                  program.currencyCode
                                }
                              </span>
                            </strong>
                          </div>

                          <Link
                            href={`/programs/${program.slug}`}
                            className="nr-all-programs-details"
                          >
                            {isArabic
                              ? "تفاصيل البرنامج"
                              : "Program details"}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .nr-all-programs {
          min-height: 100vh;
          color: #14253d;
          background: #f5f8fd;
        }

        .nr-all-programs-container {
          width: min(1360px, calc(100% - 56px));
          margin-inline: auto;
        }

        .nr-all-programs-hero {
          position: relative;
          overflow: hidden;
          padding: 34px 0 58px;
          color: #fff;
          background:
            radial-gradient(
              circle at 12% 20%,
              rgba(23, 111, 232, 0.28),
              transparent 34%
            ),
            radial-gradient(
              circle at 85% 80%,
              rgba(255, 195, 19, 0.11),
              transparent 30%
            ),
            #081b30;
        }

        .nr-all-programs-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 38px;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        [dir="rtl"] .nr-all-programs-back svg {
          transform: rotate(180deg);
        }

        .nr-all-programs-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding-inline: 12px;
          border: 1px solid rgba(23, 111, 232, 0.35);
          border-radius: 999px;
          color: #8fc4ff;
          background: rgba(23, 111, 232, 0.1);
          font-size: 11px;
          font-weight: 900;
        }

        .nr-all-programs-hero h1 {
          max-width: 900px;
          margin: 17px 0 12px;
          font-size: clamp(36px, 4.4vw, 58px);
          line-height: 1.16;
          letter-spacing: -0.035em;
        }

        .nr-all-programs-hero p {
          max-width: 850px;
          margin: 0;
          color: rgba(255, 255, 255, 0.67);
          font-size: 14px;
          line-height: 1.9;
        }

        .nr-all-programs-content {
          padding: 32px 0 72px;
        }

        .nr-all-programs-marketbar {
          display: grid;
          gap: 12px;
          padding: 14px;
          border: 1px solid #dce5f0;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 48px rgba(20, 59, 102, 0.07);
        }

        .nr-all-programs-search-wrap {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .nr-all-programs-search {
          min-height: 44px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding-inline: 14px;
          border: 1px solid #dce5f0;
          border-radius: 14px;
          background: #f8fafd;
        }

        .nr-all-programs-search svg {
          flex: 0 0 auto;
          color: #176fe8;
        }

        .nr-all-programs-search input {
          width: 100%;
          border: 0;
          outline: 0;
          color: #14253d;
          background: transparent;
          font: inherit;
        }

        .nr-all-programs-filters {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .nr-all-programs-select {
          position: relative;
          min-height: 58px;
          display: flex;
          align-items: center;
          padding: 8px 38px 8px 12px;
          border: 1px solid #dce5f0;
          border-radius: 14px;
          background: #f8fafd;
        }

        [dir="rtl"] .nr-all-programs-select {
          padding: 8px 12px 8px 38px;
        }

        .nr-all-programs-select > span {
          position: absolute;
          top: 7px;
          inset-inline-start: 11px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #7d8da2;
          font-size: 9px;
          font-weight: 900;
          pointer-events: none;
        }

        .nr-all-programs-select > span svg {
          color: #176fe8;
        }

        .nr-all-programs-select > svg {
          position: absolute;
          inset-inline-end: 12px;
          bottom: 14px;
          color: #8796aa;
          pointer-events: none;
        }

        .nr-all-programs-select select {
          width: 100%;
          margin-top: 12px;
          border: 0;
          outline: 0;
          appearance: none;
          color: #14253d;
          background: transparent;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-all-programs-filter-chip {
          display: none;
        }

        .nr-all-programs-result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin: 26px 0 14px;
          color: #61738a;
          font-size: 12px;
        }

        .nr-all-programs-result-row > div {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .nr-all-programs-result-row strong {
          color: #17304f;
          font-size: 15px;
        }

        .nr-all-programs-result-row span {
          color: #8a98aa;
          font-size: 10px;
        }

        .nr-all-programs-clear {
          border: 0;
          color: #176fe8;
          background: transparent;
          font: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .nr-all-programs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .nr-all-programs-card {
          overflow: hidden;
          border: 1px solid #dce5f0;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 18px 48px rgba(20, 59, 102, 0.07);
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .nr-all-programs-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 58px rgba(20, 59, 102, 0.11);
        }

        .nr-all-programs-image {
          position: relative;
          height: 230px;
          display: block;
          overflow: hidden;
          background: #e7edf5;
        }

        .nr-all-programs-image img {
          object-fit: cover;
          transition: transform 320ms ease;
        }

        .nr-all-programs-card:hover
          .nr-all-programs-image img {
          transform: scale(1.035);
        }

        .nr-all-programs-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #8ba0b7;
        }

        .nr-all-programs-placeholder svg {
          width: 42px;
          height: 42px;
        }

        .nr-all-programs-image-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              rgba(5, 18, 35, 0.03) 0%,
              rgba(5, 18, 35, 0.05) 44%,
              rgba(5, 18, 35, 0.7) 100%
            );
          pointer-events: none;
        }

        .nr-all-programs-image-meta {
          position: absolute;
          inset-inline: 14px;
          bottom: 13px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #fff;
        }

        .nr-all-programs-image-meta span {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          background: rgba(8, 27, 51, .42);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-size: 9px;
          font-weight: 900;
        }

        .nr-all-programs-featured {
          position: absolute;
          top: 14px;
          inset-inline-start: 14px;
          z-index: 2;
          min-height: 31px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding-inline: 10px;
          border-radius: 999px;
          color: #17304f;
          background: #ffc313;
          font-size: 10px;
          font-weight: 900;
        }

        .nr-all-programs-card-body {
          padding: 19px;
        }

        .nr-all-programs-country {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #176fe8;
          font-size: 10px;
          font-weight: 900;
        }

        .nr-all-programs-card h2 {
          margin: 8px 0 10px;
          font-size: 20px;
          line-height: 1.35;
        }

        .nr-all-programs-card h2 a {
          color: #14253d;
          text-decoration: none;
        }

        .nr-all-programs-card-body > p {
          min-height: 52px;
          margin: 0;
          overflow: hidden;
          color: #708198;
          font-size: 12px;
          line-height: 1.75;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .nr-all-programs-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }

        .nr-all-programs-meta span {
          min-height: 31px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding-inline: 8px;
          border-radius: 9px;
          color: #61738a;
          background: #f5f8fd;
          font-size: 9px;
          font-weight: 800;
        }

        .nr-all-programs-meta svg {
          width: 13px;
          color: #176fe8;
        }

        .nr-all-programs-card-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: 17px;
          padding-top: 16px;
          border-top: 1px solid #edf1f6;
        }

        .nr-all-programs-card-footer > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nr-all-programs-card-footer small {
          color: #8a98aa;
          font-size: 9px;
        }

        .nr-all-programs-card-footer strong {
          color: #176fe8;
          font-size: 19px;
        }

        .nr-all-programs-card-footer strong span {
          color: #728197;
          font-size: 10px;
        }

        .nr-all-programs-details {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding-inline: 13px;
          border-radius: 10px;
          color: #fff;
          background: linear-gradient(135deg, #176fe8, #0d58be);
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
        }

        .nr-all-programs-state {
          min-height: 300px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          padding: 30px;
          color: #697c94;
          text-align: center;
        }

        .nr-all-programs-state strong {
          color: #17304f;
          font-size: 20px;
        }

        .nr-all-programs-state p {
          margin: 0;
          font-size: 12px;
        }

        .nr-all-programs-state.is-error strong {
          color: #b42318;
        }

        .nr-all-programs-loader {
          width: 32px;
          height: 32px;
          border: 3px solid #dce5f0;
          border-top-color: #176fe8;
          border-radius: 50%;
          animation: nrAllProgramsSpin 0.8s linear infinite;
        }

        @keyframes nrAllProgramsSpin {
          to {
            transform: rotate(360deg);
          }
        }


        html[data-theme="dark"] .nr-all-programs {
          color: #f4f8ff;
          background: #07182c;
        }

        html[data-theme="dark"] .nr-all-programs-content {
          background: #07182c;
        }

        html[data-theme="dark"] .nr-all-programs-marketbar,
        html[data-theme="dark"] .nr-all-programs-card {
          border-color: rgba(255,255,255,.1);
          background: #0c223d;
          box-shadow: 0 18px 48px rgba(0,0,0,.22);
        }

        html[data-theme="dark"] .nr-all-programs-search,
        html[data-theme="dark"] .nr-all-programs-select,
        html[data-theme="dark"] .nr-all-programs-meta span {
          border-color: rgba(255,255,255,.08);
          background: rgba(255,255,255,.04);
        }

        html[data-theme="dark"] .nr-all-programs-search input,
        html[data-theme="dark"] .nr-all-programs-select select,
        html[data-theme="dark"] .nr-all-programs-card h2 a,
        html[data-theme="dark"] .nr-all-programs-result-row strong,
        html[data-theme="dark"] .nr-all-programs-state strong {
          color: #f4f8ff;
        }

        html[data-theme="dark"] .nr-all-programs-card-body > p,
        html[data-theme="dark"] .nr-all-programs-result-row,
        html[data-theme="dark"] .nr-all-programs-result-row span,
        html[data-theme="dark"] .nr-all-programs-meta span,
        html[data-theme="dark"] .nr-all-programs-card-footer small {
          color: #a8b6c8;
        }

        html[data-theme="dark"] .nr-all-programs-card-footer {
          border-top-color: rgba(255,255,255,.08);
        }

        @media (min-width: 1500px) {
          .nr-all-programs-container {
            width: min(1460px, calc(100% - 72px));
          }

          .nr-all-programs-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .nr-all-programs-image {
            height: 205px;
          }
        }

        @media (min-width: 921px) and (max-width: 1366px) {
          .nr-all-programs-container {
            width: min(1200px, calc(100% - 40px));
          }

          .nr-all-programs-hero h1 {
            font-size: clamp(34px, 4.2vw, 50px);
          }

          .nr-all-programs-grid {
            gap: 16px;
          }
        }

        @media (max-width: 980px) {
          .nr-all-programs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .nr-all-programs-hero {
            padding-bottom: 54px;
          }

          .nr-all-programs-back {
            margin-bottom: 34px;
          }

          .nr-all-programs-filters {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nr-all-programs-grid {
            grid-template-columns: 1fr;
          }

          .nr-all-programs-image {
            height: 225px;
          }
        }

        @media (max-width: 700px) {
          .nr-all-programs-marketbar {
            padding: 11px;
          }

          .nr-all-programs-filters {
            grid-template-columns: 1fr;
          }

          .nr-all-programs-result-row {
            align-items: flex-start;
          }

          .nr-all-programs-result-row > div {
            align-items: flex-start;
            flex-direction: column;
            gap: 3px;
          }
        }

        @media (max-width: 480px) {
          .nr-all-programs-container {
            width: min(100% - 22px, 1180px);
          }

          .nr-all-programs-hero h1 {
            font-size: 38px;
          }

          .nr-all-programs-card-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .nr-all-programs-details {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
