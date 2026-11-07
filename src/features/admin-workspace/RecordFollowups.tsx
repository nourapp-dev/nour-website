"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
import { can, useWorkspace } from "./WorkspaceProvider";
import { dateLabel, label, type IntakeModule } from "./contracts";
import { Failure, Loading, Empty } from "./States";
import { useUnsaved } from "./useUnsaved";
import { refreshWorkspace } from "./data";
export type Followup = {
  id: string;
  module: IntakeModule;
  record_id: string;
  title: string;
  assigned_to: string;
  due_at: string | null;
  status: string;
  updated_at: string;
};
export default function RecordFollowups({
  module,
  recordId,
  mine = false,
  scope = "",
  page = 1,
}: {
  module?: IntakeModule;
  recordId?: string;
  mine?: boolean;
  scope?: string;
  page?: number;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const cache = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState<unknown>(null);
  useUnsaved(
    !!title.trim() || !!due,
    ar
      ? "لديك متابعة غير محفوظة. هل تريد المغادرة؟"
      : "You have an unsaved follow-up. Leave?",
  );
  const tasks = useQuery({
    queryKey: [
      "admin-workspace",
      "followups",
      module,
      recordId,
      mine,
      scope,
      page,
    ],
    queryFn: async () => {
      let q = createClient("admin")
        .from("admin_followups")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);
      if (module) q = q.eq("module", module);
      if (recordId) q = q.eq("record_id", recordId);
      if (mine) q = q.eq("assigned_to", identity.id);
      if (scope === "open" || scope === "overdue") q = q.eq("status", "open");
      if (scope === "done" || scope === "cancelled") q = q.eq("status", scope);
      if (scope === "overdue") q = q.lt("due_at", new Date().toISOString());
      const r = await q;
      if (r.error) throw r.error;
      return { items: r.data as Followup[], total: r.count ?? 0 };
    },
    retry: false,
  });
  const assignees = useQuery({
    queryKey: ["admin-workspace", "assignees", module],
    enabled: !!module && can(identity, module, "assign"),
    queryFn: async () => {
      const r = await createClient("admin").rpc("workspace_assignees", {
        module,
      });
      if (r.error) throw r.error;
      return r.data as { id: string; full_name: string }[];
    },
    retry: false,
  });
  async function save(task?: Followup, nextStatus?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const r = await createClient("admin").rpc("workspace_save_task", {
        task_id: task?.id ?? null,
        module: task?.module ?? module,
        record_id: task?.record_id ?? recordId,
        title: task?.title ?? title,
        assignee: task?.assigned_to ?? owner,
        due_at:
          task?.due_at ??
          (due ? new Date(`${due}:00+03:00`).toISOString() : null),
        next_status: nextStatus ?? "open",
        expected_updated_at: task?.updated_at ?? null,
      });
      if (r.error) throw r.error;
      if (!task) {
        setTitle("");
        setOwner("");
        setDue("");
      }
      await refreshWorkspace(
        cache,
        task?.module ?? module,
        task?.record_id ?? recordId,
      );
    } catch (error) {
      setError(error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const Heading = mine ? "h1" : "h2";
  return (
    <section className="aw-card">
      <Heading>
        {mine
          ? ar
            ? "مهامي"
            : "My tasks"
          : ar
            ? "المتابعة الداخلية — أحدث ٢٠ سجلًا"
            : "Internal follow-up — latest 20 records"}
      </Heading>
      {mine && (
        <label>
          {ar ? "حالة المتابعة" : "Follow-up status"}
          <select
            value={scope}
            onChange={(event) =>
              router.replace(`/admin/tasks?scope=${event.target.value}&page=1`)
            }
          >
            <option value="">{ar ? "الكل" : "All"}</option>
            <option value="open">{ar ? "المفتوحة" : "Open"}</option>
            <option value="overdue">
              {ar ? "متجاوزة الاستحقاق" : "Overdue"}
            </option>
            <option value="done">{ar ? "المكتملة" : "Done"}</option>
            <option value="cancelled">{ar ? "الملغاة" : "Cancelled"}</option>
          </select>
        </label>
      )}
      <p className="aw-muted">
        {ar
          ? "الموعد اختياري وبتوقيت الرياض. لا يُعد الطلب متأخرًا دون موعد مسجل."
          : "Due dates are optional and use Riyadh time. No due date means no overdue claim."}
      </p>
      {error !== null && <Failure error={error} />}{" "}
      {tasks.isPending ? (
        <Loading />
      ) : tasks.isError ? (
        <Failure error={tasks.error} retry={() => void tasks.refetch()} />
      ) : !tasks.data.items.length ? (
        <Empty />
      ) : (
        <ul className="aw-timeline">
          {tasks.data.items.map((task) => (
            <li key={task.id}>
              <strong>{task.title}</strong>
              <small>
                {ar ? "المسؤول: " : "Owner: "}
                {assignees.data?.find(
                  (person) => person.id === task.assigned_to,
                )?.full_name ??
                  (task.assigned_to === identity.id
                    ? identity.name
                    : task.assigned_to)}
              </small>
              <small>
                {label(task.status, language)} ·{" "}
                {task.due_at
                  ? dateLabel(task.due_at, language)
                  : ar
                    ? "دون موعد"
                    : "No due date"}
                {task.status === "open" &&
                task.due_at &&
                Date.parse(task.due_at) < tasks.dataUpdatedAt
                  ? ` · ${ar ? "متأخرة" : "Overdue"}`
                  : ""}
              </small>
              <Link
                className="aw-link"
                href={`/admin/${task.module}/${task.record_id}`}
              >
                {ar ? "فتح الطلب المرتبط" : "Open linked request"}
              </Link>
              {(task.assigned_to === identity.id ||
                can(identity, task.module, "assign")) && (
                <div className="aw-actions">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void save(task, task.status === "open" ? "done" : "open")
                    }
                  >
                    {task.status !== "open"
                      ? ar
                        ? "إعادة فتح"
                        : "Reopen"
                      : ar
                        ? "إكمال المتابعة"
                        : "Complete follow-up"}
                  </button>
                  {task.status === "open" && (
                    <button
                      disabled={busy}
                      onClick={() => void save(task, "cancelled")}
                    >
                      {ar ? "إلغاء المتابعة" : "Cancel follow-up"}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="aw-pagination" hidden={!mine}>
        <button
          disabled={page <= 1}
          onClick={() =>
            router.replace(
              "/admin/tasks?scope=" + scope + "&page=" + (page - 1),
            )
          }
        >
          {ar ? "السابق" : "Previous"}
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil((tasks.data?.total ?? 0) / 20))}
        </span>
        <button
          disabled={page * 20 >= (tasks.data?.total ?? 0)}
          onClick={() =>
            router.replace(
              "/admin/tasks?scope=" + scope + "&page=" + (page + 1),
            )
          }
        >
          {ar ? "التالي" : "Next"}
        </button>
      </div>
      {module && can(identity, module, "assign") && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="aw-filters">
            <label>
              {ar ? "عنوان المتابعة" : "Follow-up title"}
              <input
                required
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              {ar ? "المسؤول" : "Owner"}
              <select
                value={owner}
                required
                onChange={(e) => setOwner(e.target.value)}
              >
                <option value="">
                  {ar ? "اختر موظفًا" : "Select employee"}
                </option>
                {assignees.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {ar ? "موعد اختياري — الرياض" : "Optional due date — Riyadh"}
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
          </div>
          {assignees.isError && (
            <Failure
              error={assignees.error}
              retry={() => void assignees.refetch()}
            />
          )}
          <button className="aw-primary" disabled={busy || assignees.isError}>
            {ar ? "إضافة متابعة" : "Add follow-up"}
          </button>
        </form>
      )}
    </section>
  );
}
