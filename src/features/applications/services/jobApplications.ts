import { cvMetadataError } from "../utils/talent-application";
import { createClient } from "../../../lib/supabase/client";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "remote"
  | "internship"
  | "other";

export type JobApplicationInput = {
  submissionKey?: string;
  careerArea?: import("../utils/talent-application").CareerArea;
  opportunityType?: import("../utils/talent-application").OpportunityType;
  workMode?: import("../utils/talent-application").WorkMode;
  portfolioUrl?: string;
  applicationKind?: "talent_pool";
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  specialization?: string;
  currentJobTitle?: string;
  yearsOfExperience?: number | null;
  employmentType: EmploymentType;
  linkedinUrl?: string;
  message?: string;
  privacyAccepted: boolean;
};

export type SubmitJobApplicationResult = {
  id: string;
};

const CV_BUCKET = "application-files";

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

function validateCv(file: File) {
  if (cvMetadataError(file)) throw new JobSubmissionError("cv_invalid");
}

export async function submitJobApplication(
  values: JobApplicationInput,
  cvFile?: File | null,
): Promise<SubmitJobApplicationResult> {
  if (!values.privacyAccepted) {
    throw new Error("يجب الموافقة على سياسة الخصوصية قبل إرسال الطلب.");
  }

  if (values.submissionKey) {
    if (cvFile) validateCv(cvFile);
    const body = new FormData(); body.append("input", JSON.stringify(values));
    if (cvFile) body.append("cv", cvFile);
    const response = await fetch("/api/applications/join", { method: "POST", body, credentials: "same-origin" });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new JobSubmissionError(result?.code === "cv_invalid" ? "cv_invalid" : "not_registered");
    if (typeof result?.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.id)) throw new JobSubmissionError("not_registered");
    return { id: result.id };
  }
  const supabase = createClient();
  const applicationId = crypto.randomUUID();

  let cvPath: string | null = null;

  if (cvFile) {
    validateCv(cvFile);

    const safeName =
      sanitizeFileName(cvFile.name) ||
      `cv-${Date.now()}.pdf`;

    cvPath = `job-applications/${applicationId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(CV_BUCKET)
      .upload(cvPath, cvFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: cvFile.type,
      });

    if (uploadError) {
      throw new Error(`تعذر رفع السيرة الذاتية: ${uploadError.message}`);
    }
  }

  const { error: insertError } = await supabase
    .from("job_applications")
    .insert({
      id: applicationId,
      full_name: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      country: clean(values.country),
      city: clean(values.city),
      specialization: clean(values.specialization),
      current_job_title: clean(values.currentJobTitle),
      years_of_experience:
        values.yearsOfExperience === null ||
        values.yearsOfExperience === undefined
          ? null
          : values.yearsOfExperience,
      employment_type: values.employmentType,
      linkedin_url: clean(values.linkedinUrl),
      cv_path: cvPath,
      message: clean(values.message),
      privacy_accepted: true,
      status: "new",
      source: "website",
    });

  if (insertError) {
    if (cvPath) {
      await supabase.storage.from(CV_BUCKET).remove([cvPath]);
    }

    throw new Error(`تعذر إرسال الطلب: ${insertError.message}`);
  }

  return { id: applicationId };
}
export class JobSubmissionError extends Error {
  constructor(public code: "cv_invalid" | "not_registered") { super(code); this.name = "JobSubmissionError"; }
}
