"use client";

import Link from "next/link";
import type { DepartureCity } from "../../journeys/journey.service";
import type { DepartureDraft } from "../departure-drafts";

type Props = {
  countryId: string;
  cities: DepartureCity[];
  rows: DepartureDraft[];
  onChange: (rows: DepartureDraft[]) => void;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  disabled: boolean;
  isArabic: boolean;
};
export default function DepartureFields({
  countryId,
  cities,
  rows,
  onChange,
  loading,
  failed,
  onRetry,
  disabled,
  isArabic: ar,
}: Props) {
  const options = cities.filter(
    (c) => c.country_id === countryId && c.is_active && !c.deleted_at,
  );
  const update = (id: string, patch: Partial<DepartureDraft>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  return (
    <section
      className="nr-country-form-section"
      aria-labelledby="departure-fields-title"
    >
      <div className="nr-country-form-section-heading nr-program-hotel-heading">
        <div>
          <h3 id="departure-fields-title">
            {ar ? "مدن الانطلاق ومواعيد الرحلات" : "Departure cities & dates"}
          </h3>
          <p>
            {ar
              ? "أضف رحلة أو أكثر من مدن الدولة المختارة. يمكن استكمال المواعيد لاحقًا؛ يظهر البرنامج على خريطة المدينة بعد نشره وفتح رحلة متاحة منها."
              : "Add trips from cities in the selected country, or complete dates later. The city map lists published programs with available open departures."}
          </p>
        </div>
        <button
          type="button"
          className="nr-program-add-hotel"
          disabled={disabled || loading || failed || !options.length}
          onClick={() =>
            onChange([
              ...rows,
              {
                id: crypto.randomUUID(),
                originCityId: "",
                startAt: "",
                endAt: "",
                bookingDeadline: "",
                capacity: 1,
                status: "scheduled",
              },
            ])
          }
        >
          {ar ? "+ إضافة رحلة" : "+ Add trip"}
        </button>
      </div>
      {!countryId ? (
        <p>
          {ar
            ? "اختر الدولة أولًا لعرض مدن الانطلاق."
            : "Select a country to see its cities."}
        </p>
      ) : loading ? (
        <p role="status">{ar ? "جارٍ تحميل المدن…" : "Loading cities…"}</p>
      ) : failed ? (
        <p role="alert">
          {ar ? "تعذر تحميل المدن. " : "Could not load cities. "}
          <button type="button" onClick={onRetry}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </p>
      ) : !options.length ? (
        <p>
          {ar
            ? "لا توجد مدن انطلاق مفعّلة لهذه الدولة. "
            : "No active departure cities for this country. "}
          <Link href="/admin/cities" target="_blank" rel="noopener noreferrer">
            {ar ? "إدارة المدن" : "Manage cities"}
          </Link>{" "}
          ·{" "}
          <button type="button" onClick={onRetry}>
            {ar ? "تحديث المدن" : "Refresh cities"}
          </button>
        </p>
      ) : (
        <p>
          {ar ? "المدن المتاحة: " : "Available cities: "}
          {options
            .map((c) => (ar ? c.name_ar : c.name_en))
            .join(ar ? "، " : ", ")}
        </p>
      )}
      {rows.map((row, index) => (
        <fieldset
          key={row.id}
          disabled={disabled}
          className="nr-country-form-section"
        >
          <legend>{ar ? `الرحلة ${index + 1}` : `Trip ${index + 1}`}</legend>
          <div className="nr-country-form-grid">
            <label>
              <span>{ar ? "مدينة الانطلاق" : "Departure city"}</span>
              <select
                className="nr-input"
                required
                value={row.originCityId}
                onChange={(e) =>
                  update(row.id, { originCityId: e.target.value })
                }
              >
                <option value="">{ar ? "اختر المدينة" : "Select city"}</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {ar ? c.name_ar : c.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{ar ? "موعد الانطلاق" : "Departure"}</span>
              <input
                className="nr-input"
                type="datetime-local"
                required
                value={row.startAt}
                onChange={(e) => update(row.id, { startAt: e.target.value })}
              />
            </label>
            <label>
              <span>{ar ? "موعد العودة (اختياري)" : "Return (optional)"}</span>
              <input
                className="nr-input"
                type="datetime-local"
                min={row.startAt || undefined}
                value={row.endAt}
                onChange={(e) => update(row.id, { endAt: e.target.value })}
              />
            </label>
            <label>
              <span>
                {ar ? "إغلاق الحجز (اختياري)" : "Booking closes (optional)"}
              </span>
              <input
                className="nr-input"
                type="datetime-local"
                max={row.startAt || undefined}
                value={row.bookingDeadline}
                onChange={(e) =>
                  update(row.id, { bookingDeadline: e.target.value })
                }
              />
            </label>
            <label>
              <span>{ar ? "عدد المقاعد" : "Seat capacity"}</span>
              <input
                className="nr-input"
                type="number"
                min="1"
                step="1"
                required
                value={row.capacity}
                onChange={(e) =>
                  update(row.id, { capacity: Number(e.target.value) })
                }
              />
            </label>
            <label>
              <span>{ar ? "حالة الرحلة" : "Trip status"}</span>
              <select
                className="nr-input"
                value={row.status}
                onChange={(e) =>
                  update(row.id, {
                    status: e.target.value as DepartureDraft["status"],
                  })
                }
              >
                <option value="scheduled">{ar ? "مجدولة" : "Scheduled"}</option>
                <option value="open">{ar ? "مفتوحة" : "Open"}</option>
              </select>
            </label>
          </div>
          <p>
            {ar
              ? "التوقيت حسب جهازك. تبدأ المقاعد المتاحة مساوية لعدد المقاعد."
              : "Times use your device timezone. All seats are initially available."}
          </p>
          <button
            type="button"
            className="nr-program-add-hotel"
            onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
          >
            {ar ? "إزالة الرحلة" : "Remove trip"}
          </button>
        </fieldset>
      ))}
    </section>
  );
}
