"use client";
import { useUnsaved } from "../admin-workspace/useUnsaved";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { ianaTimezones, publicationStates } from "./directory";
import { validCoordinates } from "../journeys/coordinates";
import CoordinatePicker from "../../components/maps/CoordinatePicker";

type Location = {
  id: string;
  country_id?: string;
  city_id?: string;
  name_ar: string;
  name_en: string;
  latitude: number | null;
  longitude: number | null;
  timezone?: string | null;
  publication_status: string | null;
  show_on_map?: boolean | null;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
  address_ar?: string;
  address_en?: string;
  map_url?: string;
  arrival_instructions_ar?: string;
  arrival_instructions_en?: string;
  program_id?: string | null;
  departure_id?: string | null;
};
const blank = {
  name_ar: "",
  name_en: "",
  country_id: "",
  city_id: "",
  latitude: "",
  longitude: "",
  timezone: "",
  publication_status: "draft",
  show_on_map: true,
  is_active: true,
  sort_order: 0,
  address_ar: "",
  address_en: "",
  map_url: "",
  arrival_instructions_ar: "",
  arrival_instructions_en: "",
  contact_details: "",
};
export default function LocationManager() {
  const client = useMemo(() => createClient("admin"), []),
    cache = useQueryClient(),
    params = useSearchParams();
  const { language } = useLanguage();
  const ar = language === "ar";
  const tr = (a: string, e: string) => (ar ? a : e);
  const [kind, setKind] = useState<"city" | "point">("city"),
    [selectedCity, setSelectedCity] = useState(""),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState<Location | null>(null),
    [form, setForm] = useState(blank),
    [baseline, setBaseline] = useState(JSON.stringify(blank)),
    [notice, setNotice] = useState("");
  const dirty = JSON.stringify(form) !== baseline;
  useUnsaved(
    dirty,
    tr("لديك تغييرات غير محفوظة. هل تريد تركها؟", "Discard unsaved changes?"),
  );
  const table = kind === "city" ? "departure_cities" : "program_meeting_points";
  const countries = useQuery({
    queryKey: ["admin", "location-countries"],
    queryFn: async () => {
      const r = await client
        .from("countries")
        .select("id,name_ar,name_en,timezone")
        .is("deleted_at", null)
        .order("sort_order");
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const cities = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: async () => {
      const r = await client
        .from("departure_cities")
        .select("*")
        .order("sort_order");
      if (r.error) throw r.error;
      return r.data as Location[];
    },
  });
  const points = useQuery({
    queryKey: ["admin", "meeting-points"],
    queryFn: async () => {
      const r = await client
        .from("program_meeting_points")
        .select("*")
        .order("sort_order");
      if (r.error) throw r.error;
      return r.data as Location[];
    },
  });
  const permissions = useQuery({
    queryKey: ["admin", "location-permissions"],
    queryFn: async () => {
      const keys = [
        "countries.create",
        "countries.update",
        "countries.publish",
        "programs.update",
      ];
      const result = await Promise.all(
        keys.map(async (key) => {
          const r = await client.rpc("current_user_has_permission", {
            permission_code: key,
          });
          if (r.error) throw r.error;
          return [key, r.data === true] as const;
        }),
      );
      return Object.fromEntries(result);
    },
  });
  const canEdit = Boolean(
    permissions.data?.[editing ? "countries.update" : "countries.create"] ||
      (kind === "point" && permissions.data?.["programs.update"]),
  );
  const canOperate = Boolean(
    permissions.data?.["countries.update"] ||
      permissions.data?.["programs.update"],
  );
  const canPublish = Boolean(permissions.data?.["countries.publish"]);
  function discard() {
    return (
      !dirty ||
      window.confirm(
        tr(
          "لديك تغييرات غير محفوظة. هل تريد تركها؟",
          "Discard unsaved changes?",
        ),
      )
    );
  }
  function reset() {
    setEditing(null);
    setForm(blank);
    setBaseline(JSON.stringify(blank));
    setNotice("");
  }
  async function edit(row: Location) {
    if (!discard()) return;
    setNotice("");
    let contact = "";
    if (kind === "point") {
      const r = await client
        .from("meeting_point_operations")
        .select("contact_details")
        .eq("point_id", row.id)
        .maybeSingle();
      if (r.error) {
        setNotice(
          tr(
            "تعذر تحميل البيانات التشغيلية الخاصة. لم يُفتح التعديل لمنع استبدالها.",
            "Private operational data could not be loaded. Editing was not opened.",
          ),
        );
        return;
      }
      contact = r.data?.contact_details ?? "";
    }
    const next = {
      ...blank,
      ...row,
      country_id: row.country_id ?? "",
      city_id: row.city_id ?? "",
      latitude: row.latitude === null ? "" : String(row.latitude),
      longitude: row.longitude === null ? "" : String(row.longitude),
      timezone: row.timezone ?? "",
      publication_status: row.publication_status ?? "",
      show_on_map: row.show_on_map ?? true,
      contact_details: contact,
      address_ar: row.address_ar ?? "",
      address_en: row.address_en ?? "",
      map_url: row.map_url ?? "",
      arrival_instructions_ar: row.arrival_instructions_ar ?? "",
      arrival_instructions_en: row.arrival_instructions_en ?? "",
    };
    setEditing(row);
    setForm(next);
    setBaseline(JSON.stringify(next));
  }
  async function invalidate() {
    await cache.invalidateQueries({ queryKey: ["admin"] });
    await cache.invalidateQueries({ queryKey: ["public"] });
  }
  const save = useMutation({
    mutationFn: async () => {
      if (!canEdit) throw new Error("permission_denied");
      if (
        !form.name_ar.trim() ||
        !form.name_en.trim() ||
        !validCoordinates(form.latitude, form.longitude) ||
        !(kind === "city" ? form.country_id : form.city_id)
      )
        throw new Error(
          tr(
            "أكمل الأسماء والموقع والإحداثيات الصحيحة.",
            "Complete both names, parent location and valid coordinates.",
          ),
        );
      const shared = {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        is_active: form.is_active,
        sort_order: form.sort_order,
        publication_status: form.publication_status || null,
      };
      if (kind === "point") {
        const r = await client.rpc("catalogue_save_point", {
          input: {
            ...shared,
            id: editing?.id,
            city_id: form.city_id,
            address_ar: form.address_ar,
            address_en: form.address_en,
            map_url: form.map_url || null,
            arrival_instructions_ar: form.arrival_instructions_ar,
            arrival_instructions_en: form.arrival_instructions_en,
            ...(canOperate ? { contact_details: form.contact_details } : {}),
          },
          expected_at: editing?.updated_at ?? null,
        });
        if (r.error) throw r.error;
      } else {
        const payload = {
          ...shared,
          country_id: form.country_id,
          timezone: form.timezone || null,
          show_on_map: form.show_on_map,
          updated_at: new Date().toISOString(),
        };
        let r;
        if (editing)
          r = await client
            .from(table)
            .update(payload)
            .eq("id", editing.id)
            .eq("updated_at", editing.updated_at)
            .select("id");
        else r = await client.from(table).insert(payload).select("id");
        if (r.error) throw r.error;
        if (!r.data?.length)
          throw new Error(
            tr(
              "تعارض تعديل. أعد التحميل قبل الحفظ.",
              "Edit conflict. Reload before saving.",
            ),
          );
      }
    },
    onSuccess: async () => {
      reset();
      await invalidate();
      setNotice(tr("تم الحفظ.", "Saved."));
    },
  });
  const archive = useMutation({
    mutationFn: async (row: Location) => {
      const r = await client
        .from(table)
        .update({
          deleted_at: row.deleted_at ? null : new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("updated_at", row.updated_at)
        .select("id");
      if (r.error) throw r.error;
      if (!r.data?.length) throw new Error("edit_conflict");
    },
    onSuccess: invalidate,
  });
  const query = kind === "city" ? cities : points;
  const all = query.data ?? [];
  const rows = all.filter(
    (r) =>
      (!params.get("country") ||
        (kind === "city"
          ? r.country_id
          : cities.data?.find((c) => c.id === r.city_id)?.country_id) ===
          params.get("country")) &&
      (!selectedCity || kind === "city" || r.city_id === selectedCity) &&
      `${r.name_ar} ${r.name_en}`.toLowerCase().includes(search.toLowerCase()),
  );
  const field = (key: keyof typeof blank, label: string, type = "text") => (
    <label>
      {label}
      <input
        type={type}
        disabled={key === "contact_details" && !canOperate}
        step={
          type === "number" ? (key === "sort_order" ? 1 : "any") : undefined
        }
        value={String(form[key])}
        onChange={(e) =>
          setForm({
            ...form,
            [key]:
              type === "number" && key === "sort_order"
                ? Number(e.target.value)
                : e.target.value,
          })
        }
      />
    </label>
  );
  return (
    <main className="location-manager" dir={ar ? "rtl" : "ltr"}>
      <h1>{tr("المدن ونقاط التجمع", "Cities and meeting points")}</h1>
      <p>
        {tr(
          "الدولة ← المدينة ← نقطة تجمع قابلة لإعادة الاستخدام ← موعد البرنامج. بيانات التواصل التشغيلية خاصة بالإدارة.",
          "Country → city → reusable meeting point → program departure. Operational contacts remain private.",
        )}
      </p>
      <nav>
        {(["city", "point"] as const).map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              if (discard()) {
                setKind(k);
                reset();
              }
            }}
          >
            {k === "city"
              ? tr("المدن", "Cities")
              : tr("نقاط التجمع", "Meeting points")}
          </button>
        ))}
      </nav>
      <div className="location-grid">
        <section>
          <label>
            {tr("بحث", "Search")}
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          {kind === "point" && (
            <label>
              {tr("المدينة", "City")}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">{tr("كل المدن", "All cities")}</option>
                {cities.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {ar ? c.name_ar : c.name_en}
                  </option>
                ))}
              </select>
            </label>
          )}
          {query.isPending ? (
            <p role="status">{tr("جارٍ التحميل…", "Loading…")}</p>
          ) : query.isError ? (
            <p role="alert">
              {tr("تعذر تحميل المواقع.", "Unable to load locations.")}{" "}
              <button onClick={() => void query.refetch()}>
                {tr("إعادة المحاولة", "Retry")}
              </button>
            </p>
          ) : !rows.length ? (
            <p>
              {all.length
                ? tr("لا نتائج تطابق الفلاتر.", "No matching results.")
                : tr("لا توجد سجلات بعد.", "No records yet.")}
            </p>
          ) : (
            rows.map((row) => (
              <article key={row.id}>
                <strong>{ar ? row.name_ar : row.name_en}</strong>
                <small>
                  {row.deleted_at
                    ? tr("مؤرشف", "Archived")
                    : (row.publication_status ??
                      tr("تصنيف سابق", "Legacy publication"))}
                  {row.program_id
                    ? " · " + tr("مرتبط ببرنامج", "Program linked")
                    : ""}
                </small>
                <button
                  disabled={!!row.deleted_at}
                  onClick={() => void edit(row)}
                >
                  {tr("تعديل", "Edit")}
                </button>
                <button
                  disabled={
                    !permissions.data?.["countries.update"] || archive.isPending
                  }
                  onClick={() => archive.mutate(row)}
                >
                  {row.deleted_at
                    ? tr("استعادة معطلة", "Restore inactive")
                    : tr("أرشفة", "Archive")}
                </button>
              </article>
            ))
          )}
        </section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2>
            {editing
              ? tr("تعديل الموقع", "Edit location")
              : tr("موقع جديد", "New location")}
          </h2>
          {dirty && (
            <p role="status">{tr("تغييرات غير محفوظة", "Unsaved changes")}</p>
          )}
          <fieldset disabled={!canEdit || save.isPending}>
            <label>
              {kind === "city"
                ? tr("الدولة", "Country")
                : tr("المدينة", "City")}
              <select
                required
                value={kind === "city" ? form.country_id : form.city_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [kind === "city" ? "country_id" : "city_id"]:
                      e.target.value,
                    ...(kind === "city"
                      ? {
                          timezone:
                            countries.data?.find((c) => c.id === e.target.value)
                              ?.timezone ?? "",
                        }
                      : {}),
                  })
                }
              >
                <option value="">—</option>
                {(kind === "city"
                  ? countries.data
                  : cities.data?.filter((c) => !c.deleted_at)
                )?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {ar ? c.name_ar : c.name_en}
                  </option>
                ))}
              </select>
            </label>
            {field("name_ar", tr("الاسم بالعربية", "Arabic name"))}
            {field("name_en", tr("الاسم بالإنجليزية", "English name"))}
            {field("latitude", tr("خط العرض", "Latitude"), "number")}
            {field("longitude", tr("خط الطول", "Longitude"), "number")}
            <CoordinatePicker
              latitude={form.latitude === "" ? null : Number(form.latitude)}
              longitude={form.longitude === "" ? null : Number(form.longitude)}
              onChange={(lat, lon) =>
                setForm({
                  ...form,
                  latitude: String(lat),
                  longitude: String(lon),
                })
              }
            />
            {kind === "city" ? (
              <label>
                {tr("المنطقة الزمنية", "Timezone")}
                <select
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({ ...form, timezone: e.target.value })
                  }
                >
                  <option value="">{tr("غير محددة", "Unspecified")}</option>
                  {ianaTimezones.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                {field("address_ar", tr("العنوان بالعربية", "Arabic address"))}
                {field(
                  "address_en",
                  tr("العنوان بالإنجليزية", "English address"),
                )}
                {field(
                  "map_url",
                  tr("رابط الخريطة HTTPS", "HTTPS map link"),
                  "url",
                )}
                {field(
                  "arrival_instructions_ar",
                  tr("تعليمات الوصول بالعربية", "Arabic arrival instructions"),
                )}
                {field(
                  "arrival_instructions_en",
                  tr(
                    "تعليمات الوصول بالإنجليزية",
                    "English arrival instructions",
                  ),
                )}
                {field(
                  "contact_details",
                  tr(
                    "تواصل تشغيلي خاص — لا يظهر للزوار",
                    "Private operational contact — never public",
                  ),
                )}
              </>
            )}
            {field("sort_order", tr("الترتيب", "Order"), "number")}
            <label>
              {tr("النشر", "Publication")}
              <select
                disabled={!canPublish}
                value={form.publication_status}
                onChange={(e) =>
                  setForm({ ...form, publication_status: e.target.value })
                }
              >
                <option value="">{tr("تصنيف سابق", "Legacy")}</option>
                {publicationStates.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              {tr("مفعّل تشغيليًا", "Operationally active")}
            </label>
            {kind === "city" && (
              <label>
                <input
                  type="checkbox"
                  checked={form.show_on_map}
                  disabled={!canPublish}
                  onChange={(e) =>
                    setForm({ ...form, show_on_map: e.target.checked })
                  }
                />
                {tr("عرض على الخريطة بعد النشر", "Show on map when published")}
              </label>
            )}
            <button type="submit">
              {save.isPending
                ? tr("جارٍ الحفظ…", "Saving…")
                : tr("حفظ", "Save")}
            </button>
          </fieldset>
          <button
            type="button"
            onClick={() => {
              if (discard()) reset();
            }}
          >
            {tr("إلغاء / جديد", "Cancel / new")}
          </button>
          {notice && <p role="status">{notice}</p>}
          {(save.isError || archive.isError) && (
            <p role="alert">{(save.error ?? archive.error)?.message}</p>
          )}
          {countries.isError && (
            <p role="alert">
              {tr("تعذر تحميل الدول.", "Countries could not be loaded.")}
              <button type="button" onClick={() => void countries.refetch()}>
                {tr("إعادة المحاولة", "Retry")}
              </button>
            </p>
          )}
        </form>
      </div>
      <style jsx>{`
        .location-manager {
          padding: 24px;
        }
        .location-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 20px;
        }
        .location-grid section,
        .location-grid form {
          padding: 20px;
          border: 1px solid var(--aw-border, #b9c8d7);
          border-radius: 16px;
          background: var(--aw-surface, var(--nr-card-bg, #fff));
        }
        fieldset {
          border: 0;
          min-width: 0;
        }
        label,
        fieldset {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
        }
        input,
        select,
        button {
          padding: 10px;
          border: 1px solid #899cae;
          border-radius: 8px;
          font: inherit;
          color: inherit;
          background: transparent;
        }
        button {
          cursor: pointer;
          margin: 4px;
        }
        button:disabled {
          opacity: 0.5;
        }
        input[type="checkbox"] {
          width: 20px;
        }
        article {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          padding: 12px 0;
          border-bottom: 1px solid #aab9c8;
        }
        small {
          display: block;
        }
        @media (max-width: 900px) {
          .location-grid {
            grid-template-columns: 1fr;
          }
          .location-manager {
            padding: 12px;
          }
        }
      `}</style>
    </main>
  );
}
