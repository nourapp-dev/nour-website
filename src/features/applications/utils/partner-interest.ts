import type { PartnerApplicationInput } from "../services/partnerApplications";
const serviceTypes = new Set(["hotel", "transport", "visa", "umrah_company", "guide", "airline", "service_provider", "technology", "other"]);
export function validatePartnerInterest(values: PartnerApplicationInput) {
  if (!["international", "service_provider"].includes(values.partnershipTrack ?? "")) throw new Error("Invalid partnership track");
  for (const field of [values.companyName, values.contactName, values.contactRole, values.country, values.city]) {
    if (!field?.trim() || field.trim().length > 200) throw new Error("Required field missing or too long");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.length > 200) throw new Error("Invalid email");
  if (!/^\+[1-9][0-9]{7,14}$/.test(values.phone.trim())) throw new Error("Use an international mobile number");
  if (!values.companyDescription?.trim() || values.companyDescription.length > 3000) throw new Error("A brief overview is required");
  if (!serviceTypes.has(values.partnerType)) throw new Error("Invalid service type");
  if (values.websiteUrl?.trim()) {
    const url = new URL(values.websiteUrl.trim());
    if (!["https:", "http:"].includes(url.protocol) || values.websiteUrl.length > 500) throw new Error("Invalid website URL");
  }
  if (values.submissionKey) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.submissionKey)) throw new Error("Invalid submission key");
    if (!/^[A-Z]{2}$/.test(values.headquartersCountry ?? "") || !/^[A-Z]{2}$/.test(values.country ?? "")) throw new Error("Choose both countries");
    if ((values.servedCountries?.length ?? 0) > 250 || values.servedCountries?.some(code => !/^[A-Z]{2}$/.test(code))) throw new Error("Invalid coverage");
    if (values.partnershipTrack === "service_provider" && (!values.serviceTypes?.length || values.serviceTypes.some(type => !serviceTypes.has(type)))) throw new Error("Select service areas");
    if (values.partnershipTrack === "international" && values.serviceTypes?.length) throw new Error("Service areas do not apply to this track");
  }
  if (!values.termsAccepted) throw new Error("Privacy consent is required");
}
