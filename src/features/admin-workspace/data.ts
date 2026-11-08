import { createClient } from "../../lib/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import type { IntakeModule, IntakeRecord } from "./contracts";
export type Filters = {
  status: string;
  area: string;
  opportunity: string;
  from: string;
  to: string;
  archived: string;
  page: string;
  owner: string;
  sort: string;
  direction: string;
  search?: string;
  size?: string;
};
export const emptyFilters: Filters = {
  status: "",
  area: "",
  opportunity: "",
  from: "",
  to: "",
  archived: "false",
  page: "1",
  owner: "",
  sort: "created_at",
  direction: "desc",
};
export function filtersFrom(params: URLSearchParams): Filters {
  const result = { ...emptyFilters };
  for (const key of Object.keys(result) as (keyof Filters)[]) {
    const value = params.get(key);
    if (value !== null) result[key] = value.slice(0, 100);
  }
  result.page = String(Math.max(1, Math.min(100000, Number(result.page) || 1)));
  return result;
}
export async function listIntake(
  module: IntakeModule,
  filters: Partial<Filters>,
  signal?: AbortSignal,
) {
  let query = createClient("admin").rpc("workspace_list", { module, filters });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return data as { items: IntakeRecord[]; total: number };
}
export async function getIntake(
  module: IntakeModule,
  id: string,
  signal?: AbortSignal,
) {
  let query = createClient("admin")
    .from(
      module === "applications" ? "job_applications" : "partner_applications",
    )
    .select("*")
    .eq("id", id);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as IntakeRecord | null;
}
export async function updateIntake(
  module: IntakeModule,
  row: IntakeRecord,
  patch: Record<string, unknown>,
) {
  const { data, error } = await createClient("admin").rpc("workspace_update", {
    module,
    record_id: row.id,
    expected_updated_at: row.updated_at,
    patch,
  });
  if (error) throw error;
  return data as IntakeRecord;
}
export function errorText(error: unknown, ar: boolean) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  if (code === "40001" || message.includes("edit_conflict"))
    return ar
      ? "عدل موظف آخر السجل. أعد تحميل أحدث نسخة قبل الحفظ؛ بقيت تعديلاتك في النموذج."
      : "Another person changed this record. Reload the latest version before saving; your draft is preserved.";
  if (code === "42501")
    return ar
      ? "لا تملك صلاحية تنفيذ هذا الإجراء."
      : "You do not have permission for this action.";
  if (message.includes("invalid_status_transition"))
    return ar
      ? "هذا الانتقال غير مسموح. راجع الحالة الحالية."
      : "This status transition is not allowed. Review the current status.";
  if (/Approval requires/.test(message))
    return ar
      ? "يلزم مرجع العقد وإشعار الاعتماد وملحق الدولة عند انطباقه قبل الاعتماد."
      : "Approval requires contract, approval notice and applicable country annex references.";
  return ar
    ? "تعذر إتمام الطلب. تحقق من الاتصال والصلاحيات وأعد المحاولة."
    : "Unable to complete the request. Check your connection and permissions, then retry.";
}
export function nextStatuses(row: IntakeRecord, module: IntakeModule) {
  if (module === "partners")
    return (
      (
        {
          new: ["under_review", "rejected", "withdrawn"],
          under_review: [
            "contacted",
            "completion_required",
            "qualifying",
            "rejected",
            "withdrawn",
          ],
          contacted: [
            "under_review",
            "completion_required",
            "qualifying",
            "rejected",
            "withdrawn",
          ],
          completion_required: [
            "under_review",
            "qualifying",
            "rejected",
            "withdrawn",
          ],
          qualifying: [
            "completion_required",
            "final_review",
            "rejected",
            "withdrawn",
          ],
          final_review: ["qualifying", "contracting", "rejected", "withdrawn"],
          contracting: ["final_review", "approved", "rejected", "withdrawn"],
          approved: ["under_review", "withdrawn"],
          rejected: ["under_review"],
          withdrawn: ["under_review"],
          archived: ["under_review"],
        } as Record<string, string[]>
      )[row.status] ?? []
    );
  return (
    (
      {
        new: ["under_review", "rejected"],
        under_review: ["contacted", "approved", "rejected"],
        contacted: ["under_review", "approved", "rejected"],
        approved: ["under_review"],
        rejected: ["under_review"],
        archived: ["under_review"],
      } as Record<string, string[]>
    )[row.status] ?? []
  );
}
export async function refreshWorkspace(
  cache: QueryClient,
  module?: IntakeModule,
  recordId?: string,
) {
  const keys: string[][] = [
    ["admin-workspace", "metric"],
    ["admin-workspace", "task-summary"],
    ["admin-workspace", "recent-activity"],
    ["admin-workspace", "activity"],
    ["admin-workspace", "unread"],
    ["admin-workspace", "notifications"],
    ["admin-workspace", "followups"],
  ];
  if (module) {
    keys.push(["admin-workspace", module, "list"]);
    if (recordId) keys.push(["admin-workspace", module, "events", recordId]);
  }
  await Promise.all(
    keys.map((queryKey) => cache.invalidateQueries({ queryKey })),
  );
}
