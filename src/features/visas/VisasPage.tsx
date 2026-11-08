"use client";
import {useUnsaved,serializeDraft} from "../admin-workspace/useUnsaved";

import {
  useMemo,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import Button from "../../components/ui/Button";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { countriesQuery } from "../countries/services";

import type {
  Visa,
  VisaFormValues,
  VisaProcessingType,
  VisaType,
} from "./types/visa";

import {
  deleteVisa,
  deletedVisasQueryKey,
  listDeletedVisas,
  listVisas,
  restoreDeletedVisa,
  saveNewVisa,
  saveVisaChanges,
  setVisaActive,
  visasQueryKey,
} from "./services/visas.service";

const defaultValues: VisaFormValues = {
  nameAr: "",
  nameEn: "",
  visaType: "umrah",
  processingType: "standard",
  countryId: null,
  descriptionAr: "",
  descriptionEn: "",
  requirementsAr: [],
  requirementsEn: [],
  processingTimeDays: null,
  validityDays: null,
  maxStayDays: null,
  basePrice: null,
  currencyCode: "SAR",
  coverMediaId: null,
  isActive: true,
  sortOrder: 0,
};

const visaTypes: Array<{
  value: VisaType;
  ar: string;
  en: string;
}> = [
  {
    value: "umrah",
    ar: "تأشيرة عمرة",
    en: "Umrah Visa",
  },
  {
    value: "tourist",
    ar: "تأشيرة سياحية",
    en: "Tourist Visa",
  },
  {
    value: "visit",
    ar: "تأشيرة زيارة",
    en: "Visit Visa",
  },
  {
    value: "transit",
    ar: "تأشيرة ترانزيت",
    en: "Transit Visa",
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
  },
];

const processingTypes: Array<{
  value: VisaProcessingType;
  ar: string;
  en: string;
}> = [
  {
    value: "standard",
    ar: "عادية",
    en: "Standard",
  },
  {
    value: "express",
    ar: "سريعة",
    en: "Express",
  },
  {
    value: "manual",
    ar: "معالجة يدوية",
    en: "Manual",
  },
];

function toFormValues(
  visa: Visa,
): VisaFormValues {
  return {
    nameAr: visa.nameAr,
    nameEn: visa.nameEn,
    visaType: visa.visaType,
    processingType:
      visa.processingType,
    countryId: visa.countryId,
    descriptionAr:
      visa.descriptionAr ?? "",
    descriptionEn:
      visa.descriptionEn ?? "",
    requirementsAr:
      visa.requirementsAr ?? [],
    requirementsEn:
      visa.requirementsEn ?? [],
    processingTimeDays:
      visa.processingTimeDays,
    validityDays:
      visa.validityDays,
    maxStayDays:
      visa.maxStayDays,
    basePrice:
      visa.basePrice,
    currencyCode:
      visa.currencyCode ?? "SAR",
    coverMediaId:
      visa.coverMediaId,
    isActive:
      visa.isActive,
    sortOrder:
      visa.sortOrder,
  };
}

function parseList(
  value: string,
) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function VisasPage() {
  const { language } =
    useLanguage();

  const isArabic =
    language === "ar";

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const queryClient =
    useQueryClient();

  const [search, setSearch] =
    useState("");

  const [showDeleted, setShowDeleted] =
    useState(false);

  const [editingVisa, setEditingVisa] =
    useState<Visa | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [values, setValues] =
    useState<VisaFormValues>(
      defaultValues,
    );

  const visasQuery =
    useQuery({
      queryKey: visasQueryKey,
      queryFn: () =>
        listVisas(supabase),
    });

  const deletedQuery =
    useQuery({
      queryKey:
        deletedVisasQueryKey,
      queryFn: () =>
        listDeletedVisas(
          supabase,
        ),
      enabled: showDeleted,
    });

  const {
    data: countries = [],
  } = useQuery(
    countriesQuery(supabase),
  );

  const rows =
    showDeleted
      ? deletedQuery.data ?? []
      : visasQuery.data ?? [];

  const filteredRows =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLowerCase();

      if (!normalized) {
        return rows;
      }

      return rows.filter(
        (visa) =>
          visa.nameAr
            .toLowerCase()
            .includes(normalized) ||
          visa.nameEn
            .toLowerCase()
            .includes(normalized),
      );
    }, [rows, search]);

  const [formBaseline,setFormBaseline]=useState(()=>serializeDraft(defaultValues));
  useUnsaved(isFormOpen && serializeDraft(values)!==formBaseline, isArabic ? 'لديك تعديلات غير محفوظة. هل تريد المغادرة؟' : 'Unsaved changes. Leave?');
  const [validationError,setValidationError]=useState('');
  function updateValue<
    K extends keyof VisaFormValues,
  >(
    key: K,
    value: VisaFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingVisa(null);
    setValues(defaultValues);
    setIsFormOpen(true);
  }

  function openEdit(
    visa: Visa,
  ) {
    setEditingVisa(visa);
    setValues(
      toFormValues(visa),
    );
    setIsFormOpen(true);
  }

  function closeForm() {
    if(serializeDraft(values)!==formBaseline && !window.confirm(isArabic ? 'تجاهل التعديلات غير المحفوظة؟' : 'Unsaved changes. Close?'))return;
    if (isSaving) {
      return;
    }

    setEditingVisa(null);
    setValues(defaultValues);
    setIsFormOpen(false);
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: visasQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey:
          deletedVisasQueryKey,
      }),
    ]);
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if(isSaving)return;
    setValidationError('');

    if (
      !values.nameAr.trim() ||
      !values.nameEn.trim()
    ) {
      setValidationError(
        isArabic
          ? "أدخل اسم التأشيرة بالعربية والإنجليزية."
          : "Enter the visa name in Arabic and English.",
      );

      return;
    }

    setIsSaving(true);

    try {
      if (editingVisa) {
        await saveVisaChanges(
          supabase,
          editingVisa.id,
          values,
        );
      } else {
        await saveNewVisa(
          supabase,
          values,
        );
      }

      await refresh();
      setIsFormOpen(false);setEditingVisa(null);setValues(defaultValues);setFormBaseline(serializeDraft(defaultValues));
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر حفظ التأشيرة."
          : "Unable to save visa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(
    visa: Visa,
  ) {
    try {
      await setVisaActive(
        supabase,
        visa.id,
        !visa.isActive,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر تحديث حالة التأشيرة."
          : "Unable to update visa status.",
      );
    }
  }

  async function handleDelete(
    visa: Visa,
  ) {
    const approved =
      window.confirm(
        isArabic
          ? `هل تريد حذف "${visa.nameAr}"؟`
          : `Delete "${visa.nameEn}"?`,
      );

    if (!approved) {
      return;
    }

    try {
      await deleteVisa(
        supabase,
        visa.id,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر حذف التأشيرة."
          : "Unable to delete visa.",
      );
    }
  }

  async function handleRestore(
    visa: Visa,
  ) {
    try {
      await restoreDeletedVisa(
        supabase,
        visa.id,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر استعادة التأشيرة."
          : "Unable to restore visa.",
      );
    }
  }

  const isLoading =
    showDeleted
      ? deletedQuery.isLoading
      : visasQuery.isLoading;

  const hasError =
    showDeleted
      ? deletedQuery.isError
      : visasQuery.isError;

  return (
    <div className="nr-admin-page nr-visas-admin">
      {validationError && !isFormOpen && <p className="aw-error" role="alert">{validationError}</p>}
      <div className="nr-admin-page-header">
        <div>
          <span className="nr-admin-kicker">
            {isArabic
              ? "إدارة الخدمات"
              : "Service Management"}
          </span>

          <h1>
            {isArabic
              ? "التأشيرات"
              : "Visas"}
          </h1>

          <p>
            {isArabic
              ? "أنشئ خدمات التأشيرات ومتطلباتها ثم اربطها ببرامج العمرة."
              : "Create visa services and requirements, then link them to Umrah programs."}
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreate}
        >
          {isArabic
            ? "+ إضافة تأشيرة"
            : "+ Add Visa"}
        </Button>
      </div>

      <div className="nr-admin-toolbar">
        <input
          className="nr-input"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder={
            isArabic
              ? "ابحث باسم التأشيرة..."
              : "Search visa..."
          }
        />

        <button
          type="button"
          className="nr-admin-secondary-button"
          onClick={() =>
            setShowDeleted(
              (current) => !current,
            )
          }
        >
          {showDeleted
            ? isArabic
              ? "عرض النشطة"
              : "Show Active"
            : isArabic
              ? "سلة المحذوفات"
              : "Deleted"}
        </button>
      </div>

      {isLoading ? (
        <div className="nr-admin-empty">
          {isArabic
            ? "جارٍ تحميل التأشيرات..."
            : "Loading visas..."}
        </div>
      ) : null}

      {hasError ? (
        <div className="nr-admin-empty">
          {isArabic
            ? "تعذر تحميل التأشيرات."
            : "Unable to load visas."}
        </div>
      ) : null}

      {!isLoading &&
      !hasError &&
      filteredRows.length === 0 ? (
        <div className="nr-admin-empty">
          {isArabic
            ? "لا توجد تأشيرات حتى الآن."
            : "No visas yet."}
        </div>
      ) : null}

      {!isLoading &&
      !hasError &&
      filteredRows.length > 0 ? (
        <div className="nr-admin-table-shell">
          <table className="nr-admin-table">
            <thead>
              <tr>
                <th>
                  {isArabic
                    ? "التأشيرة"
                    : "Visa"}
                </th>
                <th>
                  {isArabic
                    ? "النوع"
                    : "Type"}
                </th>
                <th>
                  {isArabic
                    ? "المعالجة"
                    : "Processing"}
                </th>
                <th>
                  {isArabic
                    ? "المدة"
                    : "Processing Time"}
                </th>
                <th>
                  {isArabic
                    ? "السعر"
                    : "Price"}
                </th>
                <th>
                  {isArabic
                    ? "الحالة"
                    : "Status"}
                </th>
                <th>
                  {isArabic
                    ? "الإجراءات"
                    : "Actions"}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map(
                (visa) => (
                  <tr key={visa.id}>
                    <td>
                      <strong>
                        {isArabic
                          ? visa.nameAr
                          : visa.nameEn}
                      </strong>
                    </td>

                    <td>
                      {
                        visaTypes.find(
                          (option) =>
                            option.value ===
                            visa.visaType,
                        )?.[
                          isArabic
                            ? "ar"
                            : "en"
                        ]
                      }
                    </td>

                    <td>
                      {
                        processingTypes.find(
                          (option) =>
                            option.value ===
                            visa.processingType,
                        )?.[
                          isArabic
                            ? "ar"
                            : "en"
                        ]
                      }
                    </td>

                    <td>
                      {visa.processingTimeDays ??
                        "—"}
                      {visa.processingTimeDays !==
                      null
                        ? isArabic
                          ? " يوم"
                          : " days"
                        : ""}
                    </td>

                    <td>
                      {visa.basePrice !== null
                        ? `${visa.basePrice} ${visa.currencyCode ?? ""}`
                        : "—"}
                    </td>

                    <td>
                      {showDeleted ? (
                        <span className="nr-status-badge is-inactive">
                          {isArabic
                            ? "محذوف"
                            : "Deleted"}
                        </span>
                      ) : (
                        <span
                          className={`nr-status-badge ${
                            visa.isActive
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          {visa.isActive
                            ? isArabic
                              ? "نشط"
                              : "Active"
                            : isArabic
                              ? "غير نشط"
                              : "Inactive"}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="nr-admin-row-actions">
                        {showDeleted ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleRestore(
                                visa,
                              )
                            }
                          >
                            {isArabic
                              ? "استعادة"
                              : "Restore"}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(visa)
                              }
                            >
                              {isArabic
                                ? "تعديل"
                                : "Edit"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggle(
                                  visa,
                                )
                              }
                            >
                              {visa.isActive
                                ? isArabic
                                  ? "تعطيل"
                                  : "Disable"
                                : isArabic
                                  ? "تفعيل"
                                  : "Enable"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  visa,
                                )
                              }
                            >
                              {isArabic
                                ? "حذف"
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {isFormOpen ? (
        <div
          className="nr-admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="nr-admin-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="nr-admin-modal-header">
              <div>
                <h2>
                  {editingVisa
                    ? isArabic
                      ? "تعديل التأشيرة"
                      : "Edit Visa"
                    : isArabic
                      ? "إضافة تأشيرة"
                      : "Add Visa"}
                </h2>

                <p>
                  {isArabic
                    ? "أدخل معلومات التأشيرة والمتطلبات والمدد والسعر."
                    : "Enter visa information, requirements, durations and price."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form
              className="nr-country-form"
              onSubmit={
                handleSubmit
              }
            >
      {validationError && <p className="aw-error" role="alert">{validationError}</p>}

              <div className="nr-country-form-grid">
                <label>
                  <span>
                    {isArabic
                      ? "الاسم بالعربية"
                      : "Arabic Name"}
                  </span>
                  <input
                    className="nr-input"
                    value={values.nameAr}
                    onChange={(event) =>
                      updateValue(
                        "nameAr",
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "الاسم بالإنجليزية"
                      : "English Name"}
                  </span>
                  <input
                    className="nr-input"
                    value={values.nameEn}
                    onChange={(event) =>
                      updateValue(
                        "nameEn",
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "نوع التأشيرة"
                      : "Visa Type"}
                  </span>
                  <select
                    className="nr-input"
                    value={values.visaType}
                    onChange={(event) =>
                      updateValue(
                        "visaType",
                        event.target
                          .value as VisaType,
                      )
                    }
                  >
                    {visaTypes.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {isArabic
                            ? option.ar
                            : option.en}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "نوع المعالجة"
                      : "Processing Type"}
                  </span>
                  <select
                    className="nr-input"
                    value={
                      values.processingType
                    }
                    onChange={(event) =>
                      updateValue(
                        "processingType",
                        event.target
                          .value as VisaProcessingType,
                      )
                    }
                  >
                    {processingTypes.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {isArabic
                            ? option.ar
                            : option.en}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "الدولة"
                      : "Country"}
                  </span>
                  <select
                    className="nr-input"
                    value={
                      values.countryId ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "countryId",
                        event.target.value ||
                          null,
                      )
                    }
                  >
                    <option value="">
                      {isArabic
                        ? "بدون دولة محددة"
                        : "No specific country"}
                    </option>

                    {countries.map(
                      (country) => (
                        <option
                          key={country.id}
                          value={country.id}
                        >
                          {isArabic
                            ? country.nameAr
                            : country.nameEn}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "مدة المعالجة بالأيام"
                      : "Processing Days"}
                  </span>
                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    value={
                      values.processingTimeDays ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "processingTimeDays",
                        event.target.value
                          ? Math.max(
                              0,
                              Number(
                                event.target.value,
                              ) || 0,
                            )
                          : null,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "مدة الصلاحية بالأيام"
                      : "Validity Days"}
                  </span>
                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    value={
                      values.validityDays ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "validityDays",
                        event.target.value
                          ? Math.max(
                              0,
                              Number(
                                event.target.value,
                              ) || 0,
                            )
                          : null,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "الحد الأقصى للإقامة"
                      : "Max Stay Days"}
                  </span>
                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    value={
                      values.maxStayDays ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "maxStayDays",
                        event.target.value
                          ? Math.max(
                              0,
                              Number(
                                event.target.value,
                              ) || 0,
                            )
                          : null,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "السعر الأساسي"
                      : "Base Price"}
                  </span>
                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      values.basePrice ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "basePrice",
                        event.target.value
                          ? Math.max(
                              0,
                              Number(
                                event.target.value,
                              ) || 0,
                            )
                          : null,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "العملة"
                      : "Currency"}
                  </span>
                  <input
                    className="nr-input"
                    maxLength={3}
                    value={
                      values.currencyCode
                    }
                    onChange={(event) =>
                      updateValue(
                        "currencyCode",
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /[^A-Z]/g,
                            "",
                          )
                          .slice(0, 3),
                      )
                    }
                    placeholder="SAR"
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "ترتيب الظهور"
                      : "Display Order"}
                  </span>
                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    value={values.sortOrder}
                    onChange={(event) =>
                      updateValue(
                        "sortOrder",
                        Math.max(
                          0,
                          Number(
                            event.target.value,
                          ) || 0,
                        ),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "الوصف بالعربية"
                      : "Arabic Description"}
                  </span>
                  <textarea
                    className="nr-input"
                    rows={4}
                    value={
                      values.descriptionAr
                    }
                    onChange={(event) =>
                      updateValue(
                        "descriptionAr",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "الوصف بالإنجليزية"
                      : "English Description"}
                  </span>
                  <textarea
                    className="nr-input"
                    rows={4}
                    value={
                      values.descriptionEn
                    }
                    onChange={(event) =>
                      updateValue(
                        "descriptionEn",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "المتطلبات بالعربية — سطر لكل متطلب"
                      : "Arabic Requirements — one per line"}
                  </span>
                  <textarea
                    className="nr-input"
                    rows={6}
                    value={
                      values.requirementsAr.join(
                        "\n",
                      )
                    }
                    onChange={(event) =>
                      updateValue(
                        "requirementsAr",
                        parseList(
                          event.target.value,
                        ),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "المتطلبات بالإنجليزية — سطر لكل متطلب"
                      : "English Requirements — one per line"}
                  </span>
                  <textarea
                    className="nr-input"
                    rows={6}
                    value={
                      values.requirementsEn.join(
                        "\n",
                      )
                    }
                    onChange={(event) =>
                      updateValue(
                        "requirementsEn",
                        parseList(
                          event.target.value,
                        ),
                      )
                    }
                  />
                </label>
              </div>

              <label className="nr-country-form-checkbox">
                <input
                  type="checkbox"
                  checked={
                    values.isActive
                  }
                  onChange={(event) =>
                    updateValue(
                      "isActive",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  {isArabic
                    ? "التأشيرة نشطة ومتاحة للبرامج"
                    : "Visa is active and available"}
                </span>
              </label>

              <div className="nr-country-form-actions">
                <button
                  type="button"
                  className="nr-admin-secondary-button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>

                <Button
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? isArabic
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : isArabic
                      ? "حفظ التأشيرة"
                      : "Save Visa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .nr-visas-admin {
          display: grid;
          gap: 18px;
        }

        .nr-visas-admin .nr-admin-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px;
          border: 1px solid var(--nour-border);
          border-radius: 18px;
          background: var(--nour-surface);
        }

        .nr-visas-admin .nr-admin-page-header h1 {
          margin: 6px 0 8px;
          color: var(--nour-text-primary);
          font-size: 26px;
        }

        .nr-visas-admin .nr-admin-page-header p {
          margin: 0;
          color: #7c899c;
          font-size: 12px;
          line-height: 1.8;
        }

        .nr-visas-admin .nr-admin-kicker {
          color: var(--nour-primary);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-visas-admin .nr-admin-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
        }

        .nr-visas-admin .nr-admin-table-shell {
          overflow-x: auto;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-surface);
        }

        .nr-visas-admin .nr-admin-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .nr-visas-admin .nr-admin-table th,
        .nr-visas-admin .nr-admin-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--nour-border);
          text-align: start;
          vertical-align: middle;
        }

        .nr-visas-admin .nr-admin-table th {
          color: #6f7e92;
          background: var(--nour-background);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-visas-admin .nr-admin-table td {
          color: var(--nour-text-primary);
          font-size: 11px;
        }

        .nr-visas-admin .nr-admin-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .nr-visas-admin .nr-admin-row-actions button {
          min-height: 30px;
          padding-inline: 9px;
          border: 1px solid var(--nour-border);
          border-radius: 8px;
          color: var(--nour-text-primary);
          background: var(--nour-background);
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-visas-admin .nr-admin-empty {
          padding: 26px;
          border: 1px dashed var(--nour-border);
          border-radius: 15px;
          color: #7c899c;
          background: var(--nour-surface);
          text-align: center;
        }

        .nr-visas-admin .nr-admin-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(3, 13, 27, 0.66);
          backdrop-filter: blur(4px);
        }

        .nr-visas-admin .nr-admin-modal {
          width: min(900px, 100%);
          max-height: 88vh;
          overflow: auto;
          border: 1px solid var(--nour-border);
          border-radius: 20px;
          background: var(--nour-surface);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.24);
        }

        .nr-visas-admin .nr-admin-modal-header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 22px;
          border-bottom: 1px solid var(--nour-border);
          background: var(--nour-surface);
        }

        .nr-visas-admin .nr-admin-modal-header h2 {
          margin: 0 0 6px;
          color: var(--nour-text-primary);
          font-size: 20px;
        }

        .nr-visas-admin .nr-admin-modal-header p {
          margin: 0;
          color: #7c899c;
          font-size: 11px;
        }

        .nr-visas-admin .nr-admin-modal-header > button {
          width: 34px;
          height: 34px;
          border: 1px solid var(--nour-border);
          border-radius: 10px;
          color: #6f7e92;
          background: var(--nour-background);
          font: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        .nr-visas-admin .nr-admin-modal .nr-country-form {
          padding: 22px;
        }

        @media (max-width: 720px) {
          .nr-visas-admin .nr-admin-page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .nr-visas-admin .nr-admin-toolbar {
            grid-template-columns: 1fr;
          }

          .nr-visas-admin .nr-admin-modal-backdrop {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
}
