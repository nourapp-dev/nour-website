import type { SupabaseClient } from "@supabase/supabase-js";
export type ProgramDisplayFacts = {
  travelMode: "bus" | "air" | "own" | "mixed" | null;
  priceBasis: "per_person" | "per_room" | "per_group" | null;
  taxStatus: "included" | "excluded" | null;
  origins: {
    id: string;
    countryId: string;
    nameAr: string;
    nameEn: string;
    timezone: string | null;
  }[];
  departures: {
    id: string;
    cityId: string | null;
    startAt: string;
    endAt: string | null;
    timezone: string | null;
    status: string;
    capacity: number;
    seats: number;
  }[];
  stays: {
    id: string;
    hotelId: string;
    nameAr: string;
    nameEn: string;
    cityAr: string;
    cityEn: string;
    nights: number;
    roomAr: string;
    roomEn: string;
    occupancy: number | null;
    mealAr: string;
    mealEn: string;
  }[];
  transports: {
    id: string;
    nameAr: string;
    nameEn: string;
    mode: string;
    vehicle: string;
    included: boolean;
  }[];
  actualFlightCount: number;
};
export async function loadDisplayFacts(
  client: SupabaseClient,
  ids: string[],
  includeDrafts = false,
) {
  const result = new Map<string, ProgramDisplayFacts>();
  if (!ids.length) return result;
  for (let offset = 0; offset < ids.length; offset += 200) {
    const r = await client.rpc("program_display_facts", {
      program_ids: ids.slice(offset, offset + 200),
      include_drafts: includeDrafts,
    });
    if (r.error) throw r.error;
    for (const row of r.data ?? []) result.set(row.program_id, row.facts);
  }
  return result;
}
export function upcomingDepartures(
  facts?: ProgramDisplayFacts,
  now = Date.now(),
) {
  return (facts?.departures ?? [])
    .filter((d) => d.status !== "cancelled" && Date.parse(d.startAt) > now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}
export function programOrigins(facts?: ProgramDisplayFacts) {
  return new Set(facts?.origins.map((c) => c.id) ?? []);
}
export function travelMode(facts?: ProgramDisplayFacts) {
  return (
    facts?.travelMode ??
    (facts?.transports.some((t) => t.vehicle === "bus")
      ? "bus"
      : facts?.actualFlightCount
        ? "air"
        : "unknown")
  );
}
export function travelLabel(mode: string, ar: boolean) {
  return (
    (
      {
        bus: ["حافلة", "Bus"],
        air: ["طيران", "Air"],
        own: ["وصول ذاتي", "Own arrival"],
        mixed: ["وصول متعدد الوسائل", "Mixed travel"],
        unknown: ["طريقة الوصول غير محددة", "Arrival mode unspecified"],
      } as Record<string, string[]>
    )[mode]?.[ar ? 0 : 1] ?? (ar?"طريقة الوصول غير محددة":"Arrival mode unspecified")
  );
}
export function priceDescription(
  facts: ProgramDisplayFacts | undefined,
  ar: boolean,
  onlyRegistered = false,
) {
  const basis =
    (
      {
        per_person: ["للفرد", "per person"],
        per_room: ["للغرفة", "per room"],
        per_group: ["للمجموعة", "per group"],
      } as Record<string, string[]>
    )[facts?.priceBasis ?? ""]?.[ar ? 0 : 1] ??
    (ar ? "أساس السعر غير محدد" : "Price basis unspecified");
  const tax =
    facts?.taxStatus === "included"
      ? ar
        ? "شامل الضريبة"
        : "Tax included"
      : facts?.taxStatus === "excluded"
        ? ar
          ? "الضريبة غير مشمولة"
          : "Tax excluded"
        : ar
          ? "حالة الضريبة غير محددة"
          : "Tax status unspecified";
  return onlyRegistered ? [facts?.priceBasis?basis:"",facts?.taxStatus?tax:""].filter(Boolean).join(" · ") : `${basis} · ${tax}`;
}
export function locationLabel(value: string, ar: boolean) {
  const normalized = value?.trim().toUpperCase();
  return (
    (
      {
        MAKKAH: ["مكة المكرمة", "Makkah"],
        MECCA: ["مكة المكرمة", "Makkah"],
        MADINAH: ["المدينة المنورة", "Madinah"],
        MEDINA: ["المدينة المنورة", "Madinah"],
        RIYADH: ["الرياض", "Riyadh"],
        JEDDAH: ["جدة", "Jeddah"],
        CAIRO:["القاهرة","Cairo"],
      } as Record<string, string[]>
    )[normalized]?.[ar ? 0 : 1] ?? value
  );
}
export function isActualFlight(f: {
  departureAirportAr?: string;
  departureAirportEn?: string;
  arrivalAirportAr?: string;
  arrivalAirportEn?: string;
  departureAt?: string | null;
  arrivalAt?: string | null;
}) {
  return Boolean(
    (f.departureAirportAr?.trim() || f.departureAirportEn?.trim()) &&
      (f.arrivalAirportAr?.trim() || f.arrivalAirportEn?.trim()) &&
      f.departureAt &&
      f.arrivalAt &&
      Date.parse(f.arrivalAt) > Date.parse(f.departureAt),
  );
}
