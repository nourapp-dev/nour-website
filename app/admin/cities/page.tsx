"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../../src/lib/supabase/client";
import {
  getCities,
  type DepartureCity,
} from "../../../src/features/journeys/journey.service";
import { validCoordinates } from "../../../src/features/journeys/coordinates";
import CoordinatePicker from "../../../src/components/maps/CoordinatePicker";
const empty = {
  country_id: "",
  name_ar: "",
  name_en: "",
  latitude: "",
  longitude: "",
  sort_order: 0,
  is_active: true,
};
export default function CitiesPage() {
  const client = useMemo(() => createClient("admin"), []),
    cache = useQueryClient();
  const [form, setForm] = useState(empty),
    [id, setId] = useState<string | null>(null);
  const cities = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: () => getCities(client, true),
  });
  const countries = useQuery({
    queryKey: ["admin", "city-countries"],
    queryFn: async () => {
      const { data, error } = await client
        .from("countries")
        .select("id,name_ar")
        .eq("is_active", true)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      if (
        !form.country_id ||
        !form.name_ar.trim() ||
        !form.name_en.trim() ||
        !validCoordinates(form.latitude, form.longitude)
      )
        throw new Error("أكمل الدولة والأسماء والإحداثيات الصحيحة.");
      const payload = {
        ...form,
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      const { error } = id
        ? await client.from("departure_cities").update(payload).eq("id", id)
        : await client.from("departure_cities").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      setId(null);
      setForm(empty);
      await cache.invalidateQueries({ queryKey: ["admin", "cities"] });
      await cache.invalidateQueries({ queryKey: ["public", "journey-map"] });
    },
  });
  const archive = useMutation({
    mutationFn: async (c: DepartureCity) => {
      const { error } = await client
        .from("departure_cities")
        .update({
          deleted_at: c.deleted_at ? null : new Date().toISOString(),
          is_active: !c.deleted_at ? false : c.is_active,
        })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["admin", "cities"] }),
  });
  return (
    <main dir="rtl" className="city-admin">
      <h1>مدن الانطلاق</h1>
      <p>
        المدن مرتبطة بالدول. تربط المدينة بالبرنامج من صفحة مواعيد الانطلاق،
        وبنقطة التجمع من محتوى البرنامج.
      </p>
      <div className="city-grid">
        <section>
          <h2>المدن</h2>
          {cities.isPending ? <p>جارٍ التحميل…</p> : null}
          {cities.isError || countries.isError ? (
            <p role="alert">تعذر تحميل بيانات المدن والدول.</p>
          ) : null}
          {cities.data?.map((c) => (
            <article key={c.id}>
              <strong>{c.name_ar}</strong>
              <span>
                {c.deleted_at ? "مؤرشفة" : c.is_active ? "مفعّلة" : "معطّلة"}
              </span>
              <button
                type="button"
                disabled={Boolean(c.deleted_at)}
                onClick={() => {
                  setId(c.id);
                  setForm({
                    country_id: c.country_id,
                    name_ar: c.name_ar,
                    name_en: c.name_en,
                    latitude: String(c.latitude),
                    longitude: String(c.longitude),
                    sort_order: c.sort_order,
                    is_active: c.is_active,
                  });
                }}
              >
                تعديل
              </button>
              <button
                type="button"
                disabled={archive.isPending}
                onClick={() => archive.mutate(c)}
              >
                {c.deleted_at ? "استعادة" : "أرشفة"}
              </button>
            </article>
          ))}
        </section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2>{id ? "تعديل مدينة" : "إضافة مدينة"}</h2>
          <label>
            الدولة
            <select
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value })}
              required
            >
              <option value="">اختر الدولة</option>
              {countries.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </label>
          <label>
            الاسم بالعربية
            <input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              required
            />
          </label>
          <label>
            الاسم بالإنجليزية
            <input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              required
            />
          </label>
          <label>
            خط العرض
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              required
            />
          </label>
          <label>
            خط الطول
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              required
            />
          </label>
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
          <label>
            الترتيب
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />{" "}
            مفعّلة
          </label>
          <button disabled={save.isPending} type="submit">
            {save.isPending ? "جارٍ الحفظ…" : "حفظ المدينة"}
          </button>
          <button
            type="button"
            onClick={() => {
              setId(null);
              setForm(empty);
            }}
          >
            إلغاء / جديد
          </button>
          {save.isSuccess ? <p role="status">تم الحفظ.</p> : null}
          {save.isError || archive.isError ? (
            <p role="alert">
              {String((save.error ?? archive.error)?.message ?? "تعذر الحفظ")}
            </p>
          ) : null}
        </form>
      </div>
      <style jsx>{`
        .city-admin {
          padding: 24px;
        }
        .city-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .city-grid section,
        .city-grid form {
          background: var(--nr-card-bg, #fff);
          color: var(--nr-text, #16324e);
          padding: 20px;
          border-radius: 16px;
        }
        .city-grid form,
        .city-grid label {
          display: grid;
          gap: 12px;
        }
        .city-grid article {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #cdd8e3;
        }
        .city-grid input,
        .city-grid select,
        .city-grid button {
          font: inherit;
          padding: 10px;
          border: 1px solid #b9c8d7;
          border-radius: 8px;
        }
        .city-grid input[type="checkbox"] {
          width: 20px;
        }
        .city-grid button {
          cursor: pointer;
        }
        @media (max-width: 800px) {
          .city-grid {
            grid-template-columns: 1fr;
          }
          .city-admin {
            padding: 12px;
          }
        }
      `}</style>
    </main>
  );
}
