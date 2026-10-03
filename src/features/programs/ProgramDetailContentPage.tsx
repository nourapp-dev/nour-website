"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Save, Trash2, X } from "lucide-react";

import { createClient } from "../../lib/supabase/client";
import {
  archiveProgramDetailItem,
  createProgramDetailItem,
  getProgramDetailContent,
  updateProgramDetailItem,
  type ProgramDetailSection,
  type ProgramDetailContent,
} from "./services/program-detail-content.service";

import CoordinatePicker from "../../components/maps/CoordinatePicker";
import { getCities } from "../journeys/journey.service";
import { getProgramDepartures } from "./services/program-departures.service";

type Props = { programId: string };
type FormState = Record<string, string>;
type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "time" | "datetime-local" | "select";
  options?: { value: string; label: string }[];
};

type SectionConfig<Item> = {
  label: string;
  fields: Field[];
  empty: FormState;
  toPayload: (form: FormState) => Record<string, unknown>;
  fromItem: (item: Item) => FormState;
  title: (item: Item) => string;
};

const numberOrNull = (value: string) =>
  value.trim() === "" ? null : Number(value);

const configs: {
  [S in ProgramDetailSection]: SectionConfig<ProgramDetailContent[S][number]>;
} = {
  itinerary: {
    label: "الجدول اليومي",
    fields: [
      { key: "dayNumber", label: "رقم اليوم", type: "number" },
      { key: "titleAr", label: "العنوان بالعربية" },
      { key: "titleEn", label: "العنوان بالإنجليزية" },
      { key: "descriptionAr", label: "الوصف بالعربية", type: "textarea" },
      { key: "descriptionEn", label: "الوصف بالإنجليزية", type: "textarea" },
      { key: "locationAr", label: "الموقع بالعربية" },
      { key: "locationEn", label: "الموقع بالإنجليزية" },
      { key: "startTime", label: "وقت البداية", type: "time" },
      { key: "endTime", label: "وقت النهاية", type: "time" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      dayNumber: "1",
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      locationAr: "",
      locationEn: "",
      startTime: "",
      endTime: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      day_number: Number(f.dayNumber),
      title_ar: f.titleAr,
      title_en: f.titleEn,
      description_ar: f.descriptionAr || null,
      description_en: f.descriptionEn || null,
      location_ar: f.locationAr || null,
      location_en: f.locationEn || null,
      start_time: f.startTime || null,
      end_time: f.endTime || null,
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      dayNumber: String(i.dayNumber),
      titleAr: i.titleAr,
      titleEn: i.titleEn,
      descriptionAr: i.descriptionAr,
      descriptionEn: i.descriptionEn,
      locationAr: i.locationAr,
      locationEn: i.locationEn,
      startTime: i.startTime,
      endTime: i.endTime,
      sortOrder: String(i.sortOrder),
    }),
    title: (i) => `اليوم ${i.dayNumber} — ${i.titleAr}`,
  },
  inclusions: {
    label: "يشمل / لا يشمل",
    fields: [
      {
        key: "inclusionType",
        label: "النوع",
        type: "select",
        options: [
          { value: "included", label: "مشمول" },
          { value: "excluded", label: "غير مشمول" },
        ],
      },
      { key: "titleAr", label: "العنوان بالعربية" },
      { key: "titleEn", label: "العنوان بالإنجليزية" },
      { key: "descriptionAr", label: "الوصف بالعربية", type: "textarea" },
      { key: "descriptionEn", label: "الوصف بالإنجليزية", type: "textarea" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      inclusionType: "included",
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      inclusion_type: f.inclusionType,
      title_ar: f.titleAr,
      title_en: f.titleEn,
      description_ar: f.descriptionAr || null,
      description_en: f.descriptionEn || null,
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      inclusionType: i.inclusionType,
      titleAr: i.titleAr,
      titleEn: i.titleEn,
      descriptionAr: i.descriptionAr,
      descriptionEn: i.descriptionEn,
      sortOrder: String(i.sortOrder),
    }),
    title: (i) =>
      `${i.inclusionType === "included" ? "مشمول" : "غير مشمول"} — ${i.titleAr}`,
  },
  cancellation: {
    label: "سياسة الإلغاء",
    fields: [
      { key: "titleAr", label: "العنوان بالعربية" },
      { key: "titleEn", label: "العنوان بالإنجليزية" },
      { key: "descriptionAr", label: "السياسة بالعربية", type: "textarea" },
      { key: "descriptionEn", label: "السياسة بالإنجليزية", type: "textarea" },
      {
        key: "daysBeforeStart",
        label: "الأيام قبل بداية البرنامج",
        type: "number",
      },
      { key: "refundPercent", label: "نسبة الاسترداد %", type: "number" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      titleAr: "",
      titleEn: "",
      descriptionAr: "",
      descriptionEn: "",
      daysBeforeStart: "",
      refundPercent: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      title_ar: f.titleAr,
      title_en: f.titleEn,
      description_ar: f.descriptionAr,
      description_en: f.descriptionEn,
      days_before_start: numberOrNull(f.daysBeforeStart),
      refund_percent: numberOrNull(f.refundPercent),
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      titleAr: i.titleAr,
      titleEn: i.titleEn,
      descriptionAr: i.descriptionAr,
      descriptionEn: i.descriptionEn,
      daysBeforeStart:
        i.daysBeforeStart == null ? "" : String(i.daysBeforeStart),
      refundPercent: i.refundPercent == null ? "" : String(i.refundPercent),
      sortOrder: String(i.sortOrder),
    }),
    title: (i) => i.titleAr,
  },
  meetingPoints: {
    label: "نقاط الالتقاء",
    fields: [
      { key: "nameAr", label: "الاسم بالعربية" },
      { key: "nameEn", label: "الاسم بالإنجليزية" },
      { key: "addressAr", label: "العنوان بالعربية" },
      { key: "addressEn", label: "العنوان بالإنجليزية" },
      { key: "latitude", label: "خط العرض", type: "number" },
      { key: "longitude", label: "خط الطول", type: "number" },
      { key: "meetingAt", label: "موعد الالتقاء", type: "datetime-local" },
      { key: "notesAr", label: "ملاحظات بالعربية", type: "textarea" },
      { key: "notesEn", label: "ملاحظات بالإنجليزية", type: "textarea" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      cityId: "",
      departureId: "",
      nameAr: "",
      nameEn: "",
      addressAr: "",
      addressEn: "",
      latitude: "",
      longitude: "",
      meetingAt: "",
      notesAr: "",
      notesEn: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      city_id: f.cityId || null,
      departure_id: f.departureId || null,
      name_ar: f.nameAr,
      name_en: f.nameEn,
      address_ar: f.addressAr || null,
      address_en: f.addressEn || null,
      latitude: numberOrNull(f.latitude),
      longitude: numberOrNull(f.longitude),
      meeting_at: f.meetingAt ? new Date(f.meetingAt).toISOString() : null,
      notes_ar: f.notesAr || null,
      notes_en: f.notesEn || null,
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      cityId: i.cityId ?? "",
      departureId: i.departureId ?? "",
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      addressAr: i.addressAr,
      addressEn: i.addressEn,
      latitude: i.latitude == null ? "" : String(i.latitude),
      longitude: i.longitude == null ? "" : String(i.longitude),
      meetingAt: i.meetingAt ? String(i.meetingAt).slice(0, 16) : "",
      notesAr: i.notesAr,
      notesEn: i.notesEn,
      sortOrder: String(i.sortOrder),
    }),
    title: (i) => i.nameAr,
  },
  priceTiers: {
    label: "فئات الأسعار",
    fields: [
      { key: "nameAr", label: "اسم الفئة بالعربية" },
      { key: "nameEn", label: "اسم الفئة بالإنجليزية" },
      { key: "descriptionAr", label: "الوصف بالعربية", type: "textarea" },
      { key: "descriptionEn", label: "الوصف بالإنجليزية", type: "textarea" },
      { key: "price", label: "السعر", type: "number" },
      { key: "currencyCode", label: "العملة" },
      { key: "minTravelers", label: "الحد الأدنى للمسافرين", type: "number" },
      { key: "maxTravelers", label: "الحد الأعلى للمسافرين", type: "number" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      price: "0",
      currencyCode: "SAR",
      minTravelers: "",
      maxTravelers: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      name_ar: f.nameAr,
      name_en: f.nameEn,
      description_ar: f.descriptionAr || null,
      description_en: f.descriptionEn || null,
      price: Number(f.price || 0),
      currency_code: (f.currencyCode || "SAR").toUpperCase(),
      min_travelers: numberOrNull(f.minTravelers),
      max_travelers: numberOrNull(f.maxTravelers),
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      descriptionAr: i.descriptionAr,
      descriptionEn: i.descriptionEn,
      price: String(i.price),
      currencyCode: i.currencyCode,
      minTravelers: i.minTravelers == null ? "" : String(i.minTravelers),
      maxTravelers: i.maxTravelers == null ? "" : String(i.maxTravelers),
      sortOrder: String(i.sortOrder),
    }),
    title: (i) => `${i.nameAr} — ${i.price} ${i.currencyCode}`,
  },
  faqs: {
    label: "الأسئلة الشائعة",
    fields: [
      { key: "questionAr", label: "السؤال بالعربية", type: "textarea" },
      { key: "questionEn", label: "السؤال بالإنجليزية", type: "textarea" },
      { key: "answerAr", label: "الإجابة بالعربية", type: "textarea" },
      { key: "answerEn", label: "الإجابة بالإنجليزية", type: "textarea" },
      { key: "sortOrder", label: "الترتيب", type: "number" },
    ],
    empty: {
      questionAr: "",
      questionEn: "",
      answerAr: "",
      answerEn: "",
      sortOrder: "0",
    },
    toPayload: (f) => ({
      question_ar: f.questionAr,
      question_en: f.questionEn,
      answer_ar: f.answerAr,
      answer_en: f.answerEn,
      sort_order: Number(f.sortOrder || 0),
    }),
    fromItem: (i) => ({
      questionAr: i.questionAr,
      questionEn: i.questionEn,
      answerAr: i.answerAr,
      answerEn: i.answerEn,
      sortOrder: String(i.sortOrder),
    }),
    title: (i) => i.questionAr,
  },
};

