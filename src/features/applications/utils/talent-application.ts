import { asciiDigits, countries, internationalPhone, type Language } from "./partner-interest-form";
import type { JobApplicationInput } from "../services/jobApplications";
export { countries, internationalPhone };
export type { Language };
export const careerAreas = [
  { value: "technology_product", ar: "التقنية والمنتج", en: "Technology and product", descriptionAr: "التطوير وتجربة المستخدم وتحسين المنتج الرقمي.", descriptionEn: "Development, user experience and digital product improvement." },
  { value: "operations", ar: "العمليات والتشغيل", en: "Operations", descriptionAr: "تنسيق الخدمات والإجراءات ومتابعة جودة التنفيذ.", descriptionEn: "Service coordination, processes and delivery quality." },
  { value: "customer_service", ar: "خدمة العملاء", en: "Customer service", descriptionAr: "فهم احتياجات المستفيدين والمساعدة في رحلة الخدمة.", descriptionEn: "Understanding customer needs and supporting the service journey." },
  { value: "marketing_content", ar: "التسويق والمحتوى", en: "Marketing and content", descriptionAr: "تقديم معلومات واضحة ومحتوى يخدم المعتمر.", descriptionEn: "Clear information and content that serves Umrah travelers." },
  { value: "partnerships_business", ar: "الشراكات وتطوير الأعمال", en: "Partnerships and business development", descriptionAr: "تطوير علاقات التعاون وفهم احتياجات الشركاء.", descriptionEn: "Developing collaboration and understanding partners' needs." },
  { value: "other", ar: "مجال آخر", en: "Another area", descriptionAr: "خبرة أخرى ترى أنها قد تسهم في عمل نور آب.", descriptionEn: "Other experience you believe could contribute to Nour App." },
] as const;
export type CareerArea = typeof careerAreas[number]["value"];
export const opportunityTypes = ["full_time", "part_time", "internship", "freelance"] as const;
export const workModes = ["onsite", "hybrid", "remote", "no_preference"] as const;
export type OpportunityType = typeof opportunityTypes[number];
export type WorkMode = typeof workModes[number];
export type TalentDraft = {
  careerArea: string; opportunityType: string; workMode: string; country: string; city: string;
  currentJobTitle: string; yearsOfExperience: string; linkedinUrl: string; portfolioUrl: string; message: string;
  fullName: string; email: string; phoneCountry: string; phoneNumber: string; privacyAccepted: boolean;
};
export const emptyTalentDraft: TalentDraft = { careerArea: "", opportunityType: "", workMode: "no_preference", country: "", city: "", currentJobTitle: "", yearsOfExperience: "", linkedinUrl: "", portfolioUrl: "", message: "", fullName: "", email: "", phoneCountry: "", phoneNumber: "", privacyAccepted: false };
export type TalentError = "required" | "country" | "email" | "phone" | "url" | "linkedin" | "years" | "length" | "consent" | "cv_type" | "cv_size" | "cv_invalid";
export type TalentErrors = Partial<Record<keyof TalentDraft | "cv", TalentError>>;
export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const cvMimeTypes = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } as const;
export function cvMetadataError(file: Pick<File, "name" | "size" | "type">): TalentError | undefined {
  if (!file.size || file.size > MAX_CV_BYTES) return "cv_size";
  const extension = file.name.toLowerCase().split(".").at(-1) as keyof typeof cvMimeTypes;
  if (!cvMimeTypes[extension] || (file.type && file.type !== cvMimeTypes[extension] && file.type !== "application/octet-stream")) return "cv_type";
}
export function safeProfessionalUrl(value: string, linkedin = false) {
  try { const url = new URL(value.trim()); return ["https:", "http:"].includes(url.protocol) && url.hostname.includes(".") && !url.username && !url.password && (!linkedin || url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com")); } catch { return false; }
}
export function validateTalentStep(step: number, draft: TalentDraft): TalentErrors {
  const errors: TalentErrors = {};
  const required = (key: keyof TalentDraft, max = 200) => { if (!String(draft[key]).trim()) errors[key] = "required"; else if (String(draft[key]).length > max) errors[key] = "length"; };
  if (step === 0) {
    if (!careerAreas.some(area => area.value === draft.careerArea)) errors.careerArea = "required";
    if (!(opportunityTypes as readonly string[]).includes(draft.opportunityType)) errors.opportunityType = "required";
    if (!(workModes as readonly string[]).includes(draft.workMode)) errors.workMode = "required";
    if (!countries.some(country => country.code === draft.country)) errors.country = "country";
    required("city");
  }
  if (step === 1) {
    if (draft.currentJobTitle.length > 200) errors.currentJobTitle = "length";
    const years = asciiDigits(draft.yearsOfExperience).trim();
    if (years && (!/^\d+$/.test(years) || Number(years) > 2147483647)) errors.yearsOfExperience = "years";
    for (const key of ["linkedinUrl", "portfolioUrl"] as const) if (draft[key].trim() && (!safeProfessionalUrl(draft[key], key === "linkedinUrl") || draft[key].length > 500)) errors[key] = key === "linkedinUrl" ? "linkedin" : "url";
    if (draft.message.length > 3000) errors.message = "length";
  }
  if (step === 2) {
    required("fullName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.length > 200) errors.email = "email";
    if (!countries.some(country => country.code === draft.phoneCountry)) errors.phoneCountry = "country";
    if (!/^[1-9][0-9]+$/.test(asciiDigits(draft.phoneNumber).replace(/[\s().-]/g, "")) || !/^\+[1-9][0-9]{7,14}$/.test(internationalPhone(draft))) errors.phoneNumber = "phone";
    if (!draft.privacyAccepted) errors.privacyAccepted = "consent";
  }
  return errors;
}
export function talentInput(draft: TalentDraft, submissionKey: string): JobApplicationInput {
  return { fullName: draft.fullName.trim(), email: draft.email.trim(), phone: internationalPhone(draft), country: draft.country, city: draft.city.trim(), specialization: draft.careerArea, careerArea: draft.careerArea as CareerArea,
    currentJobTitle: draft.currentJobTitle.trim(), yearsOfExperience: draft.yearsOfExperience.trim() === "" ? null : Number(asciiDigits(draft.yearsOfExperience)),
    employmentType: draft.opportunityType === "freelance" ? "other" : draft.opportunityType as "full_time" | "part_time" | "internship", opportunityType: draft.opportunityType as OpportunityType, workMode: draft.workMode as WorkMode,
    linkedinUrl: draft.linkedinUrl.trim(), portfolioUrl: draft.portfolioUrl.trim(), message: draft.message.trim(), privacyAccepted: draft.privacyAccepted, submissionKey, applicationKind: "talent_pool" };
}
export function validTalentInput(value: unknown): value is JobApplicationInput & { submissionKey: string; careerArea: CareerArea; opportunityType: OpportunityType; workMode: WorkMode } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (input.applicationKind !== "talent_pool" || ("jobId" in input && input.jobId != null) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(input.submissionKey))) return false;
  for (const key of ["careerArea", "opportunityType", "workMode", "country", "city", "fullName", "email", "phone"]) if (typeof input[key] !== "string") return false;
  for (const key of ["currentJobTitle", "linkedinUrl", "portfolioUrl", "message"]) if (input[key] !== undefined && typeof input[key] !== "string") return false;
  if (input.yearsOfExperience != null && (typeof input.yearsOfExperience !== "number" || !Number.isInteger(input.yearsOfExperience) || input.yearsOfExperience < 0 || input.yearsOfExperience > 2147483647)) return false;
  const draft: TalentDraft = { ...emptyTalentDraft, careerArea: input.careerArea as string, opportunityType: input.opportunityType as string, workMode: input.workMode as string, country: input.country as string, city: input.city as string,
    currentJobTitle: (input.currentJobTitle ?? "") as string, yearsOfExperience: input.yearsOfExperience == null ? "" : String(input.yearsOfExperience), linkedinUrl: (input.linkedinUrl ?? "") as string, portfolioUrl: (input.portfolioUrl ?? "") as string, message: (input.message ?? "") as string, fullName: input.fullName as string, email: input.email as string, privacyAccepted: input.privacyAccepted === true };
  return !Object.keys(validateTalentStep(0, draft)).length && !Object.keys(validateTalentStep(1, draft)).length && !!draft.fullName.trim() && draft.fullName.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) && draft.email.length <= 200 && /^\+[1-9][0-9]{7,14}$/.test(input.phone as string) && draft.privacyAccepted;
}
