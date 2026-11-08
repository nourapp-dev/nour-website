import countryData from "../data/country-options.json";
import type { PartnerApplicationInput, PartnerType } from "../services/partnerApplications";

export type Track = "international" | "service_provider";
export type Language = "ar" | "en";
export const countries = countryData;
export const serviceChoices: { value: PartnerType; ar: string; en: string }[] = [
  { value: "hotel", ar: "فنادق وضيافة", en: "Hotels and hospitality" },
  { value: "transport", ar: "نقل", en: "Transport" },
  { value: "airline", ar: "طيران", en: "Flights" },
  { value: "visa", ar: "تأشيرات", en: "Visas" },
  { value: "other", ar: "خدمات أخرى", en: "Other services" },
];
export type InterestDraft = {
  headquartersCountry: string; operatingCountry: string; city: string;
  serviceTypes: PartnerType[]; servedCountries: string[];
  companyName: string; websiteUrl: string; companyDescription: string;
  contactName: string; contactRole: string; email: string;
  phoneCountry: string; phoneNumber: string; termsAccepted: boolean;
};
export const emptyDraft: InterestDraft = {
  headquartersCountry: "", operatingCountry: "", city: "", serviceTypes: [], servedCountries: [],
  companyName: "", websiteUrl: "", companyDescription: "", contactName: "", contactRole: "", email: "",
  phoneCountry: "", phoneNumber: "", termsAccepted: false,
};
export type FieldError = "required" | "country" | "email" | "phone" | "website" | "length" | "services" | "consent";
export type FormErrors = Partial<Record<keyof InterestDraft, FieldError>>;
export const countryLabel = (code: string, language: Language) => countries.find(c => c.code === code)?.[language] ?? code;
export function asciiDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String("٠١٢٣٤٥٦٧٨٩".includes(digit) ? "٠١٢٣٤٥٦٧٨٩".indexOf(digit) : "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}
export function internationalPhone(draft: Pick<InterestDraft, "phoneCountry" | "phoneNumber">) {
  const prefix = countries.find(c => c.code === draft.phoneCountry)?.dial ?? "";
  return prefix + asciiDigits(draft.phoneNumber).replace(/[\s().-]/g, "");
}
export function validateInterestStep(step: number, draft: InterestDraft, track: Track): FormErrors {
  const errors: FormErrors = {};
  const required = (key: keyof InterestDraft, max = 200) => {
    const value = String(draft[key]).trim();
    if (!value) errors[key] = "required";
    else if (value.length > max) errors[key] = "length";
  };
  if (step === 0) {
    for (const key of ["headquartersCountry", "operatingCountry"] as const) {
      if (!countries.some(c => c.code === draft[key])) errors[key] = "country";
    }
    required("city");
    if (track === "service_provider" && (!draft.serviceTypes.length || draft.serviceTypes.some(value => !serviceChoices.some(c => c.value === value)))) errors.serviceTypes = "services";
    if (draft.servedCountries.length > 250 || draft.servedCountries.some(code => !countries.some(c => c.code === code))) errors.servedCountries = "country";
  }
  if (step === 1) {
    required("companyName"); required("companyDescription", 3000);
    if (draft.websiteUrl.trim()) {
      try {
        const url = new URL(draft.websiteUrl.trim());
        if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password || draft.websiteUrl.length > 500) errors.websiteUrl = "website";
      } catch { errors.websiteUrl = "website"; }
    }
  }
  if (step === 2) {
    required("contactName"); required("contactRole");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length > 200) errors.email = "email";
    const local = asciiDigits(draft.phoneNumber).replace(/[\s().-]/g, "");
    if (!countries.some(c => c.code === draft.phoneCountry)) errors.phoneCountry = "country";
    if (!/^[1-9][0-9]+$/.test(local) || !/^\+[1-9][0-9]{7,14}$/.test(internationalPhone(draft))) errors.phoneNumber = "phone";
    if (!draft.termsAccepted) errors.termsAccepted = "consent";
  }
  return errors;
}
export function toPartnerInput(draft: InterestDraft, track: Track, submissionKey: string): PartnerApplicationInput {
  return {
    partnershipTrack: track, headquartersCountry: draft.headquartersCountry, country: draft.operatingCountry,
    city: draft.city.trim(), partnerType: track === "international" ? "other" : draft.serviceTypes[0],
    serviceTypes: track === "service_provider" ? draft.serviceTypes : [], servedCountries: draft.servedCountries,
    companyName: draft.companyName.trim(), websiteUrl: draft.websiteUrl.trim(), companyDescription: draft.companyDescription.trim(),
    contactName: draft.contactName.trim(), contactRole: draft.contactRole.trim(), email: draft.email.trim(),
    phone: internationalPhone(draft), termsAccepted: draft.termsAccepted, submissionKey,
  };
}
