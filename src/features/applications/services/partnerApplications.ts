import { validatePartnerInterest } from "../utils/partner-interest";
import { createClient } from "../../../lib/supabase/client";

export type PartnerType =
  | "hotel"
  | "transport"
  | "visa"
  | "umrah_company"
  | "guide"
  | "airline"
  | "service_provider"
  | "technology"
  | "other";

export type PartnerApplicationInput = {
  partnershipTrack?: "international" | "service_provider";
  contactRole?: string;
  headquartersCountry?: string;
  serviceTypes?: PartnerType[];
  submissionKey?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  partnerType: PartnerType;
  registrationNumber?: string;
  licenseNumber?: string;
  websiteUrl?: string;
  companyDescription?: string;
  servicesDescription?: string;
  servedCountries?: string[];
  notes?: string;
  termsAccepted: boolean;
};

export type SubmitPartnerApplicationResult = {
  id: string;
};

const FILE_BUCKET = "application-files";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function normalizeCountries(values?: string[]) {
  return (values ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateAttachment(file: File) {
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error("صيغة المرفق غير مدعومة. استخدم PDF أو DOC أو DOCX أو JPG أو PNG.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("حجم المرفق يجب ألا يتجاوز 5MB.");
  }
}

export async function submitPartnerApplication(
  values: PartnerApplicationInput,
  attachment?: File | null,
): Promise<SubmitPartnerApplicationResult> {
  if (!values.termsAccepted) {
    throw new Error("يجب الموافقة على الشروط وسياسة الخصوصية قبل إرسال الطلب.");
  }

  if (values.partnershipTrack) validatePartnerInterest(values);

  const supabase = createClient();
  // The wizard uses the existing database through a narrow create-only RPC.
  // It returns only the ID actually stored by PostgreSQL, without public SELECT access.
  if (values.submissionKey) {
    if (attachment) throw new Error("Attachments are not accepted in the interest wizard");
    const { data, error } = await supabase.rpc("submit_partner_interest", { input: {
      submission_key: values.submissionKey, partnership_track: values.partnershipTrack,
      headquarters_country: clean(values.headquartersCountry), country: clean(values.country), city: clean(values.city),
      service_types: values.serviceTypes ?? [], served_countries: normalizeCountries(values.servedCountries),
      company_name: values.companyName.trim(), website_url: clean(values.websiteUrl), company_description: clean(values.companyDescription),
      contact_name: values.contactName.trim(), contact_role: clean(values.contactRole),
      email: values.email.trim().toLowerCase(), phone: values.phone.trim(), terms_accepted: values.termsAccepted,
    } });
    if (error) throw new Error(`Unable to register application: ${error.message}`);
    if (typeof data !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
      throw new Error("Registration did not return a valid application reference");
    }
    return { id: data };
  }
  // Retain the original insert path for existing callers, including optional files.
  const applicationId = crypto.randomUUID();

  let attachmentPath: string | null = null;

  if (attachment) {
    validateAttachment(attachment);

    const safeName =
      sanitizeFileName(attachment.name) ||
      `attachment-${Date.now()}`;

    attachmentPath =
      `partner-applications/${applicationId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FILE_BUCKET)
      .upload(attachmentPath, attachment, {
        cacheControl: "3600",
        upsert: false,
        contentType: attachment.type,
      });

    if (uploadError) {
      throw new Error(`تعذر رفع المرفق: ${uploadError.message}`);
    }
  }

  const servedCountries = normalizeCountries(values.servedCountries);

  const { error: insertError } = await supabase
    .from("partner_applications")
    .insert({
      id: applicationId,
      ...(values.partnershipTrack ? { partnership_track: values.partnershipTrack, contact_role: clean(values.contactRole) } : {}),
      company_name: values.companyName.trim(),
      contact_name: values.contactName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      country: clean(values.country),
      city: clean(values.city),
      partner_type: values.partnerType,
      registration_number: clean(values.registrationNumber),
      license_number: clean(values.licenseNumber),
      website_url: clean(values.websiteUrl),
      company_description: clean(values.companyDescription),
      services_description: clean(values.servicesDescription),
      served_countries: servedCountries.length ? servedCountries : null,
      attachment_path: attachmentPath,
      notes: clean(values.notes),
      terms_accepted: true,
      status: "new",
      source: "website",
    });

  if (insertError) {
    if (attachmentPath) {
      await supabase.storage.from(FILE_BUCKET).remove([attachmentPath]);
    }

    throw new Error(`تعذر إرسال طلب الشراكة: ${insertError.message}`);
  }

  return { id: applicationId };
}
