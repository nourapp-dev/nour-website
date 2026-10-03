export type DepartureDraft = {
  id: string;
  originCityId: string;
  startAt: string;
  endAt: string;
  bookingDeadline: string;
  capacity: number;
  status: "scheduled" | "open";
};
type CityOption = {
  id: string;
  country_id: string;
  is_active: boolean;
  deleted_at: string | null;
};

export function validateDepartureDrafts(
  rows: DepartureDraft[],
  countryId: string,
  cities: CityOption[],
  arabic = true,
): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    if (
      !cities.some(
        (c) =>
          c.id === row.originCityId &&
          c.country_id === countryId &&
          c.is_active &&
          !c.deleted_at,
      )
    )
      return arabic
        ? "اختر مدينة انطلاق مفعّلة من الدولة المحددة لكل رحلة."
        : "Select an active departure city in the selected country for every trip.";
    const start = Date.parse(row.startAt);
    if (!Number.isFinite(start) || start <= Date.now())
      return arabic
        ? "حدد موعد انطلاق في المستقبل لكل رحلة."
        : "Choose a future departure date for every trip.";
    if (
      row.endAt &&
      (!Number.isFinite(Date.parse(row.endAt)) || Date.parse(row.endAt) < start)
    )
      return arabic
        ? "موعد العودة يجب أن يكون بعد الانطلاق أو مساويًا له."
        : "Return must be on or after departure.";
    if (
      row.bookingDeadline &&
      (!Number.isFinite(Date.parse(row.bookingDeadline)) ||
        Date.parse(row.bookingDeadline) > start ||
        Date.parse(row.bookingDeadline) <= Date.now())
    )
      return arabic
        ? "إغلاق الحجز يجب أن يكون في المستقبل ولا يتجاوز موعد الانطلاق."
        : "Booking closes in the future, no later than departure.";
    if (!Number.isSafeInteger(row.capacity) || row.capacity < 1)
      return arabic
        ? "أدخل عدد مقاعد صحيحًا أكبر من صفر."
        : "Enter a positive whole seat capacity.";
    if (!["scheduled", "open"].includes(row.status))
      return arabic ? "حالة الرحلة غير صالحة." : "Invalid departure status.";
    const key = `${row.originCityId}:${start}`;
    if (seen.has(key))
      return arabic
        ? "لا تكرر الرحلة من المدينة نفسها في الموعد نفسه."
        : "Duplicate city and departure time.";
    seen.add(key);
  }
  return null;
}

export function departurePayloads(rows: DepartureDraft[]) {
  return rows.map((row, index) => ({
    id: row.id,
    origin_city_id: row.originCityId,
    start_at: new Date(row.startAt).toISOString(),
    end_at: row.endAt ? new Date(row.endAt).toISOString() : null,
    booking_deadline: row.bookingDeadline
      ? new Date(row.bookingDeadline).toISOString()
      : null,
    capacity_total: row.capacity,
    seats_available: row.capacity,
    status: row.status,
    is_active: true,
    sort_order: index,
  }));
}
