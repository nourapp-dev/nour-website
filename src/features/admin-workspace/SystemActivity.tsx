"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
import { useWorkspace } from "./WorkspaceProvider";
import { dateLabel, label } from "./contracts";
import { Empty, Failure, Loading } from "./States";
export default function SystemActivity() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const [page, setPage] = useState(1);
  const [source, setSource] = useState("admin");
  const query = useQuery({
    queryKey: ["admin-workspace", "system-activity", source, page],
    enabled: identity.superAdmin,
    queryFn: async () => {
      const admin = source === "admin";
      const r = await createClient("admin")
        .from(admin ? "admin_audit_logs" : "audit_logs")
        .select(
          admin
            ? "id,actor_user_id,action,entity_type,entity_id,created_at"
            : "id,actor_id,action,entity_type,entity_id,created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);
      if (r.error) throw r.error;
      return {
        items: r.data as unknown as {
          id: string;
          actor_user_id?: string;
          actor_id?: string;
          action: string;
          entity_type: string;
          entity_id: string;
          created_at: string;
        }[],
        total: r.count ?? 0,
      };
    },
    retry: false,
  });
  if (!identity.superAdmin) return null;
  return (
    <section className="aw-card">
      <h2>
        {ar
          ? "سجل النظام والمحتوى — المدير الأعلى"
          : "System & content activity — super administrator"}
      </h2>
      <p className="aw-muted">
        {ar
          ? "قراءة سجل التدقيق الموجود دون نسخ كلمات المرور أو محتوى الملفات أو الإعدادات إلى الواجهة."
          : "Read the existing audit log without copying passwords, file contents or setting values into this screen."}
      </p>
      <label>
        {ar ? "المصدر" : "Source"}
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
        >
          <option value="admin">
            {ar ? "المستخدمون والأدوار" : "Users & roles"}
          </option>
          <option value="catalogue">
            {ar
              ? "سجل المحتوى والبرامج الموجود"
              : "Existing catalogue & program log"}
          </option>
        </select>
      </label>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <Empty />
      ) : (
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
              {query.data.items.map((event) => {
                const route =
                  event.entity_type === "program"
                    ? `/admin/programs/${event.entity_id}`
                    : ["admin_user", "roles"].includes(event.entity_type)
                      ? "/admin/users"
                      : event.entity_type === "media"
                        ? `/admin/media/${event.entity_id}`
                        : null;
                return (
                  <tr key={event.id}>
                    <td>{label(event.action, language)}</td>
                    <td>
                      {route ? (
                        <Link className="aw-link aw-reference" href={route}>
                          <bdi>{event.entity_id}</bdi>
                        </Link>
                      ) : (
                        <bdi className="aw-reference">
                          {event.entity_type} · {event.entity_id}
                        </bdi>
                      )}
                    </td>
                    <td>
                      <bdi className="aw-reference">
                        {event.actor_user_id ??
                          event.actor_id ??
                          (ar ? "النظام" : "System")}
                      </bdi>
                    </td>
                    <td>{dateLabel(event.created_at, language)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  );
}
