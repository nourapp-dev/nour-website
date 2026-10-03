"use client";
import { useMemo, useState } from "react";
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
const GeographicMap = dynamic(
  () => import("../../../../src/components/maps/GeographicMap"),
  { ssr: false, loading: () => <p>تحميل الخريطة / Loading map…</p> },
);
const makkah = {
  id: "makkah",
  name: "مكة",
  latitude: 21.4225,
  longitude: 39.8262,
  destination: true,
};
export default function NourWorldMap({ language }: { language: Language }) {
  const ar = language === "ar";
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
  const saudiId = data?.countries.find(
    (c) => c.iso2.toUpperCase() === "SA",
  )?.id;
  const locations = useMemo(
    () =>
      mode === "saudi"
        ? (data?.cities ?? [])
            .filter((c) => c.country_id === saudiId)
            .map((c) => ({
              id: c.id,
              name: ar ? c.name_ar : c.name_en,
              latitude: c.latitude,
              longitude: c.longitude,
              available: (data?.departures ?? []).some(
                (d) =>
                  d.origin_city_id === c.id &&
                  data?.programs.some((p) => p.id === d.program_id),
              ),
            }))
        : (data?.countries ?? [])
            .filter((c) => c.iso2.toUpperCase() !== "SA")
            .map((c) => ({
              id: c.id,
              name: ar ? c.nameAr : c.nameEn,
              latitude: c.latitude,
              longitude: c.longitude,
              available: c.hasPublishedPrograms,
            })),
    [mode, data, saudiId, ar],
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
      ...locations,
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
  function select(id: string) {
    if (locations.some((l) => l.id === id)) {
      setSelected(id);
      setDepartureId(null);
      trackMapEvent(
        mode === "saudi" ? "map_city_selected" : "map_country_selected",
        {
          countryId: mode === "saudi" ? saudiId : id,
          cityId: mode === "saudi" ? id : undefined,
          source: "map",
          hasPrograms: locations.find((l) => l.id === id)?.available,
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
              ? "اختر نقطة الانطلاق واكتشف البرامج والمواعيد المتاحة."
              : "Choose your origin and explore available programs and departures."}
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
      <div className={styles.layout}>
        <div className={styles.map}>
          <GeographicMap
            points={points}
            selectedId={location?.id}
            mode={mode}
            onSelect={select}
            route
            label={ar ? "خريطة الانطلاق إلى مكة" : "Origins and Makkah map"}
          />
        </div>
        <aside className={styles.details} aria-live="polite">
          {query.isPending ? (
            <p>{ar ? "جارٍ تحميل المواقع…" : "Loading locations…"}</p>
          ) : query.isError ? (
            <div role="alert">
              <p>
                {ar
                  ? "تعذر تحميل بيانات الرحلات."
                  : "Journey data could not be loaded."}
              </p>
              <button type="button" onClick={() => void query.refetch()}>
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
                    {location.name} ← {ar ? "مكة المكرمة" : "Makkah"}
                  </p>
                  <p>
                    {programs.length
                      ? ar
                        ? `${programs.length} برامج متاحة`
                        : `${programs.length} programs available`
                      : ar
                        ? "لا توجد رحلات متاحة من هذا الموقع حاليًا."
                        : "No journeys are currently available from this origin."}
                  </p>
                  {departures[0] ? (
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
                        href={`/programs/${encodeURIComponent(program.slug)}`}
                      >
                        {ar ? "عرض تفاصيل البرنامج" : "View program details"}
                      </Link>
                    </article>
                  ))}
                  {programs.length > 3 ? (
                    <Link
                      href={
                        mode === "saudi"
                          ? `/programs?city=${encodeURIComponent(location.id)}`
                          : `/programs?country=${encodeURIComponent(location.id)}`
                      }
                    >
                      {ar ? "عرض جميع البرامج" : "View all programs"}
                    </Link>
                  ) : null}
                </>
              ) : (
                <p>
                  {locations.length
                    ? ar
                      ? "اختر من الخريطة أو القائمة أدناه."
                      : "Select on the map or from the list below."
                    : ar
                      ? "لا توجد مواقع انطلاق مفعّلة حاليًا."
                      : "No active origins yet."}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
      <div className={styles.locations}>
        {locations.map((l) => (
          <button
            type="button"
            key={l.id}
            aria-pressed={selected === l.id}
            onClick={() => select(l.id)}
          >
            {l.name}
            <small>
              {l.available
                ? ar
                  ? "برامج متاحة"
                  : "Programs available"
                : ar
                  ? "لا توجد رحلات الآن"
                  : "No journeys yet"}
            </small>
          </button>
        ))}
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
              <p role="alert">
                {ar
                  ? "تعذر تحميل نقاط التجمع."
                  : "Unable to load meeting points."}
              </p>
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
