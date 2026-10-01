"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { Language } from "../../../data/home";
import { createClient } from "../../../../src/lib/supabase/client";
import {
  getPublicCountries,
  type PublicCountry,
} from "../../../../src/features/countries/services";
import styles from "./NourWorldMap.module.css";

type Props = { language: Language };
type MapPosition = { x: number; y: number };
type MapProgramRow = {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  duration_days: number;
  duration_nights: number;
  base_price: number | string;
  currency_code: string;
  is_featured: boolean;
  cover_media:
    | { bucket: string; path: string }
    | { bucket: string; path: string }[]
    | null;
};
type MapProgram = {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  currencyCode: string;
  isFeatured: boolean;
  coverUrl: string | null;
};

const SAUDI_ISO2 = "SA";
const MAKKAH_COORDINATES = { latitude: 21.4225, longitude: 39.8262 };

function coordinatesToMapPosition(latitude: number, longitude: number): MapPosition {
  const x = ((longitude + 180) / 360) * 100;
  const y = ((90 - latitude) / 180) * 100;
  return {
    x: Math.min(Math.max(x, 1.5), 98.5),
    y: Math.min(Math.max(y, 2), 98),
  };
}

function getProgramsLabel(country: PublicCountry, isArabic: boolean): string {
  const count = country.publishedProgramsCount;
  if (isArabic) {
    if (count === 0) return "لا توجد برامج منشورة حاليًا";
    if (count === 1) return "برنامج واحد متاح";
    if (count === 2) return "برنامجان متاحان";
    if (count >= 3 && count <= 10) return `${count} برامج متاحة`;
    return `${count} برنامجًا متاحًا`;
  }
  if (count === 0) return "No published programs yet";
  if (count === 1) return "1 program available";
  return `${count} programs available`;
}

function buildRoutePath(from: MapPosition, to: MapPosition) {
  const midX = (from.x + to.x) / 2;
  const lift = Math.max(6, Math.min(15, Math.abs(from.x - to.x) * 0.08));
  return `M${from.x} ${from.y} C${midX} ${from.y - lift}, ${midX} ${to.y - lift * 0.72}, ${to.x} ${to.y}`;
}

function getCoverMedia(media: MapProgramRow["cover_media"]) {
  if (!media) return null;
  return Array.isArray(media) ? media[0] ?? null : media;
}

