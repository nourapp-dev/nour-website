"use client";

import { useEffect, useMemo, useState } from "react";
import useCurrentTime from "../../src/core/hooks/useCurrentTime";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Minus, Plus, Users, WalletCards } from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import { createClient } from "../../src/lib/supabase/client";
import { getPublicProgramDepartures } from "../../src/features/programs/services/program-departures.service";
import { getPublicDeparturePriceTiers } from "../../src/features/programs/services/program-departure-pricing.service";

type PreparedBookingSelection = {
  programId: string;
  departureId: string;
  priceTierId: string;
  travelers: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
};

const BOOKING_STORAGE_KEY = "nour_booking_selection";

export default function ProgramBookingSelector() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const params = useParams<{ slug?: string }>();
  const slug = typeof params?.slug === "string" ? decodeURIComponent(params.slug) : "";
  const supabase = useMemo(() => createClient(), []);

  const [departureId, setDepartureId] = useState("");
  const [priceTierId, setPriceTierId] = useState("");
  const [travelerCount, setTravelers] = useState(1);
  const now = useCurrentTime();
  const [preparedKey, setPreparedKey] = useState<string | null>(null);

  const programQuery = useQuery({
    queryKey: ["public", "program-booking-id", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id,title_ar,title_en")
        .eq("slug", slug)
        .eq("status", "published")
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const departuresQuery = useQuery({
    queryKey: ["public", "program-booking-departures", programQuery.data?.id],
    enabled: Boolean(programQuery.data?.id),
    queryFn: () => getPublicProgramDepartures(supabase, programQuery.data!.id),
  });

  const pricingQuery = useQuery({
    queryKey: ["public", "program-booking-pricing", programQuery.data?.id],
    enabled: Boolean(programQuery.data?.id),
    queryFn: () => getPublicDeparturePriceTiers(supabase, programQuery.data!.id),
  });

  const eligibleDepartures = (departuresQuery.data ?? []).filter((departure) => {
    if (departure.status !== "open" || departure.seatsAvailable <= 0) return false;
    if (departure.bookingDeadline && new Date(departure.bookingDeadline).getTime() < now) return false;
    return true;
  });

  const selectedDeparture = eligibleDepartures.find((departure) => departure.id === departureId) ?? null;
  const tiersForDeparture = (pricingQuery.data ?? []).filter((tier) => tier.departureId === departureId);
  const selectedTier = tiersForDeparture.find((tier) => tier.id === priceTierId) ?? null;

  useEffect(() => {
    const onSelectDeparture = (event: Event) => {
      const custom = event as CustomEvent<{ departureId?: string }>;
      const nextId = custom.detail?.departureId;
      if (!nextId || !eligibleDepartures.some((departure) => departure.id === nextId)) return;
      setDepartureId(nextId);
      setPriceTierId("");
      setTravelers(1);
      setPreparedKey(null);
    };
    window.addEventListener("nour:select-departure", onSelectDeparture as EventListener);
    return () => window.removeEventListener("nour:select-departure", onSelectDeparture as EventListener);
  }, [eligibleDepartures]);

  const changeDeparture = (nextId: string) => {
    setDepartureId(nextId);
    setPriceTierId("");
    setTravelers(1);
    setPreparedKey(null);
  };

  if (!slug || programQuery.isLoading || departuresQuery.isLoading || pricingQuery.isLoading) return null;
  if (!programQuery.data || !eligibleDepartures.length) return null;

  const minTravelers = selectedTier?.minTravelers ?? 1;
  const maxTravelers = selectedTier
    ? Math.min(selectedTier.maxTravelers ?? Number.POSITIVE_INFINITY, selectedDeparture?.seatsAvailable ?? Number.POSITIVE_INFINITY)
    : selectedDeparture?.seatsAvailable ?? 1;
  const travelers = Math.min(Math.max(travelerCount, minTravelers), maxTravelers);
  const total = selectedTier ? selectedTier.price * travelers : 0;
  const canContinue = Boolean(selectedDeparture && selectedTier && travelers >= minTravelers && travelers <= maxTravelers);

  const selectionKey = JSON.stringify([programQuery.data.id, departureId, priceTierId, travelers, total, selectedTier?.currencyCode]);
  const prepared = canContinue && preparedKey === selectionKey;

  const prepareSelection = () => {
    if (!programQuery.data || !selectedDeparture || !selectedTier || !canContinue) return;

    const selection: PreparedBookingSelection = {
      programId: programQuery.data.id,
      departureId: selectedDeparture.id,
      priceTierId: selectedTier.id,
      travelers,
      unitPrice: selectedTier.price,
      totalPrice: total,
      currencyCode: selectedTier.currencyCode,
    };

    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(selection));
    window.dispatchEvent(new CustomEvent("nour:booking-prepared", { detail: selection }));

    const bookingBaseUrl = process.env.NEXT_PUBLIC_NOUR_BOOKING_URL?.trim();
    if (bookingBaseUrl) {
      const url = new URL(bookingBaseUrl, window.location.origin);
      url.searchParams.set("program_id", selection.programId);
      url.searchParams.set("departure_id", selection.departureId);
      url.searchParams.set("price_tier_id", selection.priceTierId);
      url.searchParams.set("travelers", String(selection.travelers));
      window.location.assign(url.toString());
      return;
    }

    setPreparedKey(selectionKey);
  };

  return (
    <section id="booking-selector" className="pbs-wrap" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pbs-container">
        <div className="pbs-head">
          <span>{isArabic ? "ابدأ حجزك" : "Start your booking"}</span>
          <h2>{isArabic ? "اختر الموعد والسعر وعدد المسافرين" : "Choose departure, price, and travelers"}</h2>
          <p>{isArabic ? "يتم التحقق من حالة الموعد والمقاعد المتاحة قبل تجهيز بيانات الحجز." : "Departure status and seat availability are checked before preparing your booking."}</p>
        </div>

        <div className="pbs-grid">
          <div className="pbs-steps">
            <label>
              <span><CalendarDays />{isArabic ? "1. موعد الانطلاق" : "1. Departure"}</span>
              <select value={departureId} onChange={(event) => changeDeparture(event.target.value)}>
                <option value="">{isArabic ? "اختر موعدًا متاحًا" : "Choose an available departure"}</option>
                {eligibleDepartures.map((departure) => (
                  <option key={departure.id} value={departure.id}>
                    {new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(departure.startAt))}
                    {` · ${departure.seatsAvailable} ${isArabic ? "مقعد" : "seats"}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span><WalletCards />{isArabic ? "2. فئة السعر" : "2. Price tier"}</span>
              <select value={priceTierId} onChange={(event) => setPriceTierId(event.target.value)} disabled={!departureId}>
                <option value="">{isArabic ? "اختر فئة السعر" : "Choose a price tier"}</option>
                {tiersForDeparture.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {isArabic ? tier.nameAr : tier.nameEn} · {new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(tier.price)} {tier.currencyCode}
                  </option>
                ))}
              </select>
              {departureId && !tiersForDeparture.length ? <small>{isArabic ? "لا توجد فئات أسعار منشورة لهذا الموعد بعد." : "No published price tiers for this departure yet."}</small> : null}
            </label>

            <div className="pbs-travelers">
              <span><Users />{isArabic ? "3. عدد المسافرين" : "3. Travelers"}</span>
              <div>
                <button type="button" onClick={() => setTravelers(Math.max(minTravelers, travelers - 1))} disabled={!selectedTier || travelers <= minTravelers}><Minus /></button>
                <strong>{travelers}</strong>
                <button type="button" onClick={() => setTravelers(Math.min(maxTravelers, travelers + 1))} disabled={!selectedTier || travelers >= maxTravelers}><Plus /></button>
              </div>
              {selectedTier ? <small>{isArabic ? `المسموح لهذه الفئة: ${minTravelers}${Number.isFinite(maxTravelers) ? ` – ${maxTravelers}` : "+"}` : `Allowed for this tier: ${minTravelers}${Number.isFinite(maxTravelers) ? ` – ${maxTravelers}` : "+"}`}</small> : null}
            </div>
          </div>

          <aside className="pbs-summary">
            <span>{isArabic ? "ملخص الحجز" : "Booking summary"}</span>
            <h3>{isArabic ? programQuery.data.title_ar : programQuery.data.title_en}</h3>

            {selectedDeparture ? (
              <div><small>{isArabic ? "موعد الانطلاق" : "Departure"}</small><strong>{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "long" }).format(new Date(selectedDeparture.startAt))}</strong></div>
            ) : null}
            {selectedTier ? (
              <div><small>{isArabic ? "فئة السعر" : "Price tier"}</small><strong>{isArabic ? selectedTier.nameAr : selectedTier.nameEn}</strong></div>
            ) : null}
            <div><small>{isArabic ? "المسافرون" : "Travelers"}</small><strong>{travelers}</strong></div>

            <div className="pbs-total">
              <span>{isArabic ? "الإجمالي" : "Total"}</span>
              <strong>{selectedTier ? `${new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(total)} ${selectedTier.currencyCode}` : "—"}</strong>
            </div>

            <button type="button" className="pbs-continue" disabled={!canContinue} onClick={prepareSelection}>
              {isArabic ? "متابعة الحجز" : "Continue booking"}
            </button>

            {prepared ? (
              <p className="pbs-ready"><CheckCircle2 />{isArabic ? "تم تجهيز بيانات الحجز وحفظها لهذه الجلسة. سيتم ربط وجهة الحجز الفعلية في المرحلة التالية." : "Booking data is prepared and saved for this session. The final booking destination will be connected in the next stage."}</p>
            ) : null}
          </aside>
        </div>
      </div>

      <style jsx global>{`
        .pbs-wrap{padding:34px 0 52px;background:#f5f8fd;color:#14253d}.pbs-container{width:min(1360px,calc(100% - 56px));margin:auto}.pbs-head{margin-bottom:20px}.pbs-head>span{color:#176fe8;font-size:11px;font-weight:900}.pbs-head h2{margin:7px 0 8px;font-size:clamp(28px,4vw,40px)}.pbs-head p{margin:0;color:#718198}.pbs-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:18px}.pbs-steps,.pbs-summary{border:1px solid #dce5f0;border-radius:22px;background:#fff;box-shadow:0 18px 55px rgba(20,59,102,.06)}.pbs-steps{display:grid;gap:16px;padding:22px}.pbs-steps label,.pbs-travelers{display:grid;gap:8px}.pbs-steps label>span,.pbs-travelers>span{display:flex;align-items:center;gap:7px;font-weight:900}.pbs-steps label>span svg,.pbs-travelers>span svg{width:17px;color:#176fe8}.pbs-steps select{width:100%;min-height:46px;border:1px solid #d7e1ec;border-radius:12px;padding:0 12px;background:#fff;font:inherit;outline:none}.pbs-steps select:focus{border-color:#176fe8;box-shadow:0 0 0 3px rgba(23,111,232,.1)}.pbs-steps select:disabled{background:#f5f7fa;color:#9aa6b5}.pbs-steps small,.pbs-travelers small{color:#7b899b;font-size:11px}.pbs-travelers>div{display:flex;align-items:center;gap:12px}.pbs-travelers button{width:38px;height:38px;border:1px solid #d9e4ef;border-radius:10px;background:#f8fbff;color:#176fe8;cursor:pointer}.pbs-travelers button:disabled{opacity:.35;cursor:not-allowed}.pbs-travelers button svg{width:16px}.pbs-travelers strong{min-width:34px;text-align:center;font-size:20px}.pbs-summary{display:grid;gap:14px;padding:22px;align-content:start}.pbs-summary>span{color:#176fe8;font-size:11px;font-weight:900}.pbs-summary h3{margin:0 0 4px;font-size:21px}.pbs-summary>div{display:grid;gap:3px;padding-top:12px;border-top:1px solid #edf2f7}.pbs-summary small{color:#7c8b9e}.pbs-total{display:flex!important;align-items:end;justify-content:space-between}.pbs-total strong{font-size:24px;color:#176fe8}.pbs-continue{min-height:46px;border:0;border-radius:12px;background:#176fe8;color:#fff;font-weight:900;cursor:pointer}.pbs-continue:disabled{background:#b9c5d3;cursor:not-allowed}.pbs-ready{display:flex;gap:8px;margin:0;padding:11px;border-radius:12px;background:#eefaf2;color:#176b37;font-size:12px;line-height:1.7}.pbs-ready svg{width:17px;flex:0 0 auto}@media(max-width:900px){.pbs-container{width:min(100% - 24px,1360px)}.pbs-grid{grid-template-columns:1fr}.pbs-summary{position:static}}
      `}</style>
    </section>
  );
}