function getSectionConfig<S extends ProgramDetailSection>(section: S) {
  // The selected section determines both its record type and its editor.
  return configs[section] as SectionConfig<ProgramDetailContent[S][number]>;
}

const sections = Object.keys(configs) as ProgramDetailSection[];

export default function ProgramDetailContentPage({ programId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<ProgramDetailSection>("itinerary");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(configs.itinerary.empty);
  const config = getSectionConfig(section);

  const programQuery = useQuery({
    queryKey: ["admin", "program", programId, "content-title"],
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

  const cities = useQuery({
    queryKey: ["admin", "cities", "active"],
    queryFn: () => getCities(supabase),
  });
  const departures = useQuery({
    queryKey: ["admin", "program", programId, "departures"],
    queryFn: () => getProgramDepartures(supabase, programId),
  });

  const contentQuery = useQuery({
    queryKey: ["admin", "program", programId, "structured-content"],
    queryFn: () => getProgramDetailContent(supabase, programId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = config.toPayload(form);
      if (editingId)
        return updateProgramDetailItem(supabase, section, editingId, payload);
      return createProgramDetailItem(supabase, section, programId, payload);
    },
    onSuccess: async () => {
      setEditingId(null);
      setForm(config.empty);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "program", programId, "structured-content"],
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({
      id,
      target,
    }: {
      id: string;
      target: ProgramDetailSection;
    }) => archiveProgramDetailItem(supabase, target, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "program", programId, "structured-content"],
      }),
  });

  const items = contentQuery.data?.[section] ?? [];

  const changeSection = (next: ProgramDetailSection) => {
    setSection(next);
    setEditingId(null);
    setForm(configs[next].empty);
  };

  return (
    <main className="pd-admin" dir="rtl">
      <div className="pd-head">
        <div>
          <Link href={`/admin/programs/${programId}`}>
            <ArrowRight size={16} /> العودة للبرنامج
          </Link>
          <h1>محتوى تفاصيل البرنامج</h1>
          <p>{programQuery.data?.title_ar ?? ""}</p>
        </div>
      </div>

      <div className="pd-tabs">
        {sections.map((key) => (
          <button
            key={key}
            className={section === key ? "active" : ""}
            onClick={() => changeSection(key)}
          >
            {configs[key].label}
            <span>{contentQuery.data?.[key]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="pd-grid">
        <div className="pd-list">
          <div className="pd-section-head">
            <h2>{config.label}</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(config.empty);
              }}
            >
              <Plus size={16} /> إضافة
            </button>
          </div>
          {contentQuery.isLoading ? <p>جارٍ التحميل...</p> : null}
          {!contentQuery.isLoading && items.length === 0 ? (
            <div className="pd-empty">لا توجد عناصر في هذا القسم حتى الآن.</div>
          ) : null}
          {items.map((item) => (
            <article key={item.id}>
              <strong>{config.title(item)}</strong>
              <div>
                <button
                  onClick={() => {
                    setEditingId(item.id);
                    setForm(config.fromItem(item));
                  }}
                >
                  تعديل
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    archiveMutation.mutate({ id: item.id, target: section })
                  }
                >
                  <Trash2 size={15} /> حذف
                </button>
              </div>
            </article>
          ))}
        </div>

        <form
          className="pd-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="pd-section-head">
            <h2>{editingId ? "تعديل العنصر" : "إضافة عنصر"}</h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(config.empty);
                }}
              >
                <X size={16} /> إلغاء
              </button>
            ) : null}
          </div>
          {section === "meetingPoints" ? (
            <>
              <label>
                مدينة التجمع
                <select
                  value={form.cityId ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cityId: e.target.value,
                      departureId: "",
                    })
                  }
                >
                  <option value="">غير محددة</option>
                  {cities.data
                    ?.filter(
                      (c) => c.country_id === programQuery.data?.country_id,
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                موعد الانطلاق المرتبط
                <select
                  value={form.departureId ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, departureId: e.target.value })
                  }
                >
                  <option value="">جميع مواعيد البرنامج من المدينة</option>
                  {departures.data
                    ?.filter((d) => d.originCityId === form.cityId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {new Date(d.startAt).toLocaleString("ar-SA", {
                          timeZone: "Asia/Riyadh",
                        })}
                      </option>
                    ))}
                </select>
              </label>
              <CoordinatePicker
                latitude={numberOrNull(form.latitude ?? "")}
                longitude={numberOrNull(form.longitude ?? "")}
                onChange={(lat, lon) =>
                  setForm({
                    ...form,
                    latitude: String(lat),
                    longitude: String(lon),
                  })
                }
              />
            </>
          ) : null}
          {config.fields.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  rows={4}
                />
              ) : field.type === "select" ? (
                <select
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type ?? "text"}
                  value={form[field.key] ?? ""}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
              )}
            </label>
          ))}
          {saveMutation.isError ? (
            <p className="pd-error">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "تعذر الحفظ"}
            </p>
          ) : null}
          <button
            className="pd-save"
            type="submit"
            disabled={saveMutation.isPending}
          >
            <Save size={17} />
            {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </form>
      </section>

      <style jsx global>{`
        .pd-admin {
          padding: 28px;
          max-width: 1500px;
          margin: auto;
          color: #162a44;
        }
        .pd-head a,
        .pd-section-head button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: #176fe8;
          font-weight: 800;
        }
        .pd-head h1 {
          margin: 12px 0 4px;
          font-size: 30px;
        }
        .pd-head p {
          margin: 0;
          color: #718198;
        }
        .pd-tabs {
          display: flex;
          gap: 8px;
          overflow: auto;
          margin: 24px 0;
          padding-bottom: 4px;
        }
        .pd-tabs button {
          white-space: nowrap;
          border: 1px solid #dce5f0;
          background: #fff;
          border-radius: 12px;
          padding: 10px 13px;
          font-weight: 800;
          color: #60738b;
          cursor: pointer;
        }
        .pd-tabs button.active {
          color: #fff;
          background: #176fe8;
          border-color: #176fe8;
        }
        .pd-tabs span {
          margin-inline-start: 7px;
          opacity: 0.7;
        }
        .pd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
          gap: 18px;
        }
        .pd-list,
        .pd-form {
          background: #fff;
          border: 1px solid #dce5f0;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 14px 40px rgba(20, 59, 102, 0.06);
        }
        .pd-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }
        .pd-section-head h2 {
          margin: 0;
          font-size: 18px;
        }
        .pd-section-head button {
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .pd-list article {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid #edf2f7;
        }
        .pd-list article > div {
          display: flex;
          gap: 6px;
        }
        .pd-list article button {
          border: 0;
          background: #eef5ff;
          color: #176fe8;
          border-radius: 9px;
          padding: 7px 9px;
          cursor: pointer;
        }
        .pd-list article button.danger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #b42318;
          background: #fff1f0;
        }
        .pd-empty {
          padding: 24px;
          border: 1px dashed #d5deea;
          border-radius: 14px;
          text-align: center;
          color: #8090a3;
        }
        .pd-form {
          display: grid;
          gap: 12px;
          align-content: start;
        }
        .pd-form label {
          display: grid;
          gap: 6px;
        }
        .pd-form label > span {
          font-size: 12px;
          font-weight: 800;
          color: #526981;
        }
        .pd-form input,
        .pd-form textarea,
        .pd-form select {
          width: 100%;
          border: 1px solid #d7e1ec;
          border-radius: 11px;
          padding: 10px 11px;
          font: inherit;
          outline: none;
          background: #fff;
        }
        .pd-form input:focus,
        .pd-form textarea:focus,
        .pd-form select:focus {
          border-color: #176fe8;
          box-shadow: 0 0 0 3px rgba(23, 111, 232, 0.1);
        }
        .pd-save {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          border: 0;
          border-radius: 12px;
          padding: 11px 16px;
          background: #176fe8;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }
        .pd-save:disabled {
          opacity: 0.55;
        }
        .pd-error {
          color: #b42318;
          font-size: 12px;
        }
        @media (max-width: 900px) {
          .pd-admin {
            padding: 18px;
          }
          .pd-grid {
            grid-template-columns: 1fr;
          }
          .pd-list article {
            align-items: flex-start;
            flex-direction: column;
          }
          .pd-list article > div {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