function formatPrice(value: number, language: Language) {
  return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(days: number, nights: number, isArabic: boolean) {
  if (isArabic) return `${days} أيام · ${nights} ليالٍ`;
  return `${days} days · ${nights} nights`;
}

async function loadCountryPrograms(
  supabase: ReturnType<typeof createClient>,
  countryId: string,
): Promise<MapProgram[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id,
      title_ar,
      title_en,
      slug,
      duration_days,
      duration_nights,
      base_price,
      currency_code,
      is_featured,
      cover_media:media!programs_cover_media_id_fkey (
        bucket,
        path
      )
    `)
    .eq("country_id", countryId)
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw new Error(`Failed to load map programs: ${error.message}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return ((data ?? []) as MapProgramRow[]).map((program) => {
    const cover = getCoverMedia(program.cover_media);
    return {
      id: program.id,
      titleAr: program.title_ar,
      titleEn: program.title_en,
      slug: program.slug,
      durationDays: program.duration_days,
      durationNights: program.duration_nights,
      basePrice: Number(program.base_price) || 0,
      currencyCode: program.currency_code,
      isFeatured: program.is_featured,
      coverUrl: cover && supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/${cover.bucket}/${cover.path}`
        : null,
    };
  });
}

export default function NourWorldMap({ language }: Props) {
  const isArabic = language === "ar";
  const shouldReduceMotion = useReducedMotion();
  const supabase = useMemo(() => createClient(), []);
  const [requestedActiveId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const countriesQuery = useQuery({
    queryKey: ["public", "map-countries"],
    queryFn: () => getPublicCountries(supabase),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const countries = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);
  const countriesWithPositions = useMemo(
    () => countries.map((country) => ({
      ...country,
      position: coordinatesToMapPosition(country.latitude, country.longitude),
    })),
    [countries],
  );

  const makkahPosition = useMemo(
    () => coordinatesToMapPosition(MAKKAH_COORDINATES.latitude, MAKKAH_COORDINATES.longitude),
    [],
  );

  const activeId = countriesWithPositions.some((country) => country.id === requestedActiveId)
    ? requestedActiveId
    : (countriesWithPositions.find((country) => country.iso2 !== SAUDI_ISO2 && country.hasPublishedPrograms)
      ?? countriesWithPositions[0])?.id ?? null;

  const activeCountry = useMemo(
    () => countriesWithPositions.find((country) => country.id === activeId)
      ?? countriesWithPositions[0]
      ?? null,
    [countriesWithPositions, activeId],
  );

  const selectedCountry = useMemo(
    () => selectedId
      ? countriesWithPositions.find((country) => country.id === selectedId) ?? null
      : null,
    [countriesWithPositions, selectedId],
  );

  if (selectedId && !countriesWithPositions.some((country) => country.id === selectedId)) {
    setSelectedId(null);
    setSelectedProgramId(null);
  }

  const programsQuery = useQuery({
    queryKey: ["public", "map-country-programs", selectedCountry?.id],
    queryFn: () => loadCountryPrograms(supabase, selectedCountry!.id),
    enabled: Boolean(selectedCountry?.hasPublishedPrograms),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const selectedProgram = useMemo(
    () => programsQuery.data?.find((program) => program.id === selectedProgramId) ?? null,
    [programsQuery.data, selectedProgramId],
  );

  const publishedProgramsCount = useMemo(
    () => countries.reduce((total, country) => total + country.publishedProgramsCount, 0),
    [countries],
  );
  const countriesWithProgramsCount = useMemo(
    () => countries.filter((country) => country.hasPublishedPrograms).length,
    [countries],
  );

  useEffect(() => {
    if (paused || selectedId || shouldReduceMotion || countriesWithPositions.length <= 1) return;
    const availableCountries = countriesWithPositions.filter(
      (country) => country.iso2 !== SAUDI_ISO2 && country.hasPublishedPrograms,
    );
    if (availableCountries.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveId((currentId) => {
        const currentIndex = availableCountries.findIndex((country) => country.id === (currentId ?? activeId));
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % availableCountries.length;
        return availableCountries[nextIndex].id;
      });
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused, selectedId, shouldReduceMotion, countriesWithPositions, activeId]);

  const ctaCountry = selectedCountry ?? activeCountry;
  const journeyCountry = selectedCountry ?? activeCountry;
  const highlightedId = selectedId ?? activeId;
  const activeProgramsUrl = ctaCountry
    ? `/programs?country=${encodeURIComponent(ctaCountry.id)}`
    : "/programs";
  const selectedProgramUrl = selectedProgram
    ? `/programs/${encodeURIComponent(selectedProgram.slug)}`
    : null;

  const routeCountries = useMemo(
    () => countriesWithPositions.filter(
      (country) => country.iso2 !== SAUDI_ISO2 && country.hasPublishedPrograms,
    ),
    [countriesWithPositions],
  );

  const focusedPosition = selectedCountry?.position;
  const programFocusActive = Boolean(selectedProgram);

  const selectCountry = (countryId: string) => {
    setActiveId(countryId);
    setSelectedId((current) => current === countryId ? null : countryId);
    setSelectedProgramId(null);
  };

  return (
    <motion.section
      className={styles.panel}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className={styles.sectionIntro}>
        <span className={styles.eyebrow}>{isArabic ? "من العالم إلى مكة" : "From the world to Makkah"}</span>
        <h3>{isArabic ? "اكتشف من أين تبدأ رحلتك إلى مكة" : "Discover where your journey to Makkah begins"}</h3>
        <p>
          {isArabic
            ? "اختر دولتك وشاهد البرامج المتاحة والمسار الذي يربط رحلتك بمكة المكرمة."
            : "Choose your country, view available programs, and see the route connecting your journey to Makkah."}
        </p>
      </header>

      <div className={styles.mapExperience}>
        <div className={styles.mapHeader}>
          <div>
            <small>{isArabic ? "شبكة نور للرحلات" : "Nour journey network"}</small>
            <strong>{isArabic ? "رحلات تنطلق من دول متعددة إلى مكة" : "Journeys connecting multiple countries to Makkah"}</strong>
          </div>
          <span className={styles.live}>
            <i />
            {countriesQuery.isFetching
              ? isArabic ? "جارٍ التحديث" : "Updating"
              : isArabic ? "متصلة بالمنصة" : "Connected"}
          </span>
        </div>

        <div className={styles.map}>
          <div
            className={styles.mapStage}
            style={{
              transform: selectedCountry && !shouldReduceMotion ? "scale(1.075)" : "scale(1)",
              transformOrigin: focusedPosition
                ? `${focusedPosition.x}% ${focusedPosition.y}%`
                : "50% 50%",
              transition: shouldReduceMotion
                ? "none"
                : "transform 700ms cubic-bezier(.22,1,.36,1), transform-origin 700ms cubic-bezier(.22,1,.36,1)",
            }}
          >
            <img className={styles.realisticMap} src="/images/site/world-map-white.svg" alt="" aria-hidden="true" />

            <svg className={styles.routes} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="nourRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#176fe8" stopOpacity="0.28" />
                  <stop offset="62%" stopColor="#2aa9e9" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#ffc313" stopOpacity="1" />
                </linearGradient>
                <filter id="nourRouteGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.75" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {routeCountries.map((country, index) => {
                const routePath = buildRoutePath(country.position, makkahPosition);
                const isHighlighted = country.id === highlightedId;
                return (
                  <g key={country.id}>
                    <motion.path
                      d={routePath}
                      className={isHighlighted ? styles.routeBaseActive : styles.routeBase}
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      animate={isHighlighted && programFocusActive ? { opacity: 1 } : undefined}
                      style={isHighlighted && programFocusActive
                        ? { filter: "drop-shadow(0 0 2px rgba(255,195,19,.9))" }
                        : undefined}
                      transition={{ duration: 1.25, delay: 0.24 + index * 0.11, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.path
                      d={routePath}
                      className={isHighlighted ? styles.routeTravelerActive : styles.routeTraveler}
                      strokeDasharray="0.6 3.6"
                      animate={{
                        strokeDashoffset: shouldReduceMotion ? 0 : [0, -16],
                        opacity: isHighlighted ? 1 : 0.28,
                      }}
                      transition={shouldReduceMotion ? { duration: 0 } : {
                        strokeDashoffset: {
                          duration: isHighlighted && programFocusActive ? 2.1 : 3.2 + index * 0.22,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    />
                    {isHighlighted && !shouldReduceMotion ? (
                      <circle r={programFocusActive ? "1.15" : "0.9"} fill="#ffc313" filter="url(#nourRouteGlow)">
                        <animateMotion dur={programFocusActive ? "3.2s" : "3.8s"} repeatCount="indefinite" path={routePath} />
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.84;1" dur={programFocusActive ? "3.2s" : "3.8s"} repeatCount="indefinite" />
                      </circle>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            <motion.div
              className={styles.makkahMarker}
              style={{ left: `${makkahPosition.x}%`, top: `${makkahPosition.y}%` }}
              initial={{ opacity: 0, scale: 0.55 }}
              whileInView={{ opacity: 1, scale: programFocusActive ? 1.08 : 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className={styles.makkahPulse} />
              <span className={styles.makkahCore}><KaabaIcon /></span>
              <strong>{isArabic ? "مكة" : "Makkah"}</strong>
            </motion.div>

            {countriesWithPositions.map((country) => {
              if (country.iso2 === SAUDI_ISO2) return null;
              const isActive = country.id === activeId;
              const isSelected = country.id === selectedId;
              return (
                <button
                  key={country.id}
                  type="button"
                  className={[
                    styles.point,
                    country.hasPublishedPrograms ? styles.availablePoint : styles.inactivePoint,
                    isActive ? styles.activePoint : "",
                    isSelected ? "nr-map-selected-point" : "",
                  ].filter(Boolean).join(" ")}
                  style={{ left: `${country.position.x}%`, top: `${country.position.y}%` }}
                  onMouseEnter={() => {
                    if (!selectedId) setActiveId(country.id);
                    setPaused(true);
                  }}
                  onMouseLeave={() => setPaused(false)}
                  onClick={() => selectCountry(country.id)}
                  aria-label={isArabic ? `عرض برامج ${country.nameAr}` : `Show programs for ${country.nameEn}`}
                  aria-pressed={isSelected}
                >
                  <span />
                  <small>{isArabic ? country.nameAr : country.nameEn}</small>
                </button>
              );
            })}

            {countriesQuery.isLoading ? (
              <div className={styles.mapState}>{isArabic ? "جارٍ تحميل الدول..." : "Loading countries..."}</div>
            ) : null}
            {countriesQuery.isError ? (
              <div className={styles.mapState} role="alert">{isArabic ? "تعذر تحميل دول الخريطة." : "Unable to load map countries."}</div>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            {selectedCountry ? (
              <motion.article
                key={selectedCountry.id}
                className={styles.countryCard}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22 }}
              >
                <button
                  type="button"
                  className={styles.cardClose}
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedProgramId(null);
                  }}
                  aria-label={isArabic ? "إغلاق بطاقة الدولة" : "Close country card"}
                >×</button>
                <span className={styles.pin}><LocationIcon /></span>
                <div>
                  <small>{isArabic ? "نقطة الانطلاق" : "Starting point"}</small>
                  <strong>{isArabic ? selectedCountry.nameAr : selectedCountry.nameEn}</strong>
                  <small>{getProgramsLabel(selectedCountry, isArabic)}</small>
                </div>
              </motion.article>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {journeyCountry ? (
              <motion.div
                key={`${journeyCountry.id}-${selectedProgram?.id ?? "country"}`}
                className="nr-map-focus-journey"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.24 }}
              >
                <div className="nr-map-focus-topline">
                  <span className="nr-map-focus-label">{isArabic ? "مسار رحلتك" : "Your journey"}</span>
                  {journeyCountry.flagUrl ? (
                    <img src={journeyCountry.flagUrl} alt="" aria-hidden="true" className="nr-map-focus-flag" />
                  ) : null}
                </div>
                <div className="nr-map-focus-route">
                  <strong>{isArabic ? journeyCountry.nameAr : journeyCountry.nameEn}</strong>
                  <span className="nr-map-focus-line">
                    <span className="nr-map-focus-dot" aria-hidden="true" />
                  </span>
                  <strong>{isArabic ? "مكة" : "Makkah"}</strong>
                </div>

                {selectedProgram ? (
                  <div className="nr-map-focus-program">
                    <span>{isArabic ? "البرنامج المختار" : "Selected program"}</span>
                    <strong>{isArabic ? selectedProgram.titleAr : selectedProgram.titleEn}</strong>
                    <div>
                      <small>{formatDuration(selectedProgram.durationDays, selectedProgram.durationNights, isArabic)}</small>
                      <b>{formatPrice(selectedProgram.basePrice, language)} {selectedProgram.currencyCode}</b>
                    </div>
                    {selectedProgramUrl ? (
                      <a href={selectedProgramUrl}>
                        {isArabic ? "عرض تفاصيل البرنامج" : "View program details"}
                        <ArrowIcon isArabic={isArabic} />
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <div className="nr-map-focus-summary">
                    <small>{getProgramsLabel(journeyCountry, isArabic)}</small>
                    {journeyCountry.hasPublishedPrograms ? (
                      <a href={`/programs?country=${encodeURIComponent(journeyCountry.id)}`}>
                        {isArabic ? "استعرض الرحلات" : "Explore journeys"}
                        <ArrowIcon isArabic={isArabic} />
                      </a>
                    ) : null}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <motion.aside
          className={styles.floatingPanel}
          initial={{ opacity: 0, x: isArabic ? 34 : -34 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.panelKicker}>
            {selectedCountry
              ? isArabic ? "الدولة المختارة" : "Selected country"
              : isArabic ? "اختر نقطة الانطلاق" : "Choose your starting point"}
          </span>
          <h4>
            {ctaCountry
              ? isArabic ? `اكتشف برامج ${ctaCountry.nameAr}` : `Explore programs from ${ctaCountry.nameEn}`
              : isArabic ? "اختر دولتك" : "Choose your country"}
          </h4>
          <p>
            {ctaCountry
              ? getProgramsLabel(ctaCountry, isArabic)
              : isArabic ? "اختر نقطة على الخريطة لعرض البرامج." : "Select a point on the map to view programs."}
          </p>

          <div className={styles.metrics}>
            <div><strong>{countries.length}</strong><span>{isArabic ? "دولة مفعّلة" : "Active countries"}</span></div>
            <div><strong>{countriesWithProgramsCount}</strong><span>{isArabic ? "دول لديها برامج" : "With programs"}</span></div>
            <div><strong>{publishedProgramsCount}</strong><span>{isArabic ? "برنامج منشور" : "Programs"}</span></div>
          </div>

          {ctaCountry?.hasPublishedPrograms ? (
            <a className={styles.cta} href={activeProgramsUrl}>
              <span>{isArabic ? `استعرض برامج ${ctaCountry.nameAr}` : `Explore ${ctaCountry.nameEn} programs`}</span>
              <ArrowIcon isArabic={isArabic} />
            </a>
          ) : (
            <span className={`${styles.cta} nr-map-cta-disabled`} aria-disabled="true">
              <span>{isArabic ? "لا توجد برامج متاحة حاليًا" : "No programs available yet"}</span>
            </span>
          )}
        </motion.aside>

        <AnimatePresence mode="wait">
          {selectedCountry?.hasPublishedPrograms ? (
            <motion.section
              key={selectedCountry.id}
              className="nr-map-programs"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              aria-label={isArabic ? "برامج الدولة المختارة" : "Programs from selected country"}
            >
              <div className="nr-map-programs-head">
                <div>
                  <span>{isArabic ? "اختر برنامجًا لتخصيص المسار" : "Select a program to focus the journey"}</span>
                  <strong>
                    {isArabic
                      ? `برامج ${selectedCountry.nameAr}`
                      : `${selectedCountry.nameEn} programs`}
                  </strong>
                </div>
                <a href={activeProgramsUrl}>
                  {isArabic ? "عرض الكل" : "View all"}
                  <ArrowIcon isArabic={isArabic} />
                </a>
              </div>

              {programsQuery.isLoading ? (
                <div className="nr-map-programs-state">
                  {isArabic ? "جارٍ تحميل البرامج..." : "Loading programs..."}
                </div>
              ) : null}

              {programsQuery.isError ? (
                <div className="nr-map-programs-state" role="alert">
                  {isArabic ? "تعذر تحميل البرامج حاليًا." : "Unable to load programs right now."}
                </div>
              ) : null}

              {!programsQuery.isLoading && !programsQuery.isError && (programsQuery.data?.length ?? 0) === 0 ? (
                <div className="nr-map-programs-state">
                  {isArabic ? "لا توجد برامج منشورة حاليًا." : "No published programs right now."}
                </div>
              ) : null}

              {(programsQuery.data?.length ?? 0) > 0 ? (
                <div className="nr-map-programs-grid">
                  {programsQuery.data!.map((program) => {
                    const title = isArabic ? program.titleAr : program.titleEn;
                    const isProgramSelected = program.id === selectedProgramId;
                    return (
                      <button
                        key={program.id}
                        type="button"
                        className={`nr-map-program-card ${isProgramSelected ? "nr-map-program-card-selected" : ""}`}
                        onClick={() => setSelectedProgramId((current) => current === program.id ? null : program.id)}
                        aria-label={isArabic ? `اختيار ${title}` : `Select ${title}`}
                        aria-pressed={isProgramSelected}
                      >
                        <div className="nr-map-program-media">
                          {program.coverUrl ? (
                            <img src={program.coverUrl} alt="" aria-hidden="true" />
                          ) : (
                            <div className="nr-map-program-placeholder"><KaabaIcon /></div>
                          )}
                          {program.isFeatured ? (
                            <span>{isArabic ? "مميز" : "Featured"}</span>
                          ) : null}
                          {isProgramSelected ? (
                            <em>{isArabic ? "مختار" : "Selected"}</em>
                          ) : null}
                        </div>
                        <div className="nr-map-program-body">
                          <strong>{title}</strong>
                          <small>{formatDuration(program.durationDays, program.durationNights, isArabic)}</small>
                          <div>
                            <span>{isArabic ? "ابتداءً من" : "From"}</span>
                            <b>{formatPrice(program.basePrice, language)} {program.currencyCode}</b>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </motion.section>
          ) : null}
        </AnimatePresence>

        {countriesWithPositions.length > 0 ? (
          <div className={styles.locationTabs}>
            {countriesWithPositions
              .filter((country) => country.iso2 !== SAUDI_ISO2)
              .map((country) => {
                const isSelected = country.id === selectedId;
                const isHighlighted = country.id === highlightedId;
                return (
                  <button
                    key={country.id}
                    type="button"
                    className={[
                      isHighlighted ? styles.activeTab : "",
                      isSelected ? "nr-map-selected-tab" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => selectCountry(country.id)}
                    aria-pressed={isSelected}
                  >
                    {isArabic ? country.nameAr : country.nameEn}
                    {country.hasPublishedPrograms ? <span>{country.publishedProgramsCount}</span> : null}
                  </button>
                );
              })}
          </div>
        ) : null}

        <p className={styles.mapHint}>
          {selectedProgram
            ? isArabic
              ? "تم تخصيص مسار الرحلة حسب البرنامج المختار. اضغط على البطاقة مرة أخرى لإلغاء الاختيار."
              : "The journey is focused on your selected program. Select the card again to clear it."
            : selectedCountry
              ? isArabic
                ? "اختر أحد البرامج لعرض تفاصيله مباشرة داخل مسار الرحلة."
                : "Select a program to show its details directly in your journey."
              : isArabic
                ? "اختر دولة من الخريطة أو من القائمة لعرض المسار والبرامج المتاحة."
                : "Choose a country on the map or from the list to view its route and available programs."}
        </p>
      </div>

      <style jsx global>{`
        .nr-map-selected-point {
          z-index: 13 !important;
          transform: translate(-50%, -50%) scale(1.36) !important;
          background: #ffc313 !important;
          box-shadow: 0 0 0 10px rgba(255,195,19,.18), 0 0 38px rgba(255,195,19,.78) !important;
        }
        .nr-map-selected-point::before { border-color: rgba(255,195,19,.72) !important; }
        .nr-map-selected-point > small {
          opacity: 1 !important;
          border-color: rgba(255,195,19,.3) !important;
          color: #ffc313 !important;
        }
        .nr-map-selected-tab {
          box-shadow: inset 0 0 0 1px rgba(255,195,19,.55) !important;
        }
        .nr-map-cta-disabled {
          cursor: not-allowed !important;
          opacity: .58;
          box-shadow: none !important;
          filter: grayscale(.15);
        }
        .nr-map-cta-disabled:hover { transform: none !important; }

        .nr-map-focus-journey {
          position: absolute;
          z-index: 27;
          inset-inline-end: 18px;
          bottom: 18px;
          width: min(360px, 46%);
          padding: 13px 14px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 17px;
          color: #fff;
          background: rgba(4,20,39,.92);
          box-shadow: 0 18px 44px rgba(0,0,0,.28);
          backdrop-filter: blur(14px);
        }
        .nr-map-focus-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .nr-map-focus-label {
          color: #8fc8ff;
          font-size: 9px;
          font-weight: 900;
        }
        .nr-map-focus-flag {
          width: 23px;
          height: 16px;
          object-fit: cover;
          border-radius: 4px;
          box-shadow: 0 0 0 1px rgba(255,255,255,.14);
        }
        .nr-map-focus-route {
          display: grid;
          grid-template-columns: max-content minmax(54px, 1fr) max-content;
          align-items: center;
          gap: 9px;
        }
        .nr-map-focus-route strong { font-size: 11px; }
        .nr-map-focus-line {
          position: relative;
          min-width: 54px;
          height: 3px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(90deg, #176fe8, #2aa9e9, #ffc313);
        }
        .nr-map-focus-dot {
          position: absolute;
          z-index: 8;
          top: 50%;
          left: 0;
          right: auto;
          width: 10px;
          height: 10px;
          transform: translateY(-50%);
          border: 2px solid rgba(255,255,255,.94);
          border-radius: 50%;
          background: #ffc313;
          box-shadow: 0 0 0 4px rgba(255,195,19,.2), 0 0 20px rgba(255,195,19,.98);
          animation: nrJourneyDotLtrStable 3.8s linear infinite;
          will-change: left, right;
        }
        [dir="rtl"] .nr-map-focus-dot {
          left: auto;
          right: 0;
          animation-name: nrJourneyDotRtlStable;
        }
        .nr-map-focus-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
        }
        .nr-map-focus-summary small { color: rgba(255,255,255,.64); font-size: 8px; }
        .nr-map-focus-summary a,
        .nr-map-focus-program a {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #ffc313;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
        }
        .nr-map-focus-summary a svg,
        .nr-map-focus-program a svg { width: 12px; height: 12px; }
        .nr-map-focus-program {
          display: grid;
          gap: 5px;
          margin-top: 10px;
          padding-top: 9px;
          border-top: 1px solid rgba(255,255,255,.1);
        }
        .nr-map-focus-program > span { color: #8fc8ff; font-size: 8px; font-weight: 800; }
        .nr-map-focus-program > strong {
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nr-map-focus-program > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .nr-map-focus-program small { color: rgba(255,255,255,.62); font-size: 8px; }
        .nr-map-focus-program b { color: #ffc313; font-size: 10px; }

        .nr-map-programs {
          display: grid;
          gap: 12px;
          padding: 14px 16px 16px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 20px;
          color: #fff;
          background: rgba(5,25,47,.72);
          box-shadow: 0 16px 42px rgba(0,0,0,.14);
          backdrop-filter: blur(14px);
        }
        .nr-map-programs-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .nr-map-programs-head div { display: grid; gap: 3px; }
        .nr-map-programs-head span { color: #91c6ff; font-size: 9px; font-weight: 800; }
        .nr-map-programs-head strong { color: #fff; font-size: 17px; }
        .nr-map-programs-head > a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #ffc313;
          font-size: 10px;
          font-weight: 900;
          text-decoration: none;
        }
        .nr-map-programs-head > a svg { width: 14px; height: 14px; }
        .nr-map-programs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .nr-map-program-card {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          padding: 0;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 15px;
          color: #fff;
          background: rgba(255,255,255,.055);
          text-align: start;
          cursor: pointer;
          appearance: none;
          transition: transform .2s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .nr-map-program-card:hover,
        .nr-map-program-card:focus-visible {
          transform: translateY(-3px);
          border-color: rgba(255,195,19,.35);
          background: rgba(255,255,255,.08);
          outline: none;
        }
        .nr-map-program-card-selected {
          border-color: rgba(255,195,19,.68) !important;
          background: rgba(255,195,19,.08) !important;
          box-shadow: 0 0 0 2px rgba(255,195,19,.13), 0 12px 32px rgba(0,0,0,.18);
        }
        .nr-map-program-media {
          position: relative;
          height: 108px;
          overflow: hidden;
          background: rgba(255,255,255,.04);
        }
        .nr-map-program-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .nr-map-program-media > span,
        .nr-map-program-media > em {
          position: absolute;
          top: 8px;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 7px;
          font-style: normal;
          font-weight: 900;
        }
        .nr-map-program-media > span {
          inset-inline-start: 8px;
          color: #102f55;
          background: #ffc313;
        }
        .nr-map-program-media > em {
          inset-inline-end: 8px;
          color: #fff;
          background: rgba(23,111,232,.88);
          box-shadow: 0 4px 14px rgba(0,0,0,.2);
        }
        .nr-map-program-placeholder {
          display: grid;
          width: 100%;
          height: 100%;
          place-items: center;
          color: #ffc313;
          background: linear-gradient(145deg, rgba(23,111,232,.16), rgba(255,195,19,.08));
        }
        .nr-map-program-placeholder svg { width: 30px; height: 30px; }
        .nr-map-program-body {
          display: grid;
          gap: 6px;
          padding: 10px 11px 11px;
        }
        .nr-map-program-body > strong {
          overflow: hidden;
          color: #fff;
          font-size: 12px;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nr-map-program-body > small { color: rgba(255,255,255,.55); font-size: 8px; }
        .nr-map-program-body > div {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 8px;
          padding-top: 5px;
          border-top: 1px solid rgba(255,255,255,.07);
        }
        .nr-map-program-body > div span { color: rgba(255,255,255,.5); font-size: 7px; }
        .nr-map-program-body > div b { color: #ffc313; font-size: 11px; }
        .nr-map-programs-state {
          padding: 18px;
          border: 1px dashed rgba(255,255,255,.12);
          border-radius: 14px;
          color: rgba(255,255,255,.62);
          text-align: center;
          font-size: 10px;
        }

        @keyframes nrJourneyDotLtrStable {
          from { left: 0; opacity: .25; }
          12% { opacity: 1; }
          84% { opacity: 1; }
          to { left: calc(100% - 10px); opacity: .2; }
        }
        @keyframes nrJourneyDotRtlStable {
          from { right: 0; opacity: .25; }
          12% { opacity: 1; }
          84% { opacity: 1; }
          to { right: calc(100% - 10px); opacity: .2; }
        }

        @media (max-width: 760px) {
          .nr-map-focus-journey {
            position: relative;
            z-index: 35;
            inset: auto;
            width: auto;
            margin: 10px;
            padding: 12px 13px;
            border-color: rgba(255,195,19,.22);
            background: rgba(3,18,35,.97);
            box-shadow: 0 14px 34px rgba(0,0,0,.38);
          }
          .nr-map-focus-label { font-size: 9px; }
          .nr-map-focus-route {
            grid-template-columns: max-content minmax(76px, 1fr) max-content;
            gap: 8px;
          }
          .nr-map-focus-route strong { font-size: 10px; }
          .nr-map-focus-line { min-width: 76px; height: 3px; }
          .nr-map-focus-dot {
            width: 12px;
            height: 12px;
            box-shadow: 0 0 0 5px rgba(255,195,19,.24), 0 0 26px rgba(255,195,19,1);
          }
          [dir="ltr"] .nr-map-focus-dot { animation-name: nrJourneyDotLtrMobileStable; }
          [dir="rtl"] .nr-map-focus-dot { animation-name: nrJourneyDotRtlMobileStable; }
          .nr-map-focus-program > strong { white-space: normal; }
          .nr-map-programs { padding: 12px; }
          .nr-map-programs-head { align-items: end; }
          .nr-map-programs-head strong { font-size: 15px; }
          .nr-map-programs-grid {
            display: flex;
            gap: 9px;
            overflow-x: auto;
            scroll-snap-type: x proximity;
            overscroll-behavior-inline: contain;
            padding-bottom: 4px;
            scrollbar-width: none;
          }
          .nr-map-programs-grid::-webkit-scrollbar { display: none; }
          .nr-map-program-card {
            flex: 0 0 min(78vw, 245px);
            scroll-snap-align: center;
          }
          .nr-map-program-media { height: 116px; }
        }
        @keyframes nrJourneyDotLtrMobileStable {
          from { left: 0; opacity: .25; }
          12% { opacity: 1; }
          84% { opacity: 1; }
          to { left: calc(100% - 12px); opacity: .2; }
        }
        @keyframes nrJourneyDotRtlMobileStable {
          from { right: 0; opacity: .25; }
          12% { opacity: 1; }
          84% { opacity: 1; }
          to { right: calc(100% - 12px); opacity: .2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nr-map-focus-dot { animation: none !important; }
          [dir="ltr"] .nr-map-focus-dot { left: calc(100% - 10px); right: auto; }
          [dir="rtl"] .nr-map-focus-dot { right: calc(100% - 10px); left: auto; }
          .nr-map-program-card { transition: none; }
        }
      `}</style>
    </motion.section>
  );
}

function ArrowIcon({ isArabic }: { isArabic: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {isArabic ? (
        <path d="M19 12H5m6 6-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M12 21s7-4.3 7-11a7 7 0 1 0-14 0c0 6.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function KaabaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 5h12v15H6z" />
      <path d="M6 9h12M9 5v4M15 5v4M10 14h4v6" />
    </svg>
  );
}
