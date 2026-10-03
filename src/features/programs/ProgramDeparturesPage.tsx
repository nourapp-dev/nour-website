"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Plus, Save, Trash2, X } from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import {
  archiveProgramDeparture,
  createProgramDeparture,
  getProgramDepartures,
  updateProgramDeparture,
  type ProgramDeparture,
  type ProgramDepartureStatus,
} from "./services/program-departures.service";

import { getCities } from "../journeys/journey.service";

type Props = { programId: string };

type FormState = {
  originCityId: string;
  startAt: string;
  endAt: string;
  bookingDeadline: string;
  capacityTotal: string;
  seatsAvailable: string;
  status: ProgramDepartureStatus;
  notesAr: string;
  notesEn: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  originCityId: "",
  startAt: "",
  endAt: "",
  bookingDeadline: "",
  capacityTotal: "0",
  seatsAvailable: "0",
  status: "scheduled",
  notesAr: "",
  notesEn: "",
  sortOrder: "0",
  isActive: true,
};

const toLocalInput = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export default function ProgramDeparturesPage({ programId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const programQuery = useQuery({
    queryKey: ["admin", "program", programId, "departure-title"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id,title_ar,title_en,country_id")
        .eq("id", programId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "cities", "active"],
    queryFn: () => getCities(supabase),
  });

  const departuresQuery = useQuery({
    queryKey: ["admin", "program", programId, "departures"],
    queryFn: () => getProgramDepartures(supabase, programId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const total = Number(form.capacityTotal || 0);
      const available = Number(form.seatsAvailable || 0);
      if (!form.startAt) throw new Error("تاريخ ووقت الانطلاق مطلوب.");
      if (available > total)
        throw new Error("المقاعد المتاحة لا يمكن أن تتجاوز السعة الإجمالية.");
      const payload = {
        origin_city_id: form.originCityId || null,
        start_at: new Date(form.startAt).toISOString(),
        end_at: form.endAt ? new Date(form.endAt).toISOString() : null,
        booking_deadline: form.bookingDeadline
          ? new Date(form.bookingDeadline).toISOString()
          : null,
        capacity_total: total,
        seats_available: available,
        status: form.status,
        notes_ar: form.notesAr || null,
        notes_en: form.notesEn || null,
        sort_order: Number(form.sortOrder || 0),
        is_active: form.isActive,
      };
      if (editingId)
        return updateProgramDeparture(supabase, editingId, payload);
      return createProgramDeparture(supabase, programId, payload);
    },
    onSuccess: async () => {
      setEditingId(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "program", programId, "departures"],
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveProgramDeparture(supabase, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "program", programId, "departures"],
      }),
  });

  const edit = (item: ProgramDeparture) => {
    setEditingId(item.id);
    setForm({
      originCityId: item.originCityId ?? "",
      startAt: toLocalInput(item.startAt),
      endAt: toLocalInput(item.endAt),
      bookingDeadline: toLocalInput(item.bookingDeadline),
      capacityTotal: String(item.capacityTotal),
      seatsAvailable: String(item.seatsAvailable),
      status: item.status,
      notesAr: item.notesAr,
      notesEn: item.notesEn,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
  };

  const statusLabel: Record<ProgramDepartureStatus, string> = {
    scheduled: "مجدولة",
    open: "متاحة للحجز",
    full: "ممتلئة",
    closed: "مغلقة",
    cancelled: "ملغاة",
  };

  return (
    <main className="pdep-admin" dir="rtl">
      <header className="pdep-head">
        <div>
          <Link href={`/admin/programs/${programId}`}>
            <ArrowRight size={16} /> العودة للبرنامج
          </Link>
          <h1>مواعيد الانطلاق والتوفر</h1>
          <p>{programQuery.data?.title_ar ?? ""}</p>
        </div>
        <div className="pdep-head-links">
          <Link href={`/admin/programs/${programId}/content`}>
            إدارة تفاصيل البرنامج
          </Link>
        </div>
      </header>

      <section className="pdep-form-card">
        <div className="pdep-card-title">
          <CalendarDays size={20} />
          <strong>
            {editingId ? "تعديل موعد الانطلاق" : "إضافة موعد انطلاق"}
          </strong>
        </div>
        <div className="pdep-grid">
          <label>
            مدينة الانطلاق
            <select
              value={form.originCityId}
              onChange={(e) =>
                setForm({ ...form, originCityId: e.target.value })
              }
            >
              <option value="">غير محددة</option>
              {citiesQuery.data
                ?.filter((c) => c.country_id === programQuery.data?.country_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
            </select>
          </label>
          <label>
            الانطلاق
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />
          </label>
          <label>
            نهاية البرنامج
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </label>
          <label>
            آخر موعد للحجز
            <input
              type="datetime-local"
              value={form.bookingDeadline}
              onChange={(e) =>
                setForm({ ...form, bookingDeadline: e.target.value })
              }
            />
          </label>
          <label>
            الحالة
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProgramDepartureStatus,
                })
              }
            >
              <option value="scheduled">مجدولة</option>
              <option value="open">متاحة للحجز</option>
              <option value="full">ممتلئة</option>
              <option value="closed">مغلقة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </label>
          <label>
            السعة الإجمالية
            <input
              type="number"
              min="0"
              value={form.capacityTotal}
              onChange={(e) =>
                setForm({ ...form, capacityTotal: e.target.value })
              }
            />
          </label>
          <label>
            المقاعد المتاحة
            <input
              type="number"
              min="0"
              value={form.seatsAvailable}
              onChange={(e) =>
                setForm({ ...form, seatsAvailable: e.target.value })
              }
            />
          </label>
          <label>
            الترتيب
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </label>
          <label className="pdep-check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />{" "}
            نشط ويظهر للعامة
          </label>
          <label className="pdep-wide">
            ملاحظات بالعربية
            <textarea
              value={form.notesAr}
              onChange={(e) => setForm({ ...form, notesAr: e.target.value })}
            />
          </label>
          <label className="pdep-wide">
            ملاحظات بالإنجليزية
            <textarea
              value={form.notesEn}
              onChange={(e) => setForm({ ...form, notesEn: e.target.value })}
            />
          </label>
        </div>
        {saveMutation.error ? (
          <p className="pdep-error">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "تعذر الحفظ"}
          </p>
        ) : null}
        <div className="pdep-actions">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save size={16} /> {editingId ? "حفظ التعديل" : "إضافة الموعد"}
          </button>
          {editingId ? (
            <button
              className="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              <X size={16} /> إلغاء
            </button>
          ) : null}
        </div>
      </section>

      <section className="pdep-list">
        {(departuresQuery.data ?? []).length === 0 ? (
          <div className="pdep-empty">
            <Plus size={18} /> لا توجد مواعيد انطلاق مضافة بعد.
          </div>
        ) : null}
        {(departuresQuery.data ?? []).map((item) => (
          <article key={item.id} className="pdep-item">
            <div>
              <strong>
                {new Intl.DateTimeFormat("ar-SA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.startAt))}
              </strong>
              <span>
                {statusLabel[item.status]} · {item.seatsAvailable} من{" "}
                {item.capacityTotal} مقعد متاح
              </span>
              {item.bookingDeadline ? (
                <small>
                  آخر موعد للحجز:{" "}
                  {new Intl.DateTimeFormat("ar-SA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.bookingDeadline))}
                </small>
              ) : null}
            </div>
            <div className="pdep-row-actions">
              <button onClick={() => edit(item)}>تعديل</button>
              <button
                className="danger"
                onClick={() => archiveMutation.mutate(item.id)}
              >
                <Trash2 size={15} /> أرشفة
              </button>
            </div>
          </article>
        ))}
      </section>

      <style jsx global>{`
        .pdep-admin {
          padding: 24px;
          display: grid;
          gap: 20px;
          color: #14253d;
        }
        .pdep-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .pdep-head a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: #176fe8;
          font-weight: 800;
        }
        .pdep-head h1 {
          margin: 10px 0 4px;
          font-size: 30px;
        }
        .pdep-head p {
          margin: 0;
          color: #6d7b91;
        }
        .pdep-head-links a {
          padding: 10px 14px;
          border: 1px solid #dce5f0;
          border-radius: 12px;
          background: #fff;
        }
        .pdep-form-card {
          padding: 22px;
          border: 1px solid #dce5f0;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 16px 45px rgba(20, 59, 102, 0.06);
        }
        .pdep-card-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
        }
        .pdep-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .pdep-grid label {
          display: grid;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          color: #50647d;
        }
        .pdep-grid input,
        .pdep-grid select,
        .pdep-grid textarea {
          min-height: 42px;
          padding: 10px 12px;
          border: 1px solid #dce5f0;
          border-radius: 11px;
          background: #fbfcfe;
          color: #14253d;
        }
        .pdep-grid textarea {
          min-height: 92px;
          resize: vertical;
        }
        .pdep-wide {
          grid-column: 1/-1;
        }
        .pdep-check {
          display: flex !important;
          align-items: center;
          grid-template-columns: auto 1fr;
          align-self: end;
          min-height: 42px;
        }
        .pdep-check input {
          min-height: auto;
          width: 18px;
          height: 18px;
        }
        .pdep-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .pdep-actions button,
        .pdep-row-actions button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .pdep-actions button {
          background: #176fe8;
          color: #fff;
        }
        .pdep-actions .secondary {
          background: #eef3f8;
          color: #31465f;
        }
        .pdep-error {
          color: #b42318;
        }
        .pdep-list {
          display: grid;
          gap: 12px;
        }
        .pdep-item {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 17px 18px;
          border: 1px solid #dce5f0;
          border-radius: 16px;
          background: #fff;
        }
        .pdep-item > div:first-child {
          display: grid;
          gap: 5px;
        }
        .pdep-item span,
        .pdep-item small {
          color: #6d7b91;
        }
        .pdep-row-actions {
          display: flex;
          gap: 8px;
        }
        .pdep-row-actions button {
          background: #eef5ff;
          color: #176fe8;
        }
        .pdep-row-actions .danger {
          background: #fff1f0;
          color: #b42318;
        }
        .pdep-empty {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 18px;
          border: 1px dashed #cdd9e7;
          border-radius: 15px;
          color: #718198;
          background: #fbfcfe;
        }
        @media (max-width: 760px) {
          .pdep-admin {
            padding: 16px;
          }
          .pdep-head,
          .pdep-item {
            align-items: stretch;
            flex-direction: column;
          }
          .pdep-grid {
            grid-template-columns: 1fr;
          }
          .pdep-wide {
            grid-column: auto;
          }
          .pdep-row-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
