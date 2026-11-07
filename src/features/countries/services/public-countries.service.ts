import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicCountry = {
  id: string;

  nameAr: string;
  nameEn: string;

  iso2: string;
  iso3: string;

  latitude: number;
  longitude: number;

  flagMediaId: string | null;
  flagUrl?: string;

  publishedProgramsCount: number | null;
  countsError?: boolean;
  flagsError?: boolean;
  marketStatus?: string | null;
  showOnMap?: boolean | null;
  statusLabelAr?: string | null;
  statusLabelEn?: string | null;
  hasPublishedPrograms: boolean;

  sortOrder: number;
};

type PublicCountryRow = {
  id: string;

  name_ar: string;
  name_en: string;

  iso2: string;
  iso3: string;

  latitude: number | string | null;
  longitude: number | string | null;

  flag_media_id: string | null;

  sort_order: number;
  market_status?: string | null;
  show_on_map?: boolean | null;
  status_label_ar?: string | null;
  status_label_en?: string | null;
};

type ProgramCountryRow = {
  country_id: string | null;
};

type MediaRow = {
  id: string;
  bucket: string;
  path: string;
};

const publicCountryColumns = `
  id,
  name_ar,
  name_en,
  iso2,
  iso3,
  latitude,
  longitude,
  flag_media_id,market_status,show_on_map,status_label_ar,status_label_en,
  sort_order
`;

function normalizeCoordinate(value: number | string | null): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getCountryFlagCode(country: PublicCountryRow): string | undefined {
  const rawIso2 = (country.iso2 ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(rawIso2) ? rawIso2 : undefined;
}

function countryCodeToEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}

function getFallbackFlagDataUrl(country: PublicCountryRow): string | undefined {
  const code = getCountryFlagCode(country);
  if (!code) return undefined;

  const emoji = countryCodeToEmoji(code);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="44" viewBox="0 0 64 44"><rect width="64" height="44" rx="6" fill="#ffffff"/><text x="32" y="31" text-anchor="middle" font-size="30">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPublicMediaUrl(
  supabase: SupabaseClient,
  media?: Pick<MediaRow, "bucket" | "path">,
): string | undefined {
  if (!media) {
    return undefined;
  }

  const { data } = supabase.storage.from(media.bucket).getPublicUrl(media.path);

  return data.publicUrl || undefined;
}

async function getCountryFlagsMap(
  supabase: SupabaseClient,
  mediaIds: string[],
): Promise<Map<string, MediaRow>> {
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
    throw new Error(`Failed to load public country flags: ${error.message}`);
  }

  ((data ?? []) as MediaRow[]).forEach((media) => {
    mediaMap.set(media.id, media);
  });

  return mediaMap;
}

async function getPublishedProgramCounts(
  supabase: SupabaseClient,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("programs")
    .select("country_id")
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("country_id", "is", null);

  if (error) {
    throw new Error(
      `Failed to load published program counts: ${error.message}`,
    );
  }

  const counts = new Map<string, number>();

  ((data ?? []) as ProgramCountryRow[]).forEach((program) => {
    if (!program.country_id) {
      return;
    }

    counts.set(program.country_id, (counts.get(program.country_id) ?? 0) + 1);
  });

  return counts;
}

export async function getPublicCountries(
  supabase: SupabaseClient,
): Promise<PublicCountry[]> {
  const { data, error } = await supabase
    .from("countries")
    .select(publicCountryColumns)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", {
      ascending: true,
    })
    .order("name_en", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Failed to load public countries: ${error.message}`);
  }

  const countryRows = (data ?? []) as PublicCountryRow[];

  // Keep published countries in lists even when they cannot be placed on the map.
  const validCountryRows = countryRows;

  const mediaIds = validCountryRows
    .map((country) => country.flag_media_id)
    .filter((mediaId): mediaId is string => typeof mediaId === "string");

  const [flagsResult, countsResult] = await Promise.allSettled([
    getCountryFlagsMap(supabase, mediaIds),

    getPublishedProgramCounts(supabase),
  ]);

  const mediaMap =
    flagsResult.status === "fulfilled"
      ? flagsResult.value
      : new Map<string, MediaRow>();
  const programCounts =
    countsResult.status === "fulfilled" ? countsResult.value : null;
  return validCountryRows.map((country) => {
    const sourceLatitude = normalizeCoordinate(country.latitude) ?? Number.NaN;

    const sourceLongitude =
      normalizeCoordinate(country.longitude) ?? Number.NaN;

    const latitude = sourceLatitude;
    const longitude = sourceLongitude;

    const programCount = programCounts
      ? (programCounts.get(country.id) ?? 0)
      : null;

    const media = country.flag_media_id
      ? mediaMap.get(country.flag_media_id)
      : undefined;

    const storedFlagUrl = getPublicMediaUrl(supabase, media);

    return {
      id: country.id,

      nameAr: country.name_ar,
      nameEn: country.name_en,

      iso2: country.iso2,
      iso3: country.iso3,

      latitude,
      longitude,

      flagMediaId: country.flag_media_id,

      flagUrl: storedFlagUrl ?? getFallbackFlagDataUrl(country),

      publishedProgramsCount: programCount,

      hasPublishedPrograms: programCount !== null && programCount > 0,
      countsError: countsResult.status === "rejected",
      flagsError: flagsResult.status === "rejected",
      marketStatus: country.market_status,
      showOnMap: country.show_on_map,
      statusLabelAr: country.status_label_ar,
      statusLabelEn: country.status_label_en,

      sortOrder: country.sort_order,
    };
  });
}

export async function getPublicCountryById(
  supabase: SupabaseClient,
  countryId: string,
): Promise<PublicCountry | null> {
  const countries = await getPublicCountries(supabase);

  return countries.find((country) => country.id === countryId) ?? null;
}
