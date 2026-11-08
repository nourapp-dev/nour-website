"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { can, useWorkspace } from "./WorkspaceProvider";
import {
  dateLabel,
  label,
  type IntakeModule,
  type IntakeRecord,
} from "./contracts";
import { listIntake } from "./data";
import { Loading, Failure, Empty } from "./States";
import SystemActivity from "./SystemActivity";
export function NotificationsPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [unread, setUnread] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["admin-workspace", "notifications", page, unread],
    queryFn: async () => {
      let q = createClient("admin")
        .from("admin_notifications")
        .select("id,module,record_id,event,read_at,created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);
      if (unread) q = q.is("read_at", null);
      const r = await q;
      if (r.error) throw r.error;
      return {
        items: r.data as {
          id: string;
          module: IntakeModule;
          record_id: string;
          event: string;
          read_at: string | null;
          created_at: string;
        }[],
        total: r.count ?? 0,
      };
    },
    retry: false,
  });
  async function read(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await createClient("admin").rpc("workspace_read_notification", {
      notification_id: id,
    });
    if (r.error) setError(r.error);
    else {
      await cache.invalidateQueries({
        queryKey: ["admin-workspace", "notifications"],
      });
      await cache.invalidateQueries({
        queryKey: ["admin-workspace", "unread"],
      });
    }
    setBusy(false);
  }
  return (
    <>
      <header className="aw-heading">
        <div>
          <h1>{ar ? "الإشعارات الداخلية" : "Internal notifications"}</h1>
          <p>
            {ar
              ? "الإسناد وتغيّر حالة السجلات المسندة إليك. لا تُرسل رسائل خارج اللوحة."
              : "Assignments and status changes for records assigned to you. No external messages are sent."}
          </p>
        </div>
        <button
          onClick={() => {
            void query.refetch();
            void cache.invalidateQueries({
              queryKey: ["admin-workspace", "unread"],
            });
          }}
        >
          {ar ? "تحديث" : "Refresh"}
        </button>
      </header>
      <section className="aw-card">
        <label>
          {ar ? "العرض" : "Show"}
          <select
            value={unread ? "unread" : "all"}
            onChange={(e) => {
              setUnread(e.target.value === "unread");
              setPage(1);
            }}
          >
            <option value="all">{ar ? "الكل" : "All"}</option>
            <option value="unread">{ar ? "غير المقروءة" : "Unread"}</option>
          </select>
        </label>
        {error !== null && <Failure error={error} />}{" "}
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => void query.refetch()} />
        ) : query.data.items.length ? (
          <ul className="aw-timeline">
            {query.data.items.map((item) => (
              <li key={item.id}>
                <span className="aw-badge">
                  {item.read_at
                    ? ar
                      ? "مقروء"
                      : "Read"
                    : ar
                      ? "غير مقروء"
                      : "Unread"}
                </span>
                <h2>{label(item.event, language)}</h2>
                <small>{dateLabel(item.created_at, language)}</small>
                <Link
                  className="aw-link"
                  href={`/admin/${item.module}/${item.record_id}`}
                >
                  {ar ? "فتح الطلب" : "Open request"}
                </Link>
                {!item.read_at && (
                  <button disabled={busy} onClick={() => void read(item.id)}>
                    {ar ? "وضع علامة مقروء" : "Mark read"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
        <div className="aw-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {ar ? "السابق" : "Previous"}
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil((query.data?.total ?? 0) / 20))}
          </span>
          <button
            disabled={page * 20 >= (query.data?.total ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            {ar ? "التالي" : "Next"}
          </button>
        </div>
      </section>
    </>
  );
}
export function ActivityPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [page, setPage] = useState(1);
  const [module, setModule] = useState("");
  const query = useQuery({
    queryKey: ["admin-workspace", "activity", page, module],
    queryFn: async () => {
      let q = createClient("admin")
        .from("admin_intake_events")
        .select("id,module,record_id,event,actor_id,changes,created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);
      if (module) q = q.eq("module", module);
      const r = await q;
      if (r.error) throw r.error;
      return {
        items: r.data as {
          id: string;
          module: string;
          record_id: string;
          event: string;
          actor_id: string | null;
          created_at: string;
        }[],
        total: r.count ?? 0,
      };
    },
    retry: false,
  });
  return (
    <>
      <header className="aw-heading">
        <div>
          <h1>{ar ? "سجل نشاط الطلبات" : "Request activity log"}</h1>
          <p>
            {ar
              ? "أحداث موثقة منذ تفعيل السجل، وفق صلاحية عرض كل قسم."
              : "Recorded events since activity tracking was enabled, scoped to your section permissions."}
          </p>
        </div>
        <button onClick={() => void query.refetch()}>
          {ar ? "تحديث" : "Refresh"}
        </button>
      </header>
      <section className="aw-card">
        <label>
          {ar ? "القسم" : "Section"}
          <select
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {ar ? "الأقسام المسموحة" : "Permitted sections"}
            </option>
            <option value="applications">
              {ar ? "الانضمام" : "Join applications"}
            </option>
            <option value="partners">{ar ? "الشراكات" : "Partners"}</option>
          </select>
        </label>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => void query.refetch()} />
        ) : query.data.items.length ? (
          <div className="aw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{ar ? "الحدث" : "Event"}</th>
                  <th>{ar ? "السجل" : "Record"}</th>
                  <th>{ar ? "الفاعل" : "Actor"}</th>
                  <th>{ar ? "التوقيت" : "Time"}</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((event) => (
                  <tr key={event.id}>
                    <td>{label(event.event, language)}</td>
                    <td>
                      <Link
                        href={`/admin/${event.module}/${event.record_id}`}
                        className="aw-reference aw-link"
                        dir="ltr"
                      >
                        {event.record_id}
                      </Link>
                    </td>
                    <td>
                      <bdi className="aw-reference">
                        {event.actor_id ??
                          (ar
                            ? "إرسال عام / النظام"
                            : "Public submission / system")}
                      </bdi>
                    </td>
                    <td>{dateLabel(event.created_at, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <div className="aw-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {ar ? "السابق" : "Previous"}
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil((query.data?.total ?? 0) / 20))}
          </span>
          <button
            disabled={page * 20 >= (query.data?.total ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            {ar ? "التالي" : "Next"}
          </button>
        </div>
      </section>
      <SystemActivity />
    </>
  );
}
export function SearchPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  return (
    <>
      <header className="aw-heading">
        <div>
          <h1>{ar ? "البحث في الطلبات" : "Request search"}</h1>
          <p>
            {ar
              ? "بحث محدود بالانضمام والشراكات المصرح لك بعرضها. يعرض حتى ١٠ نتائج لكل قسم، ولا يحفظ كلمات البحث في الرابط."
              : "Search is limited to permitted join and partner applications. Up to 10 results per section; search terms stay out of the URL."}
          </p>
        </div>
      </header>
      <section className="aw-card">
        <label>
          {ar ? "الاسم أو البريد أو المرجع" : "Name, email or reference"}
          <input
            type="search"
            value={search}
            maxLength={200}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </section>
      {term.length >= 2 &&
        (["applications", "partners"] as IntakeModule[])
          .filter((module) => can(identity, module))
          .map((module) => (
            <SearchGroup key={module} module={module} term={term} />
          ))}
      {term.length < 2 && (
        <p className="aw-state">
          {ar ? "اكتب حرفين على الأقل." : "Enter at least two characters."}
        </p>
      )}
    </>
  );
}
function SearchGroup({ module, term }: { module: IntakeModule; term: string }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const query = useQuery({
    queryKey: ["admin-workspace", "search", module, term],
    queryFn: ({ signal }) =>
      listIntake(
        module,
        { search: term, page: "1", ...{ size: "10" } },
        signal,
      ),
    retry: false,
  });
  return (
    <section className="aw-card">
      <h2>
        {module === "applications"
          ? ar
            ? "طلبات الانضمام"
            : "Join applications"
          : ar
            ? "الشراكات"
            : "Partnerships"}
      </h2>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <Empty filtered />
      ) : (
        <ul className="aw-timeline">
          {query.data.items.slice(0, 10).map((row: IntakeRecord) => (
            <li key={row.id}>
              <Link className="aw-link" href={`/admin/${module}/${row.id}`}>
                {String(row.full_name ?? row.company_name)}
              </Link>
              <small>
                <bdi className="aw-reference">{row.id}</bdi>
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
