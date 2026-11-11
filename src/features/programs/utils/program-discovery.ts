export type ProgramDurationFilter = "all" | "short" | "medium" | "long";

export function parseProgramDuration(value: string | null): ProgramDurationFilter {
  return value === "short" || value === "medium" || value === "long" ? value : "all";
}

export function matchesProgramDuration(days: number, filter: ProgramDurationFilter): boolean {
  return filter === "all"
    || (filter === "short" && days <= 5)
    || (filter === "medium" && days >= 6 && days <= 9)
    || (filter === "long" && days >= 10);
}

export function programSearchHref(country: string, duration: string): string {
  const params = new URLSearchParams();
  if (country && country !== "all") params.set("country", country);
  const validDuration = parseProgramDuration(duration);
  if (validDuration !== "all") params.set("duration", validDuration);
  return `/programs${params.size ? `?${params}` : ""}`;
}

type ProgramCountry = {
  countryId: string | null;
  countryNameAr: string;
  countryNameEn: string;
};

export function getProgramCountries(programs: ProgramCountry[], language: "ar" | "en") {
  const countries = new Map<string, { id: string; name: string }>();
  for (const program of programs) {
    const name = language === "ar"
      ? program.countryNameAr || program.countryNameEn
      : program.countryNameEn || program.countryNameAr;
    if (program.countryId && name) countries.set(program.countryId, { id: program.countryId, name });
  }
  return [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, language));
}

// Group by the published departure's local month, not the visitor's timezone.
export function departureMonth(startAt: string, timezone: string | null) {
  if (!Number.isFinite(Date.parse(startAt))) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {year:"numeric", month:"2-digit", timeZone: timezone || "UTC"}).formatToParts(new Date(startAt));
    return `${parts.find(p=>p.type==="year")?.value}-${parts.find(p=>p.type==="month")?.value}`;
  } catch { return ""; }
}
