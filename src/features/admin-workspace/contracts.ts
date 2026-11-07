import {
  careerAreas,
  opportunityTypes,
  workModes,
} from "../applications/utils/talent-application";
import { countries } from "../applications/utils/partner-interest-form";
export { careerAreas, opportunityTypes, workModes };
export type Locale = "ar" | "en";
export type IntakeModule = "applications" | "partners";
export type IntakeRecord = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  internal_notes: string | null;
  deleted_at: string | null;
  application_kind?: string | null;
  [key: string]: unknown;
};
export const words: Record<string, [string, string]> = {
  role_permissions_saved: ["حفظ الدور والصلاحيات", "Role permissions saved"],
  admin_user_access_updated: ["تحديث صلاحيات مستخدم", "User access updated"],
  create: ["إنشاء", "Created"],
  update: ["تعديل", "Updated"],
  soft_delete: ["أرشفة", "Archived"],
  restore: ["استعادة", "Restored"],
  permanent_delete: ["حذف نهائي", "Permanently deleted"],
  publish: ["نشر", "Published"],
  unpublish: ["إلغاء النشر", "Unpublished"],
  full_time: ["دوام كامل", "Full time"],
  part_time: ["دوام جزئي", "Part time"],
  internship: ["تدريب", "Internship"],
  freelance: ["عمل مستقل", "Freelance"],
  other: ["أخرى", "Other"],
  onsite: ["حضوري", "On site"],
  remote: ["عن بُعد", "Remote"],
  hybrid: ["هجين", "Hybrid"],
  no_preference: ["دون تفضيل", "No preference"],
  new: ["جديد", "New"],
  under_review: ["قيد المراجعة", "Under review"],
  contacted: ["تم التواصل", "Contacted"],
  approved: ["مقبول — سجل سابق", "Approved — legacy"],
  rejected: ["مرفوض — سجل سابق", "Rejected — legacy"],
  archived: ["مؤرشف", "Archived"],
  suitable: ["مناسب لفرصة", "Suitable for an opportunity"],
  not_suitable: ["غير مناسب حاليًا", "Not suitable currently"],
  completion_required: ["استكمال مطلوب", "Completion required"],
  qualifying: ["التأهيل", "Qualification"],
  final_review: ["المراجعة النهائية", "Final review"],
  contracting: ["التعاقد", "Contracting"],
  withdrawn: ["منسحب", "Withdrawn"],
  international: ["شريك دولي", "International partner"],
  service_provider: ["مقدم خدمات", "Service provider"],
  hotel: ["فنادق", "Hotels"],
  transport: ["نقل", "Transport"],
  visa: ["تأشيرات", "Visas"],
  airline: ["طيران", "Flights"],
  umrah_company: ["شركة عمرة", "Umrah company"],
  guide: ["إرشاد", "Guides"],
  technology: ["تقنية", "Technology"],
  created: ["إنشاء السجل", "Record created"],
  updated: ["تعديل السجل", "Record updated"],
  status: ["تغيير الحالة", "Status changed"],
  assigned: ["إسناد", "Assigned"],
  notes: ["تحديث الملاحظات", "Notes updated"],
  restored: ["استعادة", "Restored"],
  task_created: ["إنشاء متابعة", "Follow-up created"],
  task_updated: ["تحديث متابعة", "Follow-up updated"],
  open: ["مفتوحة", "Open"],
  done: ["مكتملة", "Done"],
  cancelled: ["ملغاة", "Cancelled"],
};
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe =
    /^[\s\uFEFF\u202a-\u202e\u2066-\u2069]*[=+@-]/.test(text) ||
    /^[\t\r\n]/.test(text)
      ? `'${text}`
      : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function label(value: unknown, lang: Locale): string {
  if (value === null || value === undefined || value === "")
    return lang === "ar" ? "غير مسجل" : "Not recorded";
  if (typeof value === "boolean")
    return value
      ? lang === "ar"
        ? "نعم"
        : "Yes"
      : lang === "ar"
        ? "لا"
        : "No";
  if (Array.isArray(value))
    return value.map((item) => label(item, lang)).join("، ");
  const text = String(value);
  const area = careerAreas.find((item) => item.value === text);
  return words[text]?.[lang === "ar" ? 0 : 1] ?? area?.[lang] ?? text;
}
export function countryName(value: unknown, lang: Locale) {
  return (
    countries.find((country) => country.code === value)?.[lang] ??
    label(value, lang)
  );
}
export function opportunity(row: IntakeRecord, lang: Locale) {
  return label(row.opportunity_type ?? row.employment_type, lang);
}
export function statusLabel(
  row: Pick<IntakeRecord, "status" | "application_kind"> & {
    partner_type?: unknown;
    partnership_track?: unknown;
  },
  lang: Locale,
) {
  if (
    row.status === "approved" &&
    (row.partner_type !== undefined || row.partnership_track !== undefined)
  )
    return lang === "ar" ? "معتمد" : "Approved partner";
  if (row.application_kind === "talent_pool" && row.status === "approved")
    return label("suitable", lang);
  if (row.application_kind === "talent_pool" && row.status === "rejected")
    return label("not_suitable", lang);
  return label(row.status, lang);
}
export function dateLabel(value: unknown, lang: Locale) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
        calendar: "gregory",
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Riyadh",
      }).format(new Date(value))
    : label(null, lang);
}
export function safeAdminNext(value: string | null) {
  if (!value || !value.startsWith("/admin/") || /[\\\x00-\x20]/.test(value))
    return "/admin/dashboard";
  try {
    const url = new URL(value, "https://nour.invalid");
    const decoded = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://nour.invalid" ||
      !decoded.startsWith("/admin/") ||
      decoded.includes("..") ||
      decoded.startsWith("/admin/login") ||
      decoded.startsWith("/admin/invite")
    )
      return "/admin/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/admin/dashboard";
  }
}
export const fields: Record<string, [string, string]> = {
  full_name: ["الاسم", "Name"],
  email: ["البريد الإلكتروني", "Email"],
  phone: ["رقم الجوال", "Phone"],
  country: ["دولة الإقامة / التشغيل", "Residence / operating country"],
  city: ["المدينة", "City"],
  career_area: ["المجال المهني", "Career area"],
  specialization: ["التخصص المسجل", "Recorded specialization"],
  opportunity_type: ["نوع الفرصة المفضل", "Preferred opportunity"],
  employment_type: ["نوع التعاون السابق", "Legacy cooperation type"],
  work_mode: ["نمط العمل المفضل", "Preferred work arrangement"],
  current_job_title: ["المسمى الحالي", "Current title"],
  years_of_experience: ["سنوات الخبرة", "Years of experience"],
  linkedin_url: ["LinkedIn", "LinkedIn"],
  portfolio_url: ["رابط الأعمال", "Portfolio"],
  message: ["نبذة المتقدم", "Applicant message"],
  privacy_accepted: ["موافقة الخصوصية المسجلة", "Recorded privacy consent"],
  source: ["المصدر", "Source"],
  last_contacted_at: ["آخر تواصل مسجل", "Last recorded contact"],
  application_kind: ["نوع الطلب", "Application kind"],
  company_name: ["اسم الجهة", "Organization"],
  contact_name: ["اسم المسؤول", "Contact name"],
  contact_role: ["صفة المسؤول", "Contact role"],
  headquarters_country: ["دولة المقر", "Headquarters country"],
  partnership_track: ["مسار الشراكة", "Partnership track"],
  partner_type: ["نوع الشراكة", "Partner type"],
  service_types: ["الخدمات", "Services"],
  registration_number: ["رقم التسجيل", "Registration number"],
  license_number: ["رقم الترخيص", "License number"],
  website_url: ["الموقع الإلكتروني", "Website"],
  company_description: ["نبذة الجهة", "Organization overview"],
  services_description: ["وصف الخدمات", "Service description"],
  served_countries: ["الدول المخدومة", "Countries served"],
  notes: ["ملاحظات مقدم الطلب", "Applicant notes"],
  terms_accepted: ["الموافقة المسجلة", "Recorded consent"],
  operational_active: ["التشغيل مفعّل", "Operations enabled"],
  completion_requirements: ["متطلبات الاستكمال", "Completion requirements"],
  completion_channel: ["قناة الاستكمال", "Completion channel"],
  contract_reference: ["مرجع العقد", "Contract reference"],
  country_annex_reference: ["مرجع ملحق الدولة", "Country annex reference"],
  approval_notice_reference: [
    "مرجع إشعار الاعتماد",
    "Approval notice reference",
  ],
};
