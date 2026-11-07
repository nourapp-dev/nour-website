"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { can, useWorkspace } from "./WorkspaceProvider";
import {
  countryName,
  dateLabel,
  fields,
  label,
  opportunity,
  safeAdminNext,
  statusLabel,
  type IntakeModule,
  type IntakeRecord,
} from "./contracts";
import {
  getIntake,
  nextStatuses,
  updateIntake,
  refreshWorkspace,
} from "./data";
import { Empty, Failure, Loading } from "./States";
import { useUnsaved } from "./useUnsaved";
import RecordFollowups from "./RecordFollowups";
import { useToast } from "../../core/notifications";
export default function IntakeDetail({
  module,
  id,
  preview = false,
  returnTo,
}: {
  module: IntakeModule;
  id: string;
  preview?: boolean;
  returnTo?: string;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [revision, setRevision] = useState(0);
  const query = useQuery({
    queryKey: ["admin-workspace", module, "record", id],
    queryFn: ({ signal }) => getIntake(module, id, signal),
    retry: false,
    staleTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  if (query.isPending) return <Loading />;
  if (query.isError && !query.data)
    return <Failure error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return <Empty />;
  return (
    <>
      <header className="aw-heading">
        <div>
          {!preview && (
            <Link
              className="aw-link"
              href={
                returnTo?.startsWith(`/admin/${module}`)
                  ? safeAdminNext(returnTo)
                  : `/admin/${module}`
              }
            >
              {ar ? "العودة إلى القائمة" : "Back to list"}
            </Link>
          )}
          <h1>{String(query.data.full_name ?? query.data.company_name)}</h1>
        </div>
        {preview && (
          <Link className="aw-link" href={`/admin/${module}/${id}`}>
            {ar ? "فتح صفحة التفاصيل" : "Open full details"}
          </Link>
        )}
      </header>
      {query.isError && (
        <Failure error={query.error} retry={() => void query.refetch()} />
      )}
      <RecordEditor
        key={`${query.data.updated_at}:${revision}`}
        module={module}
        row={query.data}
        onReload={async () => {
          const result = await query.refetch();
          if (!result.isError) setRevision((value) => value + 1);
        }}
      />
    </>
  );
}
function RecordEditor({
  module,
  row,
  onReload,
}: {
  module: IntakeModule;
  row: IntakeRecord;
  onReload: () => Promise<void>;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const cache = useQueryClient();
  const { showToast } = useToast();
  const lock = useRef(false);
  const [notes, setNotes] = useState(row.internal_notes ?? "");
  const [status, setStatus] = useState(row.status);
  const [owner, setOwner] = useState(row.assigned_to ?? "");
  const [partner, setPartner] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const dirty =
    notes !== (row.internal_notes ?? "") ||
    status !== row.status ||
    owner !== (row.assigned_to ?? "") ||
    Object.entries(partner).some(([key, value]) => value !== (row[key] ?? ""));
  useUnsaved(
    dirty,
    ar
      ? "لديك تعديلات غير محفوظة. هل تريد المغادرة؟"
      : "You have unsaved changes. Leave this page?",
  );
  const assignees = useQuery({
    queryKey: ["admin-workspace", "assignees", module],
    enabled: can(identity, module, "assign"),
    queryFn: async () => {
      const result = await createClient("admin").rpc("workspace_assignees", {
        module,
      });
      if (result.error) throw result.error;
      return result.data as { id: string; full_name: string }[];
    },
    retry: false,
  });
  const events = useQuery({
    queryKey: ["admin-workspace", module, "events", row.id],
    queryFn: async () => {
      const result = await createClient("admin")
        .from("admin_intake_events")
        .select("id,event,actor_id,changes,created_at")
        .eq("module", module)
        .eq("record_id", row.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (result.error) throw result.error;
      return result.data as {
        id: string;
        event: string;
        actor_id: string | null;
        changes: Record<string, unknown>;
        created_at: string;
      }[];
    },
    retry: false,
  });
  async function save(patch?: Record<string, unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setSaved("");
    try {
      const updated = await updateIntake(
        module,
        row,
        patch ?? {
          ...(can(identity, module, "manage") ? { internal_notes: notes } : {}),
          ...(status !== row.status ? { status } : {}),
          ...(owner !== (row.assigned_to ?? "")
            ? { assigned_to: owner || null }
            : {}),
          ...partner,
        },
      );
      showToast({
        title: ar ? "تم حفظ الطلب" : "Request saved",
        variant: "success",
      });
      cache.setQueryData(
        ["admin-workspace", module, "record", row.id],
        updated,
      );
      await refreshWorkspace(cache, module, row.id);
      setSaved(ar ? "تم الحفظ" : "Saved");
    } catch (error) {
      setError(error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function attachment() {
    setError(null);
    try {
      const path = String(row.cv_path ?? row.attachment_path ?? "");
      const result = await createClient("admin")
        .storage.from("application-files")
        .createSignedUrl(path, 120);
      if (result.error || !result.data) throw result.error ?? new Error();
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setError(error);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(row.id);
      setCopyStatus(ar ? "نُسخ المرجع" : "Reference copied");
    } catch {
      setCopyStatus(
        ar
          ? "تعذر النسخ؛ يمكنك تحديد المرجع ونسخه."
          : "Could not copy; select and copy the reference.",
      );
    }
  }
  const safeLink = (value: unknown) => {
    try {
      const u = new URL(String(value));
      return ["https:", "http:"].includes(u.protocol) ? u.href : null;
    } catch {
      return null;
    }
  };
  return (
    <div data-dirty={dirty ? "true" : "false"}>
      <section className="aw-card">
        <div className="aw-actions">
          <span className="aw-badge" data-status={row.status}>
            {statusLabel(row, language)}
          </span>
          <span>{dateLabel(row.created_at, language)}</span>
        </div>
        <p className="aw-reference" dir="ltr">
          {row.id}
        </p>
        <button onClick={() => void copy()}>
          {ar ? "نسخ المرجع" : "Copy reference"}
        </button>
        <span role="status" className="aw-muted">
          {" "}
          {copyStatus}
        </span>
        {module === "applications" &&
          row.application_kind === "talent_pool" && (
            <p className="aw-notice">
              {ar
                ? "طلب ضمن قاعدة المواهب؛ تغيير الحالة لا يعني التوظيف ولا يرسل رسالة للمتقدم."
                : "Talent-pool expression of interest. Status changes do not mean hiring and send no applicant messages."}
            </p>
          )}
        <dl className="aw-detail-grid">
          {Object.entries(fields)
            .filter(
              ([key]) =>
                key in row &&
                ![
                  "completion_requirements",
                  "completion_channel",
                  "contract_reference",
                  "country_annex_reference",
                  "approval_notice_reference",
                ].includes(key),
            )
            .map(([key, titles]) => {
              const value = row[key];
              const url = key.endsWith("_url") ? safeLink(value) : null;
              const isCountry = ["country", "headquarters_country"].includes(
                key,
              );
              const display =
                key === "served_countries" && Array.isArray(value)
                  ? value.map((v) => countryName(v, language)).join("، ")
                  : isCountry
                    ? countryName(value, language)
                    : key === "opportunity_type"
                      ? opportunity(row, language)
                      : key === "last_contacted_at"
                        ? dateLabel(value, language)
                        : key === "application_kind" && value === "talent_pool"
                          ? ar
                            ? "قاعدة المواهب"
                            : "Talent pool"
                          : label(value, language);
              return (
                <div key={key}>
                  <dt>{titles[ar ? 0 : 1]}</dt>
                  <dd dir="auto">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                      >
                        {String(value)}
                      </a>
                    ) : [
                        "email",
                        "phone",
                        "linkedin_url",
                        "portfolio_url",
                        "website_url",
                        "registration_number",
                        "license_number",
                      ].includes(key) ? (
                      <bdi dir="ltr">{display}</bdi>
                    ) : (
                      display
                    )}
                  </dd>
                </div>
              );
            })}
        </dl>
        {!(row.cv_path ?? row.attachment_path) && (
          <p className="aw-muted">
            {ar
              ? "لا يوجد مرفق مسجل مع الطلب."
              : "No attachment was submitted with this request."}
          </p>
        )}
        {!!(row.cv_path ?? row.attachment_path) && (
          <div className="aw-actions">
            {can(identity, module, "attachments") ? (
              <button onClick={() => void attachment()}>
                {ar
                  ? "فتح المرفق — رابط خاص لمدة دقيقتين"
                  : "Open attachment — private 2 minute link"}
              </button>
            ) : (
              <p className="aw-muted">
                {ar
                  ? "يوجد مرفق؛ يلزم إذن الاطلاع على المرفقات."
                  : "An attachment exists; attachment permission is required."}
              </p>
            )}
          </div>
        )}
      </section>
      <section className="aw-card">
        <h2>{ar ? "المراجعة والإسناد" : "Review & assignment"}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="aw-filters">
            <label>
              {ar ? "الحالة" : "Status"}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={
                  !can(identity, module, "status") || busy || !!row.deleted_at
                }
              >
                <option value={row.status}>{statusLabel(row, language)}</option>
                {nextStatuses(row, module)
                  .filter((s) => s !== row.status)
                  .map((s) => (
                    <option value={s} key={s}>
                      {statusLabel({ ...row, status: s }, language)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {ar ? "الموظف المسؤول" : "Responsible employee"}
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={
                  !can(identity, module, "assign") || busy || assignees.isError
                }
              >
                <option value="">{ar ? "غير مسند" : "Unassigned"}</option>
                {owner && !assignees.data?.some((a) => a.id === owner) && (
                  <option value={owner}>{owner}</option>
                )}
                {assignees.data?.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {assignees.isError && (
            <Failure
              error={assignees.error}
              retry={() => void assignees.refetch()}
            />
          )}
          <label>
            {ar
              ? "ملاحظات داخلية — لا تظهر للمتقدم"
              : "Internal notes — not shown to the applicant"}
            <textarea
              value={notes}
              maxLength={10000}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!can(identity, module, "manage") || busy}
            />
          </label>
          {module === "partners" && (
            <fieldset disabled={!can(identity, module, "manage") || busy}>
              <legend>
                {ar ? "التأهيل والتعاقد" : "Qualification & contracting"}
              </legend>
              <div className="aw-detail-grid">
                {[
                  "completion_requirements",
                  "completion_channel",
                  "contract_reference",
                  "country_annex_reference",
                  "approval_notice_reference",
                ].map((key) => (
                  <label key={key}>
                    {fields[key][ar ? 0 : 1]}
                    <input
                      value={String(partner[key] ?? row[key] ?? "")}
                      maxLength={2000}
                      onChange={(e) =>
                        setPartner({ ...partner, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                {ar ? "التشغيل" : "Operations"}
                <select
                  value={String(
                    partner.operational_active ??
                      row.operational_active ??
                      false,
                  )}
                  onChange={(e) =>
                    setPartner({
                      ...partner,
                      operational_active: e.target.value === "true",
                    })
                  }
                >
                  <option value="false">{ar ? "غير مفعّل" : "Inactive"}</option>
                  <option value="true">
                    {ar ? "مفعّل — بعد الاعتماد" : "Active — after approval"}
                  </option>
                </select>
              </label>
              <p className="aw-muted">
                {ar
                  ? "الاعتماد يتطلب مرجع العقد وإشعار الاعتماد وملحق الدولة للشريك الدولي."
                  : "Approval requires contract, approval notice and the international country annex references."}
              </p>
            </fieldset>
          )}
          {error !== null && <Failure error={error} />}
          <p role="status">{saved}</p>
          <div className="aw-actions">
            <button
              className="aw-primary"
              type="submit"
              disabled={!dirty || busy}
            >
              {busy
                ? ar
                  ? "جارٍ الحفظ…"
                  : "Saving…"
                : ar
                  ? "حفظ التعديلات"
                  : "Save changes"}
            </button>
            {can(identity, module, "archive") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      ar
                        ? "تأكيد تغيير الأرشفة؟ ستُحفظ الحالة في سجل النشاط."
                        : "Change archive state? This is recorded in the activity log.",
                    )
                  )
                    void save(
                      row.deleted_at
                        ? { status: "under_review", deleted_at: null }
                        : {
                            status: "archived",
                            deleted_at: new Date().toISOString(),
                          },
                    );
                }}
              >
                {row.deleted_at
                  ? ar
                    ? "استعادة للمراجعة"
                    : "Restore for review"
                  : ar
                    ? "أرشفة الطلب"
                    : "Archive request"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    ar
                      ? "تحميل أحدث نسخة وتجاهل التعديلات؟"
                      : "Reload latest and discard changes?",
                  )
                )
                  void onReload();
              }}
            >
              {ar ? "تحميل أحدث نسخة" : "Reload latest"}
            </button>
          </div>
        </form>
      </section>
      <RecordFollowups module={module} recordId={row.id} />
      <section className="aw-card">
        <h2>
          {ar ? "سجل النشاط — آخر ٥٠ حدثًا" : "Activity — latest 50 events"}
        </h2>
        {events.isPending ? (
          <Loading />
        ) : events.isError ? (
          <Failure error={events.error} retry={() => void events.refetch()} />
        ) : events.data.length ? (
          <ol className="aw-timeline">
            {events.data.map((event) => (
              <li key={event.id}>
                <strong>{label(event.event, language)}</strong>
                <small>
                  {dateLabel(event.created_at, language)} ·{" "}
                  {event.actor_id === identity.id
                    ? identity.name
                    : (event.actor_id ??
                      (ar
                        ? "النظام / إرسال عام"
                        : "System / public submission"))}
                </small>
                {Object.entries(event.changes)
                  .filter(([key]) =>
                    ["status", "assigned_to", "notes_changed"].includes(key),
                  )
                  .map(([key, value]) => (
                    <small key={key}>
                      {key === "notes_changed"
                        ? ar
                          ? "تم تعديل الملاحظات؛ لا يُنسخ محتواها إلى السجل."
                          : "Notes changed; their content is not copied to the audit log."
                        : key === "status" && value && typeof value === "object"
                          ? `${label((value as { from: unknown }).from, language)} ← ${label((value as { to: unknown }).to, language)}`
                          : label("assigned", language)}
                    </small>
                  ))}
              </li>
            ))}
          </ol>
        ) : (
          <p className="aw-muted">
            {ar
              ? "لا توجد أحداث مسجلة منذ تفعيل سجل النشاط. لا يُعاد اختراع تاريخ للسجلات السابقة."
              : "No events recorded since activity tracking was enabled. Historical events are not invented."}
          </p>
        )}
      </section>
    </div>
  );
}
