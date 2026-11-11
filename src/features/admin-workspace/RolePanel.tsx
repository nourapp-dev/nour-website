"use client";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
import { useWorkspace } from "./WorkspaceProvider";
import { Failure, Loading } from "./States";
import { useUnsaved } from "./useUnsaved";
type Role = {
    id: string;
    key: string;
    name_ar: string;
    name_en: string;
    permission_keys: string[];
};
export default function RolePanel() {
    const { language } = useLanguage();
    const ar = language === "ar";
    const identity = useWorkspace();
    const cache = useQueryClient();
    const [selected, setSelected] = useState<Role | null>(null);
    const [key, setKey] = useState("");
    const [arabic, setArabic] = useState("");
    const [english, setEnglish] = useState("");
    const [permissions, setPermissions] = useState<string[]>([]);
    const [dirty, setDirty] = useState(false);
    const lock = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [saved, setSaved] = useState(false);
    useUnsaved(dirty, ar
        ? "لديك تعديلات صلاحيات غير محفوظة. هل تريد المغادرة؟"
        : "You have unsaved role permissions. Leave?");
    const query = useQuery({
        queryKey: ["admin-workspace", "roles"],
        enabled: identity.superAdmin,
        queryFn: async () => {
            const r = await createClient("admin").rpc("workspace_roles");
            if (r.error)
                throw r.error;
            return r.data as {
                roles: Role[];
                permissions: {
                    key: string;
                    name_ar: string;
                    name_en: string;
                }[];
            };
        },
        retry: false,
    });
    if (!identity.superAdmin)
        return null;
    function choose(role: Role | null) {
        if (dirty && !window.confirm(ar ? "تجاهل التعديلات؟" : "Discard changes?"))
            return;
        setSelected(role);
        setKey(role?.key ?? "");
        setArabic(role?.name_ar ?? "");
        setEnglish(role?.name_en ?? "");
        setPermissions(role?.permission_keys ?? []);
        setDirty(false);
        setSaved(false);
    }
    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setError(null);
        try {
            const r = await createClient("admin").rpc("workspace_save_role", {
                target_role: selected?.id ?? null,
                role_key: key,
                name_ar: arabic,
                name_en: english,
                permission_keys: permissions,
            });
            if (r.error)
                throw r.error;
            setSelected({
                id: String(r.data),
                key,
                name_ar: arabic,
                name_en: english,
                permission_keys: permissions,
            });
            setDirty(false);
            setSaved(true);
            await Promise.all([cache.invalidateQueries({ queryKey: ["admin-workspace", "roles"] }), cache.invalidateQueries({ queryKey: ["employee-invitations"] }), cache.invalidateQueries({ queryKey: ["admin-roles"] })]);
        }
        catch (error) {
            setError(error);
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return (<section className="aw-card">
      <details open>
        <summary>
          <strong>
            {ar
            ? "الأدوار والصلاحيات — المدير الأعلى"
            : "Roles & permissions — super administrator"}
          </strong>
        </summary>
        <p className="aw-muted">
          {ar
            ? "تعديل تعريف الدور لا يغيّر إسناد مستخدم. لا يمكن تعديل دور المدير الأعلى أو دورك الحالي من هنا."
            : "Editing a role does not change user assignments. Your current role and the super-admin role are protected."}
        </p>
        {query.isPending ? (<Loading />) : query.isError ? (<Failure error={query.error} retry={() => void query.refetch()}/>) : (<>
            <label>
              {ar ? "الدور" : "Role"}
              <select value={selected?.id ?? ""} onChange={(e) => choose(query.data.roles.find((r) => r.id === e.target.value) ??
                null)}>
                <option value="">
                  {ar ? "إنشاء دور جديد" : "Create role"}
                </option>
                {query.data.roles
                .filter((r) => r.key !== "super_admin")
                .map((role) => (<option key={role.id} value={role.id}>
                      {ar ? role.name_ar : role.name_en}
                    </option>))}
              </select>
            </label>
            <form onSubmit={save}>
              <div className="aw-filters">
                <label>
                  {ar ? "معرّف الدور" : "Role key"}
                  <input required pattern="[a-z][a-z0-9_]{2,49}" dir="ltr" disabled={!!selected} value={key} onChange={(e) => {
                setKey(e.target.value);
                setDirty(true);
            }}/>
                </label>
                <label>
                  {ar ? "الاسم بالعربية" : "Arabic name"}
                  <input required maxLength={100} value={arabic} onChange={(e) => {
                setArabic(e.target.value);
                setDirty(true);
            }}/>
                </label>
                <label>
                  {ar ? "الاسم بالإنجليزية" : "English name"}
                  <input required maxLength={100} value={english} onChange={(e) => {
                setEnglish(e.target.value);
                setDirty(true);
            }}/>
                </label>
              </div>
              {Object.entries(query.data.permissions.reduce<Record<string, typeof query.data.permissions>>((groups, permission) => {
                const moduleKey = permission.key.split(".")[0];
                (groups[moduleKey] ??= []).push(permission);
                return groups;
            }, {})).map(([moduleKey, items]) => <fieldset key={moduleKey} style={{ marginBlock: 18, padding: 18, border: "1px solid var(--aw-border, #cbd7e4)", borderRadius: 12 }}>
                <legend>{ar ? ({ media: "الوسائط والفيديوهات", countries: "الدول", programs: "البرامج", dashboard: "لوحة التحكم", settings: "الإعدادات", feature_flags: "الميزات", users: "الموظفون", roles: "الأدوار", audit_logs: "سجل التدقيق", analytics: "التحليلات", subscribers: "المشتركون", hotels: "الفنادق", transports: "النقل", visas: "التأشيرات", applications: "طلبات الانضمام", partners: "الشراكات", legal: "المحتوى القانوني", articles: "المقالات", bookings: "الحجوزات", website: "واجهة الموقع" } as Record<string, string>)[moduleKey] ?? moduleKey : moduleKey.replaceAll("_", " ")}</legend>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => { setPermissions(current => [...new Set([...current, ...items.map(p => p.key)])]); setDirty(true); }}>{ar ? "تحديد القسم" : "Select section"}</button>
                  <button type="button" onClick={() => { setPermissions(current => [...current.filter(key => !items.some(p => p.key === key)), ...items.filter(p => /\.(read|view)$/.test(p.key)).map(p => p.key)]); setDirty(true); }}>{ar ? "عرض فقط" : "View only"}</button>
                  <button type="button" onClick={() => { setPermissions(current => current.filter(key => !items.some(p => p.key === key))); setDirty(true); }}>{ar ? "إلغاء تحديد القسم" : "Clear section"}</button>
                </div>
                <div className="aw-permission-grid">{items.map(permission => <label key={permission.key}>
                  <input type="checkbox" checked={permissions.includes(permission.key)} onChange={e => { setPermissions(current => e.target.checked ? [...current, permission.key] : current.filter(key => key !== permission.key)); setDirty(true); }}/>
                  <span>{ar ? permission.name_ar : permission.name_en}</span>
                </label>)}</div>
              </fieldset>)}
              {error !== null && <Failure error={error}/>}
              <p role="status">
                {saved
                ? ar
                    ? "حُفظ الدور والصلاحيات في سجل التدقيق."
                    : "Role and permissions saved in the audit log."
                : ""}
              </p>
              <button className="aw-primary" disabled={busy || !dirty}>
                {ar ? "حفظ الدور" : "Save role"}
              </button>
            </form>
          </>)}
      </details>
    </section>);
}
