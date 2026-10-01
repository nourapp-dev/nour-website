import type { SupabaseClient } from "@supabase/supabase-js";

type MediaRow = {
  bucket: string;
  path: string;
};

type CountryRow = {
  id: string;
  name_ar: string;
  name_en: string;
};

type ProgramRow = {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  summary_ar: string | null;
  summary_en: string | null;
  country_id: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: number | string;
  currency_code: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  flight_inclusion: "included" | "excluded" | "dynamic";
  cover_media: MediaRow | MediaRow[] | null;
};

export type PublicProgram = {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  summaryAr: string;
  summaryEn: string;
  countryId: string | null;
  countryNameAr: string;
  countryNameEn: string;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  currencyCode: string;
  isFeatured: boolean;
  flightInclusion: "included" | "excluded" | "dynamic";
  coverUrl: string | null;
};

function getCoverMedia(
  media: ProgramRow["cover_media"],
) {
  if (!media) return null;
  return Array.isArray(media)
    ? media[0] ?? null
    : media;
}

function createPublicMediaUrl(
  supabaseUrl: string,
  bucket: string,
  path: string,
) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export async function getPublicPrograms(
  supabase: SupabaseClient,
): Promise<PublicProgram[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id,
      title_ar,
      title_en,
      slug,
      summary_ar,
      summary_en,
      country_id,
      duration_days,
      duration_nights,
      base_price,
      currency_code,
      is_featured,
      sort_order,
      created_at,
      flight_inclusion,
      cover_media:media!programs_cover_media_id_fkey (
        bucket,
        path
      )
    `)
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("is_featured", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    })
    // React Query owns retries so a failed request does not trigger nested retry loops.
    .retry(false);

  if (error) {
    throw new Error(
      `Failed to load public programs: ${error.message}`,
    );
  }

  const rows = (data ?? []) as ProgramRow[];

  const countryIds = [
    ...new Set(
      rows
        .map((program) => program.country_id)
        .filter(
          (countryId): countryId is string =>
            typeof countryId === "string",
        ),
    ),
  ];

  const countryMap =
    new Map<string, CountryRow>();

  if (countryIds.length > 0) {
    const {
      data: countriesData,
      error: countriesError,
    } = await supabase
      .from("countries")
      .select("id,name_ar,name_en")
      .in("id", countryIds)
      .eq("is_active", true)
      .is("deleted_at", null)
      .retry(false);

    if (countriesError) {
      throw new Error(
        `Failed to load program countries: ${countriesError.message}`,
      );
    }

    (
      (countriesData ?? []) as CountryRow[]
    ).forEach((country) => {
      countryMap.set(
        country.id,
        country,
      );
    });
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return rows.map((program) => {
    const country = program.country_id
      ? countryMap.get(program.country_id)
      : undefined;

    const coverMedia =
      getCoverMedia(program.cover_media);

    return {
      id: program.id,
      titleAr: program.title_ar,
      titleEn: program.title_en,
      slug: program.slug,
      summaryAr: program.summary_ar ?? "",
      summaryEn: program.summary_en ?? "",
      countryId: program.country_id,
      countryNameAr:
        country?.name_ar ?? "",
      countryNameEn:
        country?.name_en ?? "",
      durationDays:
        program.duration_days,
      durationNights:
        program.duration_nights,
      basePrice:
        Number(program.base_price) || 0,
      currencyCode:
        program.currency_code,
      isFeatured:
        program.is_featured,
      flightInclusion:
        program.flight_inclusion ??
        "dynamic",
      coverUrl:
        coverMedia && supabaseUrl
          ? createPublicMediaUrl(
              supabaseUrl,
              coverMedia.bucket,
              coverMedia.path,
            )
          : null,
    };
  });
}
