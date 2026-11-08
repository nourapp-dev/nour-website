import entries from "./data/directory-v1.json";
import zones from "./data/iana-timezones-v1.json";
export const countryDirectory = entries;
export const ianaTimezones = zones;
export const marketStates = [
  "setup",
  "coming_soon",
  "browsable",
  "paused",
] as const;
export const publicationStates = ["draft", "published", "hidden"] as const;
export function marketLabel(value: unknown, language: "ar" | "en") {
  const labels: Record<string, [string, string]> = {
    setup: ["قيد التجهيز", "In preparation"],
    coming_soon: ["قريبًا", "Coming soon"],
    browsable: ["متاح للاستعراض", "Available to browse"],
    paused: ["موقوف", "Paused"],
    draft: ["مسودة", "Draft"],
    published: ["منشور", "Published"],
    hidden: ["مخفي", "Hidden"],
  };
  return typeof value === "string" && labels[value]
    ? labels[value][language === "ar" ? 0 : 1]
    : language === "ar"
      ? "سجل سابق — غير مصنف"
      : "Legacy — unclassified";
}
