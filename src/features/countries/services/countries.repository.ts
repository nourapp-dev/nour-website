import type { SupabaseClient } from "@supabase/supabase-js";
import {
  marketColumns,
  marketFromRow,
  marketPayload,
  type CountryMarketRow,
} from "../market-fields";

import type { CountryFormValues } from "../forms/CountryForm";
import type { Country } from "../types";

type CountryRow = CountryMarketRow & {
  id: string;

  name_ar: string;
  name_en: string;

  iso2: string;
  iso3: string;

  phone_code: string;

  currency_code: string;
  currency_name_ar: string;
  currency_name_en: string;

  timezone: string;

  latitude: number | string | null;
  longitude: number | string | null;

  flag_media_id: string | null;

  is_active: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type MediaRow = {
  id: string;
  bucket: string;
  path: string;
};

const countryColumns = `
  ${marketColumns},
  id,
  name_ar,
  name_en,
  iso2,
  iso3,
  phone_code,
  currency_code,
  currency_name_ar,
  currency_name_en,
  timezone,
  latitude,
  longitude,
  flag_media_id,
  is_active,
  sort_order,
  created_at,
  updated_at,
  deleted_at
`;

function normalizeCoordinate(value: number | string | null): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getPublicMediaUrl(
  supabase: SupabaseClient,
  media?: Pick<MediaRow, "bucket" | "path">,
) {
  if (!media) {
    return undefined;
  }

  const { data } = supabase.storage.from(media.bucket).getPublicUrl(media.path);

  return data.publicUrl || undefined;
}

function mapCountry(row: CountryRow, flagUrl?: string): Country {
  return {
    ...marketFromRow(row),
    id: row.id,

    nameAr: row.name_ar,
    nameEn: row.name_en,

    iso2: row.iso2,
    iso3: row.iso3,

    phoneCode: row.phone_code,

    currencyCode: row.currency_code,
    currencyNameAr: row.currency_name_ar,
    currencyNameEn: row.currency_name_en,

    timezone: row.timezone,

    latitude: normalizeCoordinate(row.latitude),

    longitude: normalizeCoordinate(row.longitude),

    flagMediaId: row.flag_media_id,
    flagUrl,

    status: row.is_active ? "active" : "inactive",

    sortOrder: row.sort_order,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getMediaMap(supabase: SupabaseClient, mediaIds: string[]) {
  const mediaMap = new Map<string, MediaRow>();

  if (mediaIds.length === 0) {
    return mediaMap;
  }

  const uniqueMediaIds = [...new Set(mediaIds)];

  const { data, error } = await supabase
    .from("media")
    .select("id,bucket,path")
    .in("id", uniqueMediaIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Failed to load country flags: ${error.message}`);
  }

  (data as MediaRow[] | null)?.forEach((media) => {
    mediaMap.set(media.id, media);
  });

  return mediaMap;
}

export async function getCountries(
  supabase: SupabaseClient,
): Promise<Country[]> {
  const { data, error } = await supabase
    .from("countries")
    .select(countryColumns)
    .is("deleted_at", null)
    .order("sort_order", {
      ascending: true,
    })
    .order("name_en", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Failed to load countries: ${error.message}`);
  }

  const countryRows = (data ?? []) as CountryRow[];

  const mediaIds = countryRows
    .map((country) => country.flag_media_id)
    .filter((mediaId): mediaId is string => typeof mediaId === "string");

  const mediaMap = await getMediaMap(supabase, mediaIds);

  return countryRows.map((country) => {
    const media = country.flag_media_id
      ? mediaMap.get(country.flag_media_id)
      : undefined;

    const flagUrl = getPublicMediaUrl(supabase, media);

    return mapCountry(country, flagUrl);
  });
}

export async function createCountry(
  supabase: SupabaseClient,
  values: CountryFormValues,
  flagMediaId: string | null,
): Promise<Country> {
  const { data, error } = await supabase
    .from("countries")
    .insert({
      ...marketPayload(values),
      name_ar: values.nameAr.trim(),

      name_en: values.nameEn.trim(),

      iso2: values.iso2.trim().toUpperCase(),

      iso3: values.iso3.trim().toUpperCase(),

      phone_code: values.phoneCode.trim(),

      currency_code: values.currencyCode.trim().toUpperCase(),

      currency_name_ar: values.currencyNameAr.trim(),

      currency_name_en: values.currencyNameEn.trim(),

      timezone: values.timezone.trim(),

      latitude: values.latitude,
      longitude: values.longitude,

      flag_media_id: flagMediaId,

      is_active: values.isActive,
      sort_order: values.sortOrder,
    })
    .select(countryColumns)
    .single();

  if (error) {
    throw new Error(`Failed to create country: ${error.message}`);
  }

  const countryRow = data as CountryRow;

  let flagUrl: string | undefined;

  if (countryRow.flag_media_id) {
    const mediaMap = await getMediaMap(supabase, [countryRow.flag_media_id]);

    flagUrl = getPublicMediaUrl(
      supabase,
      mediaMap.get(countryRow.flag_media_id),
    );
  }

  return mapCountry(countryRow, flagUrl);
}

export async function updateCountry(
  supabase: SupabaseClient,
  countryId: string,
  values: CountryFormValues,
  flagMediaId: string | null,
): Promise<Country> {
  const { data, error } = await supabase
    .from("countries")
    .update({
      ...marketPayload(values),
      name_ar: values.nameAr.trim(),

      name_en: values.nameEn.trim(),

      iso2: values.iso2.trim().toUpperCase(),

      iso3: values.iso3.trim().toUpperCase(),

      phone_code: values.phoneCode.trim(),

      currency_code: values.currencyCode.trim().toUpperCase(),

      currency_name_ar: values.currencyNameAr.trim(),

      currency_name_en: values.currencyNameEn.trim(),

      timezone: values.timezone.trim(),

      latitude: values.latitude,
      longitude: values.longitude,

      flag_media_id: flagMediaId,

      is_active: values.isActive,
      sort_order: values.sortOrder,
    })
    .eq("id", countryId)
    .select(countryColumns)
    .single();

  if (error) {
    throw new Error(`Failed to update country: ${error.message}`);
  }

  const countryRow = data as CountryRow;

  let flagUrl: string | undefined;

  if (countryRow.flag_media_id) {
    const mediaMap = await getMediaMap(supabase, [countryRow.flag_media_id]);

    flagUrl = getPublicMediaUrl(
      supabase,
      mediaMap.get(countryRow.flag_media_id),
    );
  }

  return mapCountry(countryRow, flagUrl);
}

export async function updateCountryStatus(
  supabase: SupabaseClient,
  countryId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("countries")
    .update({
      is_active: isActive,
    })
    .eq("id", countryId);

  if (error) {
    throw new Error(`Failed to update country status: ${error.message}`);
  }
}

export async function softDeleteCountry(
  supabase: SupabaseClient,
  countryId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("countries")
    .update({
      deleted_at: new Date().toISOString(),

      is_active: false,
    })
    .eq("id", countryId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete country: ${error.message}`);
  }

  if (!data) {
    throw new Error("ليس لديك صلاحية حذف هذه الدولة.");
  }
}

export async function restoreCountry(
  supabase: SupabaseClient,
  countryId: string,
): Promise<void> {
  const { error } = await supabase
    .from("countries")
    .update({
      deleted_at: null,
      is_active: true,
    })
    .eq("id", countryId);

  if (error) {
    throw new Error(`Failed to restore country: ${error.message}`);
  }
}

export async function getDeletedCountries(
  supabase: SupabaseClient,
): Promise<Country[]> {
  const { data, error } = await supabase
    .from("countries")
    .select(countryColumns)
    .not("deleted_at", "is", null)
    .order("deleted_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(`Failed to load deleted countries: ${error.message}`);
  }

  const countryRows = (data ?? []) as CountryRow[];

  const mediaIds = countryRows
    .map((country) => country.flag_media_id)
    .filter((mediaId): mediaId is string => typeof mediaId === "string");

  const mediaMap = await getMediaMap(supabase, mediaIds);

  return countryRows.map((country) => {
    const media = country.flag_media_id
      ? mediaMap.get(country.flag_media_id)
      : undefined;

    const flagUrl = getPublicMediaUrl(supabase, media);

    return mapCountry(country, flagUrl);
  });
}
