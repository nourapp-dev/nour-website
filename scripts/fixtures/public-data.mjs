// Invented display content, never production data. Only imported by ui-preview.mjs.
const cover = { id: "cover-demo", bucket: "media", path: "cover.jpg" };
export const programRows = [3, 7, 10].map((days, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`, slug: `demo-umrah-${days}`,
  title_ar: `برنامج عرض تجريبي — ${days} أيام`, title_en: `Demo Umrah program — ${days} days`,
  summary_ar: "بيانات عرض ثابتة لفحص الواجهة، وليست عرضًا تجاريًا أو حجزًا متاحًا.",
  summary_en: "Static display data for UI review. Not a commercial offer or an available booking.",
  description_ar: "هذه بيانات تجريبية معزولة. راجع ترتيب الأقسام والصور واللغة وأحجام النصوص. الأسعار والمواعيد المعروضة أمثلة للاختبار فقط.",
  description_en: "This is an isolated display fixture. Review sections, images, language and text sizes. Prices and dates are examples for testing only.",
  country_id: index === 2 ? "demo-eg" : "demo-sa", duration_days: days, duration_nights: days - 1,
  base_price: [1200, 2400, 3800][index], currency_code: "SAR", is_featured: index === 0,
  flight_inclusion: index === 2 ? "included" : "excluded", flight_notes_ar: "مثال للعرض فقط", flight_notes_en: "Display example only",
  cover_media_id: cover.id, cover_media: cover, sort_order: index, status: "published", is_active: true, deleted_at: null, created_at: "2026-01-01T00:00:00Z",
}));
const first = programRows[0].id;
export const tables = {
  programs: programRows,
  countries: [{ id: "demo-sa", name_ar: "السعودية", name_en: "Saudi Arabia", iso2: "SA", iso3: "SAU", flag_media_id: null, sort_order: 0, latitude: 23.9, longitude: 45, is_active: true, deleted_at: null }, { id: "demo-eg", name_ar: "مصر", name_en: "Egypt", iso2: "EG", iso3: "EGY", flag_media_id: null, sort_order: 1, latitude: 26.8, longitude: 30.8, is_active: true, deleted_at: null }],
  media: [cover],
  program_hotels: [{ id: "stay-demo", program_id: first, hotel_id: "hotel-demo", nights: 2, room_type_ar: "غرفة تجريبية", room_type_en: "Demo room", meal_plan_ar: "مثال توضيحي", meal_plan_en: "Display example", check_in_date: null, check_out_date: null, sort_order: 0 }],
  hotels: [{ id: "hotel-demo", name_ar: "إقامة توضيحية — ليست فندقًا حقيقيًا", name_en: "Display accommodation — not a real hotel", city_ar: "مكة", city_en: "Makkah", stars: 0, cover_media_id: cover.id }],
  hotel_media: [], program_flights: [], program_transports: [], program_visas: [],
  departure_cities: [
    { id: "demo-riyadh", country_id: "demo-sa", name_ar: "الرياض — عرض تجريبي", name_en: "Riyadh — demo", latitude: 24.7136, longitude: 46.6753, is_active: true, deleted_at: null, sort_order: 0 },
    { id: "demo-diriyah", country_id: "demo-sa", name_ar: "الدرعية — عرض تجريبي", name_en: "Diriyah — demo", latitude: 24.735, longitude: 46.575, is_active: true, deleted_at: null, sort_order: 1 },
    { id: "demo-jeddah", country_id: "demo-sa", name_ar: "جدة — عرض تجريبي", name_en: "Jeddah — demo", latitude: 21.54, longitude: 39.17, is_active: true, deleted_at: null, sort_order: 2 },
  ],
  program_meeting_points: [{ id: "demo-pickup", program_id: first, city_id: "demo-riyadh", departure_id: "demo-open-departure", name_ar: "نقطة تجمع تجريبية", name_en: "Demo meeting point", address_ar: "موقع توضيحي فقط", address_en: "Display location only", latitude: 24.72, longitude: 46.69, is_active: true, deleted_at: null, sort_order: 0 }],
  program_departures: [{ id: "demo-open-departure", program_id: first, origin_city_id: "demo-riyadh", start_at: "2027-02-10T08:00:00Z", end_at: "2027-02-12T18:00:00Z", booking_deadline: null, capacity_total: 20, seats_available: 5, status: "open", notes_ar: "عرض تجريبي فقط؛ حجز الموقع متوقف", notes_en: "Display fixture only; website booking is paused", is_active: true, deleted_at: null, sort_order: 1 }, { id: "departure-demo", program_id: first, origin_city_id: null, start_at: "2027-02-01T08:00:00Z", end_at: "2027-02-03T18:00:00Z", booking_deadline: null, capacity_total: 20, seats_available: 0, status: "full", notes_ar: "موعد تجريبي لا يمثل التوافر الفعلي", notes_en: "Demo date, not real availability", is_active: true, deleted_at: null, sort_order: 0 }],
  program_itinerary_days: [{ id: "day-demo", program_id: first, day_number: 1, title_ar: "بداية الرحلة — مثال", title_en: "Arrival — example", description_ar: "نص عرض لتقييم القراءة وتوزيع المعلومات.", description_en: "Display text for reviewing readability and layout.", deleted_at: null, sort_order: 0 }],
  program_inclusion_items: [{ id: "included-demo", program_id: first, inclusion_type: "included", title_ar: "إقامة — مثال عرض", title_en: "Accommodation — display example", description_ar: "لا يمثل عرضًا تجاريًا.", description_en: "Not a commercial offer.", deleted_at: null, sort_order: 0 }],
  program_cancellation_rules: [], program_price_tiers: [], program_faqs: [],
};

export function fixtureRows(table, params, scenario) {
  if (!(table in tables)) return null;
  let rows = table === "programs" && scenario === "empty" ? [] : tables[table];
  for (const [key, condition] of params) {
    if (["select", "order", "limit", "offset", "or"].includes(key)) continue;
    if (condition.startsWith("eq.")) rows = rows.filter(row => String(row[key]) === condition.slice(3));
    if (condition === "is.null") rows = rows.filter(row => row[key] == null);
    if (condition.startsWith("in.(")) { const allowed = condition.slice(4, -1).split(",").map(value => value.replaceAll('"', "")); rows = rows.filter(row => allowed.includes(String(row[key]))); }
    if (condition.startsWith("gt.")) rows = rows.filter(row => row[key] > condition.slice(3));
  }
  return rows;
}
