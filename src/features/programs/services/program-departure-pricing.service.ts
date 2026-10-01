import type { SupabaseClient } from "@supabase/supabase-js";

export type DeparturePriceTier = {
  id: string;
  departureId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  currencyCode: string;
  minTravelers: number | null;
  maxTravelers: number | null;
  sortOrder: number;
};

type DeparturePriceTierRow = {
  id: string;
  departure_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number | string;
  currency_code: string;
  min_travelers: number | null;
  max_travelers: number | null;
  sort_order: number | null;
};

const mapTier = (row: DeparturePriceTierRow): DeparturePriceTier => ({
  id: row.id,
  departureId: row.departure_id,
  nameAr: row.name_ar,
  nameEn: row.name_en,
  descriptionAr: row.description_ar ?? "",
  descriptionEn: row.description_en ?? "",
  price: Number(row.price) || 0,
  currencyCode: row.currency_code,
  minTravelers: row.min_travelers == null ? null : Number(row.min_travelers),
  maxTravelers: row.max_travelers == null ? null : Number(row.max_travelers),
  sortOrder: row.sort_order ?? 0,
});

export async function getDeparturePriceTiers(
  supabase: SupabaseClient,
  programId: string,
) {
  const { data, error } = await supabase
    .from("program_price_tiers")
    .select("id,departure_id,name_ar,name_en,description_ar,description_en,price,currency_code,min_travelers,max_travelers,sort_order")
    .eq("program_id", programId)
    .not("departure_id", "is", null)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapTier);
}

export async function createDeparturePriceTier(
  supabase: SupabaseClient,
  programId: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from("program_price_tiers").insert({
    program_id: programId,
    ...payload,
  });
  if (error) throw error;
}

export async function updateDeparturePriceTier(
  supabase: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("program_price_tiers")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
}

export async function archiveDeparturePriceTier(
  supabase: SupabaseClient,
  id: string,
) {
  const { error } = await supabase
    .from("program_price_tiers")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function getPublicDeparturePriceTiers(
  supabase: SupabaseClient,
  programId: string,
) {
  const { data, error } = await supabase
    .from("program_price_tiers")
    .select("id,departure_id,name_ar,name_en,description_ar,description_en,price,currency_code,min_travelers,max_travelers,sort_order")
    .eq("program_id", programId)
    .eq("is_active", true)
    .not("departure_id", "is", null)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapTier);
}
