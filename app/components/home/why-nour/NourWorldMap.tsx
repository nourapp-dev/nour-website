"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import type { Language } from "../../../data/home";
import { createClient } from "../../../../src/lib/supabase/client";
import {
  getJourneyCatalog,
  getJourneyMeetingPoints,
} from "../../../../src/features/journeys/journey.service";
import { trackMapEvent } from "../../../../src/lib/analytics/map-events";
import styles from "./NourWorldMap.module.css";
import { languageHref } from "../../../../src/core/i18n/public-language";
import { validCoordinates } from "../../../../src/features/journeys/coordinates";
import MapBoundary from "./MapBoundary";
const GeographicMap = dynamic(
  () => import("../../../../src/components/maps/GeographicMap"),
  { ssr: false, loading: () => <p>تحميل الخريطة / Loading map…</p> },
);
function subscribeToMobile(onChange: () => void) {
  const media = window.matchMedia?.("(max-width: 760px)");
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}
const mobileSnapshot = () => window.matchMedia?.("(max-width: 760px)").matches ?? false;
const serverSnapshot = () => false;

function countryIso2(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

const makkah = {
  id: "makkah",
  name: "مكة",
  latitude: 21.4225,
  longitude: 39.8262,
  destination: true,
};
export default function NourWorldMap({ language }: { language: Language }) {
  const ar = language === "ar";
  const mobile = useSyncExternalStore(subscribeToMobile, mobileSnapshot, serverSnapshot);
  const [expanded, setExpanded] = useState(false);
  const showMap = !mobile || expanded;
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    if (!mapContainer.current || !showMap) return;
    if (typeof window.IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setMapReady(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setMapReady(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, [showMap]);
  const client = useMemo(() => createClient("pilgrim"), []);
  const [mode, setMode] = useState<"saudi" | "world">("saudi");
  const [selected, setSelected] = useState<string | null>(null);
  const [departureId, setDepartureId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["public", "journey-map"],
    queryFn: () => getJourneyCatalog(client),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const data = query.data;
  const countries = useMemo(() => (data?.countries ?? []).filter(country => countryIso2(country.iso2) !== null), [data?.countries]);
  const hasIncompleteCountries = Boolean(data && countries.length < data.countries.length);
  const saudiId = countries.find(country => countryIso2(country.iso2) === "SA")?.id;
  const locations = useMemo(
    () =>
      mode === "saudi"
        ? (data?.cities ?? [])
            .filter((c) => Boolean(saudiId) && c.country_id === saudiId)
            .map((c) => ({
              id: c.id,
              name: ar ? c.name_ar : c.name_en,
              latitude: c.latitude,
              longitude: c.longitude,
              count: (data?.programs ?? []).filter(p =>
                data?.departures.some(d => d.origin_city_id === c.id && d.program_id === p.id),
              ).length,
            }))
        : countries
            .filter((c) => countryIso2(c.iso2) !== "SA")
            .map((c) => ({
              id: c.id,
              name: ar ? c.nameAr : c.nameEn,
              latitude: c.latitude,
              longitude: c.longitude,
              count: (data?.programs ?? []).filter(p => p.countryId === c.id).length,
            })),
    [mode, data, countries, saudiId, ar],
  );
  const location = locations.find((c) => c.id === selected);
  const departures = (data?.departures ?? []).filter((d) =>
    mode === "saudi"
      ? d.origin_city_id === selected
      : data?.programs.some(
          (p) => p.id === d.program_id && p.countryId === selected,
        ),
  );
  const programs = (data?.programs ?? []).filter((p) =>
    mode === "saudi"
      ? departures.some((d) => d.program_id === p.id)
      : p.countryId === selected,
  );
  const selectedDeparture = departures.find((d) => d.id === departureId);
  const meeting = useQuery({
    queryKey: ["public", "journey-meeting", selected, selectedDeparture?.id],
    queryFn: () =>
      getJourneyMeetingPoints(
        client,
        selectedDeparture!.program_id,
        selected!,
        selectedDeparture!.id,
      ),
    enabled: Boolean(mode === "saudi" && selected && selectedDeparture),
    staleTime: 60_000,
  });
  const hasSelectedDeparture = Boolean(selectedDeparture);
  const points = useMemo(
    () => [
      ...locations.map(l => ({ ...l, available: l.count > 0 })),
      { ...makkah, name: ar ? "مكة المكرمة" : "Makkah" },
      ...(hasSelectedDeparture && mode === "saudi"
        ? (meeting.data ?? [])
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({
              id: p.id,
              name: ar ? p.name_ar : p.name_en,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              available: true,
            }))
        : []),
    ],
    [locations, ar, hasSelectedDeparture, mode, meeting.data],
  );
  function select(id: string, source: "map" | "chip" = "map") {
    if (locations.some((l) => l.id === id)) {
      setSelected(id);
      setDepartureId(null);
      trackMapEvent(
        mode === "saudi" ? "map_city_selected" : "map_country_selected",
        {
          countryId: mode === "saudi" ? saudiId : id,
          cityId: mode === "saudi" ? id : undefined,
          source,
          hasPrograms: Boolean(locations.find((l) => l.id === id)?.count),
        },
      );
    }
  }
  return (
    <section
      className={styles.panel}
      dir={ar ? "rtl" : "ltr"}
      aria-label={ar ? "رحلتك إلى مكة" : "Your journey to Makkah"}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {ar ? "إلى مكة… من مدينتك" : "From your city to Makkah"}
          </span>
          <h2>
            {ar ? "من أين تبدأ رحلتك؟" : "Where does your journey begin?"}
          </h2>
          <p>
            {ar
              ? "اختر نقطة الانطلاق واستعرض البرامج والمواعيد المنشورة."
              : "Choose your origin and explore published programs and departures."}
          </p>
        </div>
        <div
          className={styles.tabs}
          aria-label={ar ? "نطاق الرحلة" : "Journey region"}
        >
          {(["saudi", "world"] as const).map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setSelected(null);
                setDepartureId(null);
              }}
            >
              {m === "saudi"
                ? ar
                  ? "داخل السعودية"
                  : "Within Saudi Arabia"
                : ar
                  ? "من خارج المملكة"
                  : "International"}
            </button>
          ))}
        </div>
      </header>
      {hasIncompleteCountries && <p role="status">{ar ? "بعض الدول غير معروضة لأن رمز البلد غير مكتمل. يمكنك متابعة استعراض البرامج." : "Some countries are not shown because their country code is incomplete. You can still browse programs."}</p>}
      <p className={styles.notice}>{ar ? "للاستعراض فقط — حجز الموقع متوقف، والتطبيق قريبًا." : "Browse only — website booking is paused; the app is coming soon."}</p>
      {!query.isPending && !query.isError && locations.length > 0 && (
        <div className={styles.locations} role="group" aria-label={ar ? "نقاط الانطلاق" : "Origins"}>
          {locations.map(l => (
            <button type="button" key={l.id} aria-pressed={selected === l.id}
              aria-controls="journey-origin-details" onClick={() => select(l.id, "chip")}>
              <span>{l.name}</span>
              <small>{l.count
                ? ar ? `${l.count} برامج منشورة` : `${l.count} published programs`
                : ar ? "لا توجد برامج منشورة حاليًا" : "No published programs right now"}</small>
            </button>
          ))}
        </div>
      )}
      {mobile && <button className={styles.mapToggle} type="button" aria-expanded={expanded}
        aria-controls="journey-map" onClick={() => { setExpanded(value => !value); if (!expanded) setMapReady(true); }}>
        {expanded ? (ar ? "إخفاء الخريطة" : "Hide map") : (ar ? "عرض الخريطة" : "Show map")}
      </button>}
      <div className={styles.layout}>
        <div id="journey-map" className={styles.map} ref={mapContainer} hidden={!showMap}>
          {showMap && mapReady ? <MapBoundary language={language}><GeographicMap
            points={points}
            selectedId={location?.id}
            mode={mode}
            onSelect={select}
            language={language}
            cluster
            route
            label={ar ? "خريطة الانطلاق إلى مكة" : "Origins and Makkah map"}
          /></MapBoundary> : <p role="status">{ar ? "تُحمّل الخريطة عند الاقتراب منها." : "The map loads as you approach this section."}</p>}
        </div>
        <aside id="journey-origin-details" className={styles.details}>
          {query.isPending ? (
            <p role="status">{ar ? "جارٍ تحميل المواقع…" : "Loading locations…"}</p>
          ) : query.isError ? (
            <div role="alert">
              <p>
                {ar
                  ? "تعذر تحميل بيانات الرحلات."
                  : "Journey data could not be loaded."}
              </p>
              <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : (
            <>
              <span>
                {mode === "saudi"
                  ? ar
                    ? "مدينة الانطلاق"
                    : "Departure city"
                  : ar
                    ? "بلد الانطلاق"
                    : "Departure country"}
              </span>
              <h3>
                {location?.name ??
                  (ar ? "اختر نقطة الانطلاق" : "Choose your origin")}
              </h3>
              {location ? (
                <>
                  <p>
                    {location.name} {ar ? "←" : "→"} {ar ? "مكة المكرمة" : "Makkah"}
                  </p>
                  <p role="status">
                    {programs.length
                      ? ar
                        ? `${programs.length} برامج منشورة`
                        : `${programs.length} published programs`
                      : ar
                        ? "لا توجد برامج منشورة حاليًا لهذه النقطة ضمن المواعيد المعروضة."
                        : "No published programs for this origin in the listed departures right now."}
                  </p>
                  {!validCoordinates(location.latitude, location.longitude) && <p>{ar ? "موقع الانطلاق غير محدد على الخريطة؛ يمكنك استعراض برامجه أدناه." : "Map coordinates are missing for this origin; you can still browse its programs below."}</p>}
                  {departures[0] && Number.isFinite(Date.parse(departures[0].start_at)) ? (
                    <p>
                      {ar ? "أقرب موعد: " : "Next departure: "}
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
                        dateStyle: "medium",
                        timeZone: "Asia/Riyadh",
                      }).format(new Date(departures[0].start_at))}
                    </p>
                  ) : null}
                  {programs.slice(0, 3).map((program) => (
                    <article key={program.id} className={styles.program}>
                      <strong>{ar ? program.titleAr : program.titleEn}</strong>
                      <small>
                        {program.durationDays} {ar ? "أيام" : "days"} ·{" "}
                        {ar ? "ابتداءً من" : "From"}{" "}
                        {program.basePrice.toLocaleString(
                          ar ? "ar-SA" : "en-GB",
                        )}{" "}
                        {program.currencyCode}
                      </small>
                      <Link
                        onClick={() =>
                          trackMapEvent("map_program_clicked", {
                            programId: program.id,
                            programSlug: program.slug,
                            source: "program_card",
                          })
                        }
                        href={languageHref(`/programs/${encodeURIComponent(program.slug)}`, language)}
                      >
                        {ar ? "عرض تفاصيل البرنامج" : "View program details"}
                      </Link>
                    </article>
                  ))}
                  {programs.length > 0 ? (
                    <Link
                      href={
                        languageHref(mode === "saudi"
                          ? `/programs?city=${encodeURIComponent(location.id)}`
                          : `/programs?country=${encodeURIComponent(location.id)}`, language)
                      }
                    >
                      {ar ? "استعرض البرامج" : "Browse programs"}
                    </Link>
                  ) : null}
                </>
              ) : (
                <p>
                  {locations.length
                    ? ar
                      ? "اختر نقطة انطلاق من القائمة أعلاه أو من الخريطة."
                      : "Choose an origin from the list above or from the map."
                    : ar
                      ? "لا توجد مواقع انطلاق مفعّلة حاليًا."
                      : "No active origins yet."}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
      {mode === "saudi" && location && departures.length > 0 ? (
        <div className={styles.pickups}>
          <label>
            {ar ? "الموعد ونقاط التجمع" : "Departure and meeting points"}
            <select
              value={departureId ?? ""}
              onChange={(e) => setDepartureId(e.target.value || null)}
            >
              <option value="">
                {ar ? "اختر موعد الرحلة" : "Choose a departure"}
              </option>
              {departures.map((d) => (
                <option key={d.id} value={d.id}>
                  {new Date(d.start_at).toLocaleDateString(
                    ar ? "ar-SA" : "en-GB",
                    { timeZone: "Asia/Riyadh" },
                  )}{" "}
                  —{" "}
                  {ar
                    ? data?.programs.find((p) => p.id === d.program_id)?.titleAr
                    : data?.programs.find((p) => p.id === d.program_id)
                        ?.titleEn}
                </option>
              ))}
            </select>
          </label>
          {selectedDeparture ? (
            meeting.isPending ? (
              <p>{ar ? "جارٍ تحميل النقاط…" : "Loading meeting points…"}</p>
            ) : meeting.isError ? (
              <div role="alert">
                <p>{ar ? "تعذر تحميل نقاط التجمع. تفاصيل البرامج ما زالت متاحة." : "Meeting points could not be loaded. Program details are still available."}</p>
                <button type="button" disabled={meeting.isFetching} onClick={() => void meeting.refetch()}>
                  {ar ? "إعادة المحاولة" : "Retry"}
                </button>
              </div>
            ) : meeting.data?.length ? (
              <ul>
                {meeting.data.map((p) => (
                  <li key={p.id}>
                    <strong>{ar ? p.name_ar : p.name_en}</strong> —{" "}
                    {ar ? p.address_ar : p.address_en}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {ar
                  ? "لم تُحدد نقاط تجمع لهذا الموعد بعد."
                  : "No meeting points have been assigned yet."}
              </p>
            )
          ) : null}
        </div>
      ) : null}
      {showMap && <div className={styles.legend} aria-label={ar ? "مفتاح الخريطة" : "Map legend"}>
        <span><i className={styles.blueDot} aria-hidden="true" />{ar ? "نقطة انطلاق" : "Origin"}</span>
        <span><i className={styles.goldDot} aria-hidden="true" />{ar ? "الموقع المحدد / مكة" : "Selected origin / Makkah"}</span>
        <span>{ar ? "الرقم على العلامة يجمع مواقع متقاربة، وليس عدد البرامج." : "Numbered markers group nearby locations, not programs."}</span>
      </div>}
      <footer className={styles.footer}>
        <span>
          {ar
            ? "المسار توضيحي إلى مكة، وليس مسار قيادة أو تتبعًا مباشرًا."
            : "Illustrative connection to Makkah, not driving directions or live tracking."}
        </span>
        <span>
          {ar
            ? "استخدم + و − للتكبير والتحريك."
            : "Use + / − to zoom; drag to pan."}
        </span>
      </footer>
    </section>
  );
}
