import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { careerAreas, validTalentInput } from "../../features/applications/utils/talent-application";
import { inspectCv } from "./cv-validation.server";

const BUCKET = "application-files";
export async function registerTalentApplication(client: SupabaseClient, input: unknown, cv?: File | null): Promise<{ id: string }> {
  if (!validTalentInput(input)) throw new Error("invalid_input");
  const checked = cv ? await inspectCv(cv) : null;
  const findExisting = async () => {
    const { data, error } = await client.from("job_applications").select("id").eq("submission_key", input.submissionKey).maybeSingle();
    if (error) throw new Error("not_registered");
    return data?.id as string | undefined;
  };
  const existing = await findExisting();
  if (existing) return { id: existing };
  let cvPath: string | null = null;
  if (checked) {
    const { data: bucket, error: bucketError } = await client.storage.getBucket(BUCKET);
    if (bucketError || !bucket || bucket.public !== false) throw new Error("private_storage_unavailable");
    // Random object keys contain no candidate name, email or original filename.
    cvPath = `job-applications/${input.submissionKey}/${crypto.randomUUID()}.${checked.extension}`;
    const { error } = await client.storage.from(BUCKET).upload(cvPath, checked.bytes, { contentType: checked.mime, upsert: false, cacheControl: "0" });
    if (error) throw new Error("not_registered");
  }
  const clean = (value?: string) => value?.trim() || null;
  try {
    const { data, error } = await client.from("job_applications").insert({
      submission_key: input.submissionKey, application_kind: "talent_pool", career_area: input.careerArea,
      opportunity_type: input.opportunityType, work_mode: input.workMode, portfolio_url: clean(input.portfolioUrl),
      full_name: input.fullName.trim(), email: input.email.trim().toLowerCase(), phone: input.phone,
      country: clean(input.country), city: clean(input.city), specialization: careerAreas.find(area => area.value === input.careerArea)!.ar,
      current_job_title: clean(input.currentJobTitle), years_of_experience: input.yearsOfExperience ?? null,
      employment_type: input.opportunityType === "freelance" ? "other" : input.opportunityType,
      linkedin_url: clean(input.linkedinUrl), message: clean(input.message), cv_path: cvPath,
      privacy_accepted: true, status: "new", source: "website",
    }).select("id").single();
    if (error || !data?.id) {
      if (error?.code === "23505") {
        const saved = await findExisting();
        if (saved) { if (cvPath) await client.storage.from(BUCKET).remove([cvPath]); return { id: saved }; }
      }
      throw new Error("not_registered");
    }
    return { id: data.id };
  } catch {
    if (cvPath) await client.storage.from(BUCKET).remove([cvPath]);
    throw new Error("not_registered");
  }
}
