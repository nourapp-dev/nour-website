"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { can, useWorkspace } from "./WorkspaceProvider";
import { dateLabel, label } from "./contracts";
import { Loading, Failure, Empty } from "./States";
export default function Dashboard() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  return (
    <>
      <header className="aw-heading">
        <div>
          <p className="aw-eyebrow">
            NOUR APP · {ar ? "مساحة العمل" : "WORKSPACE"}
          </p>
          <h1>{ar ? "متابعة اليوم" : "Today’s overview"}</h1>
          <p>
            {ar
              ? `مرحبًا ${identity.name}. الطلبات والمتابعة المتاحة لصلاحياتك.`
              : `Welcome, ${identity.name}. Requests and follow-ups available to your role.`}
          </p>
        </div>
        <Link className="aw-link" href="/admin/tasks">
          {ar ? "افتح مهامي" : "Open my tasks"}
        </Link>
      </header>
      <p className="aw-notice">
        {ar
          ? "حجز الويب مغلق. إدارة السجلات السابقة متاحة لأصحاب الصلاحية. التطبيق قريبًا."
          : "Web booking is closed. Authorized staff can manage previous records. The app is coming soon."}
      </p>
      <div className="aw-grid">
        <Metric
          module="applications"
          title={ar ? "طلبات انضمام جديدة" : "New join applications"}
          description={
            ar ? "طلبات نشطة بحالة جديد" : "Active applications with status New"
          }
          table="job_applications"
          status="new"
          href="/admin/applications?status=new"
        />
        <Metric
          module="partners"
          title={ar ? "شراكات جديدة" : "New partner applications"}
          description={
            ar
              ? "طلبات شراكة نشطة بحالة جديد"
              : "Active partner applications with status New"
          }
          table="partner_applications"
          status="new"
          href="/admin/partners?status=new"
        />
        <Metric
          module="applications"
          title={ar ? "انضمام مسند إليّ" : "Join applications assigned to me"}
          description={
            ar
              ? "طلبات الانضمام النشطة المسندة لحسابك"
              : "Active join applications assigned to your account"
          }
          table="job_applications"
          owner
          href="/admin/applications?owner=me"
        />
        <Metric
          module="partners"
          title={ar ? "شراكات مسندة إليّ" : "Partnerships assigned to me"}
          description={
            ar
              ? "طلبات الشراكة النشطة المسندة لحسابك"
              : "Active partner applications assigned to your account"
          }
          table="partner_applications"
          owner
          href="/admin/partners?owner=me"
        />
        <Metric
          module="applications"
          title={ar ? "انضمام قيد المراجعة" : "Join applications under review"}
          description={ar ? "الحالة: قيد المراجعة" : "Status: Under review"}
          table="job_applications"
          status="under_review"
          href="/admin/applications?status=under_review"
        />
        <Metric
          module="partners"
          title={
            ar ? "شراكات في المراجعة النهائية" : "Partnerships in final review"
          }
          description={
            ar ? "الحالة: المراجعة النهائية" : "Status: Final review"
          }
          table="partner_applications"
          status="final_review"
          href="/admin/partners?status=final_review"
        />
      </div>
      <div className="aw-grid" style={{ marginTop: 20 }}>
        <TaskSummary />
        <RecentActivity />
        {can(identity, "bookings") && (
          <Metric
            module="bookings"
            title={ar ? "سجلات الحجوزات السابقة" : "Historical booking records"}
            description={
              ar
                ? "سجلات محفوظة، مع بقاء استقبال حجز الويب مغلقًا. قد لا يكون مخطط الحجوزات مهيأ في قاعدة الاختبار."
                : "Stored records, while web booking stays closed. The test database may not have the booking schema."
            }
            table="bookings"
            href="/admin/bookings"
          />
        )}
      </div>
    </>
  );
}
function Metric({
  module,
  title,
  description,
  table,
  status,
  owner = false,
  href,
}: {
  module: string;
  title: string;
  description: string;
  table: string;
  status?: string;
  owner?: boolean;
  href: string;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const allowed = can(identity, module);
  const query = useQuery({
    queryKey: ["admin-workspace", "metric", module, table, status, owner],
    enabled: allowed,
    queryFn: async () => {
      let q = createClient("admin")
        .from(table)
        .select("id", { head: true, count: "exact" });
      if (module !== "bookings") q = q.is("deleted_at", null);
      if (status) q = q.eq("status", status);
      if (owner) q = q.eq("assigned_to", identity.id);
      const r = await q;
      if (r.error) throw r.error;
      return r.count ?? 0;
    },
    retry: false,
  });
  return (
    <section className="aw-card">
      <h2>{title}</h2>
      <p className="aw-muted">{description}</p>
      {!allowed ? (
        <p>{ar ? "غير متاح لصلاحياتك" : "Not permitted for your role"}</p>
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <>
          <p className="aw-muted">
            {ar
              ? "العدد غير متاح — لم يُعتبر صفرًا."
              : "Count unavailable — not treated as zero."}
          </p>
          <Failure error={query.error} retry={() => void query.refetch()} />
        </>
      ) : (
        <>
          <strong className="aw-metric">
            {new Intl.NumberFormat(language).format(query.data)}
          </strong>
          <Link className="aw-link" href={href}>
            {ar ? "عرض السجلات المطابقة" : "View matching records"}
          </Link>
        </>
      )}
    </section>
  );
}
function TaskSummary() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const query = useQuery({
    queryKey: ["admin-workspace", "task-summary"],
    queryFn: async () => {
      const client = createClient("admin");
      const [open, overdue] = await Promise.all([
        client
          .from("admin_followups")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", identity.id)
          .eq("status", "open"),
        client
          .from("admin_followups")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", identity.id)
          .eq("status", "open")
          .lt("due_at", new Date().toISOString()),
      ]);
      if (open.error || overdue.error) throw open.error ?? overdue.error;
      return { open: open.count ?? 0, overdue: overdue.count ?? 0 };
    },
    retry: false,
  });
  return (
    <section className="aw-card">
      <h2>{ar ? "متابعاتي المفتوحة" : "My open follow-ups"}</h2>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <strong className="aw-metric">
            {new Intl.NumberFormat(language).format(query.data.open)}
          </strong>
          <Link className="aw-link" href="/admin/tasks?scope=open">
            {ar ? "عرض المفتوحة" : "View open tasks"}
          </Link>
          <p>
            <Link className="aw-link" href="/admin/tasks?scope=overdue">
              {ar ? "ذات موعد تجاوز الاستحقاق" : "Past due date"}:{" "}
              {new Intl.NumberFormat(language).format(query.data.overdue)}
            </Link>
          </p>
          <p className="aw-muted">
            {ar
              ? "التأخر محسوب فقط لمتابعة مفتوحة بموعد مسجل سابق للحظة الحالية."
              : "Overdue means an open task with a recorded due date before the current time."}
          </p>
        </>
      )}
    </section>
  );
}
function RecentActivity() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const query = useQuery({
    queryKey: ["admin-workspace", "recent-activity"],
    queryFn: async () => {
      const r = await createClient("admin")
        .from("admin_intake_events")
        .select("id,event,module,record_id,created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (r.error) throw r.error;
      return r.data as {
        id: string;
        event: string;
        module: string;
        record_id: string;
        created_at: string;
      }[];
    },
    retry: false,
  });
  return (
    <section className="aw-card">
      <h2>{ar ? "آخر نشاط مسموح" : "Recent permitted activity"}</h2>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.length ? (
        <Empty />
      ) : (
        <ul className="aw-timeline">
          {query.data.map((item) => (
            <li key={item.id}>
              <Link
                className="aw-link"
                href={`/admin/${item.module}/${item.record_id}`}
              >
                {label(item.event, language)}
              </Link>
              <small>{dateLabel(item.created_at, language)}</small>
            </li>
          ))}
        </ul>
      )}
      <Link className="aw-link" href="/admin/activity">
        {ar ? "سجل النشاط" : "Activity log"}
      </Link>
    </section>
  );
}
