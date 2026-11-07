"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import {
  careerAreas,
  csvCell,
  countryName,
  dateLabel,
  opportunity,
  label,
  statusLabel,
  type IntakeModule,
  type IntakeRecord,
} from "./contracts";
import { emptyFilters, filtersFrom, listIntake } from "./data";
import { can, useWorkspace } from "./WorkspaceProvider";
import { Empty, Failure, Loading } from "./States";
import IntakeDetail from "./IntakeDetail";
import { confirmLeaving } from "./useUnsaved";
export default function IntakeList({ module }: { module: IntakeModule }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const cache = useQueryClient();
  const searchKey = ["admin-workspace", module, "search-draft"];
  const filters = filtersFrom(new URLSearchParams(params.toString()));
  const [search, setSearchValue] = useState(() =>
    params.get("resume") === "1"
      ? (cache.getQueryData<string>(searchKey) ?? "")
      : "",
  );
  const [term, setTerm] = useState(search);
  function setSearch(value: string) {
    setSearchValue(value);
    cache.setQueryData(searchKey, value);
  }
  const returnParams = new URLSearchParams(params.toString());
  returnParams.set("resume", "1");
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [exportError, setExportError] = useState<unknown>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["admin-workspace", module, "list", filters, term],
    queryFn: ({ signal }) =>
      listIntake(module, { ...filters, search: term }, signal),
    retry: false,
  });
  const total = query.data?.total ?? 0;
  const page = Number(filters.page);
  const pageCount = Math.max(1, Math.ceil(total / 20));
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    router.replace(`${path}?${next.toString()}`, { scroll: false });
  }
  function close() {
    if (
      !confirmLeaving(
        ar ? "تجاهل التعديلات غير المحفوظة؟" : "Discard unsaved changes?",
      )
    )
      return;
    dialog.current?.close();
    setSelected(null);
    opener.current?.focus();
  }
  function preview(
    row: IntakeRecord,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    opener.current = event.currentTarget;
    setSelected(row.id);
    dialog.current?.showModal();
  }
  async function exportPage() {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const { data, error } = await createClient("admin").rpc(
        "workspace_export",
        { module, filters: { ...filters, search: term } },
      );
      if (error) throw error;
      const rows = (data as { items: IntakeRecord[] }).items;
      const csv = [
        ["Reference", "Name", "Country", "Status", "Created"],
        ...rows.map((row) => [
          row.id,
          row.full_name ?? row.company_name,
          countryName(row.country, language),
          statusLabel(row, language),
          dateLabel(row.created_at, language),
        ]),
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");
      const url = URL.createObjectURL(
        new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${module}-page-${page}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error);
    } finally {
      setExporting(false);
    }
  }
  return (
    <div>
      <header className="aw-heading">
        <div>
          <p className="aw-eyebrow">
            {ar ? "الطلبات والعلاقات" : "REQUESTS & RELATIONSHIPS"}
          </p>
          <h1>
            {module === "applications"
              ? ar
                ? "طلبات الانضمام"
                : "Join applications"
              : ar
                ? "طلبات الشراكة"
                : "Partner applications"}
          </h1>
          <p>
            {module === "applications"
              ? ar
                ? "راجع قاعدة المواهب وتفضيلات المتقدمين، ثم نظّم المراجعة والمتابعة."
                : "Review the talent pool and applicant preferences, then organize review and follow-up."
              : ar
                ? "تابع التأهيل والاستكمال والتعاقد والاعتماد من سجل الجهة الأصلي."
                : "Follow qualification, completion, contracting and approval in the original organization record."}
          </p>
        </div>
        <button
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          {ar ? "تحديث" : "Refresh"}
        </button>
      </header>
      <section className="aw-card">
        <div className="aw-filters">
          <label>
            {ar
              ? "بحث خاص بالطلبات — لا يُحفظ في الرابط"
              : "Request search — kept out of the URL"}
            <input
              type="search"
              value={search}
              maxLength={200}
              onChange={(e) => {
                setSearch(e.target.value);
                if (filters.page !== "1") filter("page", "1");
              }}
              placeholder={
                ar ? "اسم أو بريد أو مرجع" : "Name, email or reference"
              }
            />
          </label>
          <label>
            {ar ? "الحالة" : "Status"}
            <select
              value={filters.status}
              onChange={(e) => filter("status", e.target.value)}
            >
              <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
              {(module === "applications"
                ? ["new", "under_review", "contacted", "approved", "rejected"]
                : [
                    "new",
                    "under_review",
                    "contacted",
                    "completion_required",
                    "qualifying",
                    "final_review",
                    "contracting",
                    "approved",
                    "rejected",
                    "withdrawn",
                  ]
              ).map((status) => (
                <option key={status} value={status}>
                  {statusLabel(
                    {
                      status,
                      application_kind:
                        module === "applications" ? "talent_pool" : null,
                      partner_type: module === "partners" ? "other" : undefined,
                    },
                    language,
                  )}
                  {module === "applications" &&
                  ["approved", "rejected"].includes(status)
                    ? ` / ${label(status, language)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          {module === "applications" && (
            <>
              <label>
                {ar ? "المجال المهني" : "Career area"}
                <select
                  value={filters.area}
                  onChange={(e) => filter("area", e.target.value)}
                >
                  <option value="">{ar ? "كل المجالات" : "All areas"}</option>
                  {careerAreas.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area[language]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {ar ? "نوع الفرصة" : "Opportunity"}
                <select
                  value={filters.opportunity}
                  onChange={(e) => filter("opportunity", e.target.value)}
                >
                  <option value="">{ar ? "الكل" : "All"}</option>
                  {[
                    "full_time",
                    "part_time",
                    "internship",
                    "freelance",
                    "remote",
                    "other",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {label(value, language)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label>
            {ar ? "من تاريخ — الرياض" : "From date — Riyadh"}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => filter("from", e.target.value)}
            />
          </label>
          <label>
            {ar ? "إلى تاريخ — الرياض" : "To date — Riyadh"}
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => filter("to", e.target.value)}
            />
          </label>
          <label>
            {ar ? "الإسناد" : "Assignment"}
            <select
              value={filters.owner}
              onChange={(e) => filter("owner", e.target.value)}
            >
              <option value="">{ar ? "الكل" : "All"}</option>
              <option value="me">{ar ? "مسندة إليّ" : "Assigned to me"}</option>
            </select>
          </label>
          <label>
            {ar ? "الأرشيف" : "Archive"}
            <select
              value={filters.archived}
              onChange={(e) => filter("archived", e.target.value)}
            >
              <option value="false">{ar ? "النشطة" : "Active"}</option>
              <option value="true">{ar ? "المؤرشفة" : "Archived"}</option>
            </select>
          </label>
          <label>
            {ar ? "الترتيب" : "Sort"}
            <select
              value={`${filters.sort}:${filters.direction}`}
              onChange={(e) => {
                const [sort, direction] = e.target.value.split(":");
                const p = new URLSearchParams(params.toString());
                p.set("sort", sort);
                p.set("direction", direction);
                p.set("page", "1");
                router.replace(`${path}?${p}`);
              }}
            >
              <option value="created_at:desc">
                {ar ? "الأحدث أولًا" : "Newest first"}
              </option>
              <option value="created_at:asc">
                {ar ? "الأقدم أولًا" : "Oldest first"}
              </option>
              <option value="name:asc">
                {ar ? "الاسم تصاعديًا" : "Name A–Z"}
              </option>
            </select>
          </label>
          <button
            onClick={() => {
              setSearch("");
              router.replace(path);
            }}
          >
            {ar ? "مسح الفلاتر" : "Clear filters"}
          </button>
        </div>
        <div className="aw-actions">
          <p className="aw-muted">
            {query.isSuccess
              ? `${new Intl.NumberFormat(language).format(total)} ${ar ? "نتيجة مطابقة — ٢٠ سجلًا لكل صفحة" : "matching results — 20 per page"}`
              : ar
                ? "جارٍ التحقق من العدد"
                : "Checking result count"}
          </p>
          {can(identity, module, "export") && (
            <button
              disabled={exporting || !query.data?.items.length}
              onClick={() => void exportPage()}
            >
              {ar
                ? "تصدير الصفحة المصفّاة (حتى ٥٠)"
                : "Export filtered page (up to 20)"}
            </button>
          )}
        </div>
        {exportError !== null && <Failure error={exportError} />}
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <Empty
            filtered={
              Object.keys(emptyFilters).some(
                (key) =>
                  filters[key as keyof typeof filters] !==
                  emptyFilters[key as keyof typeof emptyFilters],
              ) || !!term
            }
          />
        ) : (
          <div className="aw-table-wrap">
            <table>
              <caption className="sr-only">
                {ar ? "سجلات الطلبات" : "Application records"}
              </caption>
              <thead>
                <tr>
                  <th>{ar ? "الاسم والمرجع" : "Name & reference"}</th>
                  <th>{ar ? "الدولة" : "Country"}</th>
                  <th>
                    {module === "applications"
                      ? ar
                        ? "الفرصة ونمط العمل"
                        : "Opportunity & arrangement"
                      : ar
                        ? "المسار"
                        : "Track"}
                  </th>
                  <th>{ar ? "الحالة" : "Status"}</th>
                  <th>{ar ? "تاريخ التقديم" : "Submitted"}</th>
                  <th>{ar ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        className="aw-link"
                        href={`${path}/${row.id}?returnTo=${encodeURIComponent(`${path}?${returnParams}`)}`}
                      >
                        {String(row.full_name ?? row.company_name)}
                      </Link>
                      <small>
                        <bdi className="aw-reference">{row.id}</bdi>
                      </small>
                    </td>
                    <td>{countryName(row.country, language)}</td>
                    <td>
                      {module === "applications" ? (
                        <>
                          {opportunity(row, language)}
                          <small>{label(row.work_mode, language)}</small>
                        </>
                      ) : (
                        label(
                          row.partnership_track ?? row.partner_type,
                          language,
                        )
                      )}
                    </td>
                    <td>
                      <span className="aw-badge" data-status={row.status}>
                        {statusLabel(row, language)}
                      </span>
                    </td>
                    <td>{dateLabel(row.created_at, language)}</td>
                    <td>
                      <button onClick={(event) => preview(row, event)}>
                        {ar ? "معاينة" : "Preview"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="aw-pagination">
          <span>
            {ar ? "الصفحة" : "Page"} {page} / {pageCount}
          </span>
          <div className="aw-actions">
            <button
              disabled={page <= 1 || query.isFetching}
              onClick={() => filter("page", String(page - 1))}
            >
              {ar ? "السابق" : "Previous"}
            </button>
            <button
              disabled={page >= pageCount || query.isFetching}
              onClick={() => filter("page", String(page + 1))}
            >
              {ar ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="aw-dialog"
        dir={ar ? "rtl" : "ltr"}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="aw-actions">
          <h2>{ar ? "معاينة الطلب" : "Request preview"}</h2>
          <button onClick={close}>{ar ? "إغلاق" : "Close"}</button>
        </div>
        {selected && (
          <IntakeDetail key={selected} module={module} id={selected} preview />
        )}
      </dialog>
    </div>
  );
}
