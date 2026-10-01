import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/client";
import type {
  ApplicationStatus,
  JobApplication,
  JobApplicationsFilters,
  JobApplicationStats,
  UpdateJobApplicationInput,
} from "../types/jobApplications";

const BUCKET = "application-files";

function getSupabase(client?: SupabaseClient) {
  return client ?? createClient();
}

type JobApplicationRow = {
  id: JobApplication["id"];
  full_name: JobApplication["fullName"];
  email: JobApplication["email"];
  phone: JobApplication["phone"];
  country: JobApplication["country"];
  city: JobApplication["city"];
  specialization: JobApplication["specialization"];
  current_job_title: JobApplication["currentJobTitle"];
  years_of_experience: JobApplication["yearsOfExperience"];
  employment_type: JobApplication["employmentType"];
  linkedin_url: JobApplication["linkedinUrl"];
  cv_path: JobApplication["cvPath"];
  message: JobApplication["message"];
  status: JobApplication["status"];
  assigned_to: JobApplication["assignedTo"];
  internal_notes: JobApplication["internalNotes"];
  last_contacted_at: JobApplication["lastContactedAt"];
  privacy_accepted: JobApplication["privacyAccepted"];
  source: JobApplication["source"];
  created_at: JobApplication["createdAt"];
  updated_at: JobApplication["updatedAt"];
  deleted_at: JobApplication["deletedAt"];
};

function mapRow(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    city: row.city,
    specialization: row.specialization,
    currentJobTitle: row.current_job_title,
    yearsOfExperience: row.years_of_experience,
    employmentType: row.employment_type,
    linkedinUrl: row.linkedin_url,
    cvPath: row.cv_path,
    message: row.message,
    status: row.status,
    assignedTo: row.assigned_to,
    internalNotes: row.internal_notes,
    lastContactedAt: row.last_contacted_at,
    privacyAccepted: row.privacy_accepted,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function listJobApplications(
  filters: JobApplicationsFilters = {},
  client?: SupabaseClient,
): Promise<JobApplication[]> {
  const supabase = getSupabase(client);

  let query = supabase
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (!filters.includeArchived) query = query.is("deleted_at", null);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      [
        `full_name.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `phone.ilike.%${search}%`,
        `specialization.ilike.%${search}%`,
        `current_job_title.ilike.%${search}%`,
        `country.ilike.%${search}%`,
        `city.ilike.%${search}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`تعذر تحميل طلبات الانضمام: ${error.message}`);

  return (data ?? []).map(mapRow);
}

export async function getJobApplicationById(
  id: string,
  client?: SupabaseClient,
): Promise<JobApplication | null> {
  const supabase = getSupabase(client);

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`تعذر تحميل تفاصيل الطلب: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function updateJobApplication(
  id: string,
  values: UpdateJobApplicationInput,
  client?: SupabaseClient,
): Promise<JobApplication> {
  const supabase = getSupabase(client);
  const payload: Record<string, unknown> = {};

  if (values.status !== undefined) payload.status = values.status;
  if (values.assignedTo !== undefined) payload.assigned_to = values.assignedTo;
  if (values.internalNotes !== undefined) payload.internal_notes = values.internalNotes?.trim() || null;
  if (values.lastContactedAt !== undefined) payload.last_contacted_at = values.lastContactedAt;

  const { data, error } = await supabase
    .from("job_applications")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`تعذر تحديث الطلب: ${error.message}`);
  return mapRow(data);
}

export async function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
  client?: SupabaseClient,
) {
  return updateJobApplication(
    id,
    {
      status,
      lastContactedAt: status === "contacted" ? new Date().toISOString() : undefined,
    },
    client,
  );
}

export async function saveJobApplicationNotes(
  id: string,
  notes: string,
  client?: SupabaseClient,
) {
  return updateJobApplication(id, { internalNotes: notes }, client);
}

export async function assignJobApplication(
  id: string,
  userId: string | null,
  client?: SupabaseClient,
) {
  return updateJobApplication(id, { assignedTo: userId }, client);
}

export async function archiveJobApplication(
  id: string,
  client?: SupabaseClient,
) {
  const supabase = getSupabase(client);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("job_applications")
    .update({
      status: "archived",
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (error) throw new Error(`تعذر أرشفة الطلب: ${error.message}`);
}

export async function restoreJobApplication(
  id: string,
  client?: SupabaseClient,
) {
  const supabase = getSupabase(client);

  const { data, error } = await supabase
    .from("job_applications")
    .update({
      status: "under_review",
      deleted_at: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`تعذر استعادة الطلب: ${error.message}`);
  return mapRow(data);
}

export async function getJobApplicationCvUrl(
  cvPath: string,
  expiresIn = 600,
  client?: SupabaseClient,
) {
  const supabase = getSupabase(client);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(cvPath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`تعذر إنشاء رابط السيرة الذاتية: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}

export async function getJobApplicationStats(
  client?: SupabaseClient,
): Promise<JobApplicationStats> {
  const rows = await listJobApplications({ includeArchived: true }, client);

  return rows.reduce<JobApplicationStats>(
    (stats, item) => {
      stats.total += 1;
      if (item.status === "new") stats.new += 1;
      if (item.status === "under_review") stats.underReview += 1;
      if (item.status === "contacted") stats.contacted += 1;
      if (item.status === "approved") stats.approved += 1;
      if (item.status === "rejected") stats.rejected += 1;
      if (item.status === "archived") stats.archived += 1;
      return stats;
    },
    { total: 0, new: 0, underReview: 0, contacted: 0, approved: 0, rejected: 0, archived: 0 },
  );
}