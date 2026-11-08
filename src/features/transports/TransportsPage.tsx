"use client";
import {useUnsaved,serializeDraft} from "../admin-workspace/useUnsaved";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "../../components/ui/Button";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";

import type {
  Transport,
  TransportFormValues,
  TransportMode,
  TransportServiceType,
  TransportVehicleType,
} from "./types/transport";

import {
  deleteTransport,
  listDeletedTransports,
  listTransports,
  restoreDeletedTransport,
  saveNewTransport,
  saveTransportChanges,
  setTransportActive,
  transportsQueryKey,
  deletedTransportsQueryKey,
} from "./services/transports.service";

const initialValues: TransportFormValues = {
  nameAr: "",
  nameEn: "",
  providerNameAr: "",
  providerNameEn: "",
  serviceType: "other",
  mode: "private",
  vehicleType: "van",
  vehicleNameAr: "",
  vehicleNameEn: "",
  capacity: 1,
  luggageCapacity: null,
  descriptionAr: "",
  descriptionEn: "",
  amenitiesAr: [],
  amenitiesEn: [],
  coverMediaId: null,
  isActive: true,
  sortOrder: 0,
};

const serviceTypes: Array<{
  value: TransportServiceType;
  ar: string;
  en: string;
}> = [
  { value: "airport_hotel", ar: "مطار → فندق", en: "Airport → Hotel" },
  { value: "hotel_airport", ar: "فندق → مطار", en: "Hotel → Airport" },
  { value: "hotel_hotel", ar: "فندق → فندق", en: "Hotel → Hotel" },
  { value: "hotel_haram", ar: "فندق → الحرم", en: "Hotel → Haram" },
  { value: "haram_hotel", ar: "الحرم → فندق", en: "Haram → Hotel" },
  { value: "intercity", ar: "بين المدن", en: "Intercity" },
  { value: "ziyarat", ar: "زيارات", en: "Ziyarat" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const vehicleTypes: Array<{
  value: TransportVehicleType;
  ar: string;
  en: string;
}> = [
  { value: "sedan", ar: "سيدان", en: "Sedan" },
  { value: "suv", ar: "دفع رباعي", en: "SUV" },
  { value: "van", ar: "فان", en: "Van" },
  { value: "minibus", ar: "ميني باص", en: "Minibus" },
  { value: "bus", ar: "حافلة", en: "Bus" },
  { value: "coach", ar: "حافلة سياحية", en: "Coach" },
  { value: "other", ar: "أخرى", en: "Other" },
];

function toFormValues(
  transport: Transport,
): TransportFormValues {
  return {
    nameAr: transport.nameAr,
    nameEn: transport.nameEn,
    providerNameAr: transport.providerNameAr ?? "",
    providerNameEn: transport.providerNameEn ?? "",
    serviceType: transport.serviceType,
    mode: transport.mode,
    vehicleType: transport.vehicleType,
    vehicleNameAr: transport.vehicleNameAr ?? "",
    vehicleNameEn: transport.vehicleNameEn ?? "",
    capacity: transport.capacity,
    luggageCapacity: transport.luggageCapacity,
    descriptionAr: transport.descriptionAr ?? "",
    descriptionEn: transport.descriptionEn ?? "",
    amenitiesAr: transport.amenitiesAr ?? [],
    amenitiesEn: transport.amenitiesEn ?? [],
    coverMediaId: transport.coverMediaId ?? null,
    isActive: transport.isActive,
    sortOrder: transport.sortOrder,
  };
}

export default function TransportsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editingTransport, setEditingTransport] =
    useState<Transport | null>(null);
  const [showDeleted, setShowDeleted] =
    useState(false);
  const [isFormOpen, setIsFormOpen] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);

  const [values, setValues] =
    useState<TransportFormValues>(
      initialValues,
    );

  const transportsQuery = useQuery({
    queryKey: transportsQueryKey,
    queryFn: () =>
      listTransports(supabase),
  });

  const deletedQuery = useQuery({
    queryKey:
      deletedTransportsQueryKey,
    queryFn: () =>
      listDeletedTransports(supabase),
    enabled: showDeleted,
  });

  const currentRows =
    showDeleted
      ? deletedQuery.data ?? []
      : transportsQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const normalized =
      search.trim().toLowerCase();

    if (!normalized) {
      return currentRows;
    }

    return currentRows.filter(
      (transport) =>
        transport.nameAr
          .toLowerCase()
          .includes(normalized) ||
        transport.nameEn
          .toLowerCase()
          .includes(normalized) ||
        (
          transport.providerNameAr ??
          ""
        )
          .toLowerCase()
          .includes(normalized) ||
        (
          transport.providerNameEn ??
          ""
        )
          .toLowerCase()
          .includes(normalized),
    );
  }, [currentRows, search]);

  const [formBaseline,setFormBaseline]=useState(()=>serializeDraft(initialValues));
  useUnsaved(isFormOpen && serializeDraft(values)!==formBaseline, isArabic ? 'لديك تعديلات غير محفوظة. هل تريد المغادرة؟' : 'Unsaved changes. Leave?');
  const [validationError,setValidationError]=useState('');
  function updateValue<
    K extends keyof TransportFormValues,
  >(
    key: K,
    value: TransportFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingTransport(null);
    setValues(initialValues);
    setIsFormOpen(true);
  }

  function openEdit(
    transport: Transport,
  ) {
    setEditingTransport(transport);
    setValues(
      toFormValues(transport),
    );
    setIsFormOpen(true);
  }

  function closeForm() {
    if(serializeDraft(values)!==formBaseline && !window.confirm(isArabic ? 'تجاهل التعديلات غير المحفوظة؟' : 'Unsaved changes. Close?'))return;
    if (isSaving) return;

    setEditingTransport(null);
    setValues(initialValues);
    setIsFormOpen(false);
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          transportsQueryKey,
      }),
      queryClient.invalidateQueries({
        queryKey:
          deletedTransportsQueryKey,
      }),
    ]);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
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
          ? "أدخل اسم خدمة النقل بالعربية والإنجليزية."
          : "Enter the transport name in Arabic and English.",
      );
      return;
    }

    if (values.capacity < 1) {
      setValidationError(
        isArabic
          ? "يجب أن تكون سعة المركبة راكبًا واحدًا على الأقل."
          : "Vehicle capacity must be at least one passenger.",
      );
      return;
    }

    setIsSaving(true);

    try {
      if (editingTransport) {
        await saveTransportChanges(
          supabase,
          editingTransport.id,
          values,
        );
      } else {
        await saveNewTransport(
          supabase,
          values,
        );
      }

      await refresh();
      setIsFormOpen(false);setEditingTransport(null);setValues(initialValues);setFormBaseline(serializeDraft(initialValues));
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر حفظ خدمة النقل."
          : "Unable to save the transport service.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(
    transport: Transport,
  ) {
    try {
      await setTransportActive(
        supabase,
        transport.id,
        !transport.isActive,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر تحديث حالة النقل."
          : "Unable to update transport status.",
      );
    }
  }

  async function handleDelete(
    transport: Transport,
  ) {
    const approved =
      window.confirm(
        isArabic
          ? `هل تريد حذف "${transport.nameAr}"؟`
          : `Delete "${transport.nameEn}"?`,
      );

    if (!approved) return;

    try {
      await deleteTransport(
        supabase,
        transport.id,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر حذف خدمة النقل."
          : "Unable to delete the transport service.",
      );
    }
  }

  async function handleRestore(
    transport: Transport,
  ) {
    try {
      await restoreDeletedTransport(
        supabase,
        transport.id,
      );

      await refresh();
    } catch (error) {
      console.error(error);

      setValidationError(
        isArabic
          ? "تعذر استعادة خدمة النقل."
          : "Unable to restore the transport service.",
      );
    }
  }

  const isLoading =
    showDeleted
      ? deletedQuery.isLoading
      : transportsQuery.isLoading;

  const hasError =
    showDeleted
      ? deletedQuery.isError
      : transportsQuery.isError;

  return (
    <div className="nr-admin-page nr-transports-admin">
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
              ? "النقل والمواصلات"
              : "Transport"}
          </h1>

          <p>
            {isArabic
              ? "أنشئ خدمات النقل والمركبات ثم اربطها ببرامج العمرة."
              : "Create transport services and vehicles, then link them to Umrah programs."}
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreate}
        >
          {isArabic
            ? "+ إضافة خدمة نقل"
            : "+ Add Transport"}
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
              ? "ابحث باسم الخدمة أو مقدم النقل..."
              : "Search service or provider..."
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
            ? "جارٍ تحميل خدمات النقل..."
            : "Loading transport services..."}
        </div>
      ) : null}

      {hasError ? (
        <div className="nr-admin-empty">
          {isArabic
            ? "تعذر تحميل خدمات النقل."
            : "Unable to load transport services."}
        </div>
      ) : null}

      {!isLoading &&
      !hasError &&
      filteredRows.length === 0 ? (
        <div className="nr-admin-empty">
          {isArabic
            ? "لا توجد خدمات نقل حتى الآن."
            : "No transport services yet."}
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
                    ? "الخدمة"
                    : "Service"}
                </th>

                <th>
                  {isArabic
                    ? "النوع"
                    : "Type"}
                </th>

                <th>
                  {isArabic
                    ? "المركبة"
                    : "Vehicle"}
                </th>

                <th>
                  {isArabic
                    ? "السعة"
                    : "Capacity"}
                </th>

                <th>
                  {isArabic
                    ? "النمط"
                    : "Mode"}
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
                (transport) => (
                  <tr key={transport.id}>
                    <td data-label={isArabic ? "الخدمة" : "Service"}>
                      <strong>
                        {isArabic
                          ? transport.nameAr
                          : transport.nameEn}
                      </strong>

                      <small
                        style={{
                          display:
                            "block",
                        }}
                      >
                        {isArabic
                          ? transport.providerNameAr
                          : transport.providerNameEn}
                      </small>
                    </td>

                    <td data-label={isArabic ? "النوع" : "Type"}>
                      {
                        serviceTypes.find(
                          (option) =>
                            option.value ===
                            transport.serviceType,
                        )?.[
                          isArabic
                            ? "ar"
                            : "en"
                        ]
                      }
                    </td>

                    <td data-label={isArabic ? "المركبة" : "Vehicle"}>
                      {isArabic
                        ? transport.vehicleNameAr ||
                          transport.vehicleType
                        : transport.vehicleNameEn ||
                          transport.vehicleType}
                    </td>

                    <td data-label={isArabic ? "السعة" : "Capacity"}>
                      {transport.capacity}
                    </td>

                    <td data-label={isArabic ? "النمط" : "Mode"}>
                      {transport.mode ===
                      "private"
                        ? isArabic
                          ? "خاص"
                          : "Private"
                        : isArabic
                          ? "مشترك"
                          : "Shared"}
                    </td>

                    <td data-label={isArabic ? "الحالة" : "Status"}>
                      {showDeleted ? (
                        <span className="nr-status-badge is-inactive">
                          {isArabic
                            ? "محذوف"
                            : "Deleted"}
                        </span>
                      ) : (
                        <span
                          className={`nr-status-badge ${
                            transport.isActive
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          {transport.isActive
                            ? isArabic
                              ? "نشط"
                              : "Active"
                            : isArabic
                              ? "غير نشط"
                              : "Inactive"}
                        </span>
                      )}
                    </td>

                    <td data-label={isArabic ? "الإجراءات" : "Actions"}>
                      <div className="nr-admin-row-actions">
                        {showDeleted ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleRestore(
                                transport,
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
                                openEdit(
                                  transport,
                                )
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
                                  transport,
                                )
                              }
                            >
                              {transport.isActive
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
                                  transport,
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
            aria-label={
              editingTransport
                ? isArabic
                  ? "تعديل خدمة النقل"
                  : "Edit Transport"
                : isArabic
                  ? "إضافة خدمة نقل"
                  : "Add Transport"
            }
          >
            <div className="nr-admin-modal-header">
              <div>
                <h2>
                  {editingTransport
                    ? isArabic
                      ? "تعديل خدمة النقل"
                      : "Edit Transport"
                    : isArabic
                      ? "إضافة خدمة نقل"
                      : "Add Transport"}
                </h2>

                <p>
                  {isArabic
                    ? "أدخل معلومات الخدمة والمركبة والسعة."
                    : "Enter service, vehicle and capacity information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label={
                  isArabic
                    ? "إغلاق"
                    : "Close"
                }
              >
                ×
              </button>
            </div>

            <form
              className="nr-country-form"
              onSubmit={handleSubmit}
            >
      {validationError && <p className="aw-error" role="alert">{validationError}</p>}

              <div className="nr-country-form-grid">
                <label>
                  <span>
                    {isArabic
                      ? "اسم الخدمة بالعربية"
                      : "Arabic Service Name"}
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
                      ? "اسم الخدمة بالإنجليزية"
                      : "English Service Name"}
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
                      ? "مقدم الخدمة بالعربية"
                      : "Provider Arabic"}
                  </span>

                  <input
                    className="nr-input"
                    value={
                      values.providerNameAr
                    }
                    onChange={(event) =>
                      updateValue(
                        "providerNameAr",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "مقدم الخدمة بالإنجليزية"
                      : "Provider English"}
                  </span>

                  <input
                    className="nr-input"
                    value={
                      values.providerNameEn
                    }
                    onChange={(event) =>
                      updateValue(
                        "providerNameEn",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "نوع خدمة النقل"
                      : "Transport Type"}
                  </span>

                  <select
                    className="nr-input"
                    value={
                      values.serviceType
                    }
                    onChange={(event) =>
                      updateValue(
                        "serviceType",
                        event.target
                          .value as TransportServiceType,
                      )
                    }
                  >
                    {serviceTypes.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
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
                      ? "نوع الاستخدام"
                      : "Mode"}
                  </span>

                  <select
                    className="nr-input"
                    value={values.mode}
                    onChange={(event) =>
                      updateValue(
                        "mode",
                        event.target
                          .value as TransportMode,
                      )
                    }
                  >
                    <option value="private">
                      {isArabic
                        ? "خاص"
                        : "Private"}
                    </option>

                    <option value="shared">
                      {isArabic
                        ? "مشترك"
                        : "Shared"}
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "نوع المركبة"
                      : "Vehicle Type"}
                  </span>

                  <select
                    className="nr-input"
                    value={
                      values.vehicleType
                    }
                    onChange={(event) =>
                      updateValue(
                        "vehicleType",
                        event.target
                          .value as TransportVehicleType,
                      )
                    }
                  >
                    {vehicleTypes.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
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
                      ? "اسم المركبة بالعربية"
                      : "Vehicle Name Arabic"}
                  </span>

                  <input
                    className="nr-input"
                    value={
                      values.vehicleNameAr
                    }
                    onChange={(event) =>
                      updateValue(
                        "vehicleNameAr",
                        event.target.value,
                      )
                    }
                    placeholder={
                      isArabic
                        ? "تويوتا هايس"
                        : "Toyota Hiace"
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "اسم المركبة بالإنجليزية"
                      : "Vehicle Name English"}
                  </span>

                  <input
                    className="nr-input"
                    value={
                      values.vehicleNameEn
                    }
                    onChange={(event) =>
                      updateValue(
                        "vehicleNameEn",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "سعة الركاب"
                      : "Passenger Capacity"}
                  </span>

                  <input
                    className="nr-input"
                    type="number"
                    min={1}
                    value={values.capacity}
                    onChange={(event) =>
                      updateValue(
                        "capacity",
                        Math.max(
                          1,
                          Number(
                            event.target.value,
                          ) || 1,
                        ),
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    {isArabic
                      ? "سعة الأمتعة"
                      : "Luggage Capacity"}
                  </span>

                  <input
                    className="nr-input"
                    type="number"
                    min={0}
                    value={
                      values.luggageCapacity ??
                      ""
                    }
                    onChange={(event) =>
                      updateValue(
                        "luggageCapacity",
                        event.target.value
                          ? Math.max(
                              0,
                              Number(
                                event.target
                                  .value,
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
              </div>

              <label className="nr-country-form-checkbox">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    updateValue(
                      "isActive",
                      event.target.checked,
                    )
                  }
                />

                <span>
                  {isArabic
                    ? "الخدمة نشطة ومتاحة للبرامج"
                    : "Service is active and available"}
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
                      ? "حفظ خدمة النقل"
                      : "Save Transport"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .nr-transports-admin {
          display: grid;
          gap: 18px;
        }

        .nr-transports-admin .nr-admin-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px;
          border: 1px solid var(--nour-border);
          border-radius: 18px;
          background: var(--nour-surface);
        }

        .nr-transports-admin .nr-admin-page-header h1 {
          margin: 6px 0 8px;
          color: var(--nour-text-primary);
          font-size: 26px;
        }

        .nr-transports-admin .nr-admin-page-header p {
          margin: 0;
          color: #7c899c;
          font-size: 12px;
          line-height: 1.8;
        }

        .nr-transports-admin .nr-admin-kicker {
          color: var(--nour-primary);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-transports-admin .nr-admin-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .nr-transports-admin .nr-admin-toolbar .nr-input {
          min-height: 44px;
        }

        .nr-transports-admin .nr-admin-secondary-button {
          min-height: 42px;
          padding-inline: 14px;
          border: 1px solid var(--nour-border);
          border-radius: 11px;
          color: var(--nour-text-primary);
          background: var(--nour-surface);
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-transports-admin .nr-admin-table-shell {
          overflow: hidden;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-surface);
          box-shadow: 0 14px 40px rgba(12, 33, 61, 0.05);
        }

        .nr-transports-admin .nr-admin-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .nr-transports-admin .nr-admin-table th,
        .nr-transports-admin .nr-admin-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--nour-border);
          vertical-align: middle;
          text-align: start;
          word-break: break-word;
        }

        .nr-transports-admin .nr-admin-table th {
          color: #6f7e92;
          background: var(--nour-background);
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nr-transports-admin .nr-admin-table td {
          color: var(--nour-text-primary);
          font-size: 11px;
        }

        .nr-transports-admin .nr-admin-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .nr-transports-admin .nr-admin-table tbody tr:hover {
          background: rgba(23, 111, 232, 0.025);
        }

        .nr-transports-admin .nr-admin-table td strong {
          display: block;
          font-size: 12px;
          line-height: 1.5;
        }

        .nr-transports-admin .nr-admin-table td small {
          margin-top: 4px;
          color: #8794a6;
          font-size: 9px;
        }

        .nr-transports-admin .nr-status-badge {
          display: inline-flex;
          min-height: 27px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .nr-transports-admin .nr-status-badge.is-active {
          color: #047857;
          background: rgba(16, 185, 129, 0.10);
        }

        .nr-transports-admin .nr-status-badge.is-inactive {
          color: #b45309;
          background: rgba(245, 158, 11, 0.10);
        }

        .nr-transports-admin .nr-admin-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .nr-transports-admin .nr-admin-row-actions button {
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

        .nr-transports-admin .nr-admin-row-actions button:hover {
          border-color: rgba(23, 111, 232, 0.28);
          color: var(--nour-primary);
          background: rgba(23, 111, 232, 0.05);
        }

        .nr-transports-admin .nr-admin-empty {
          padding: 26px;
          border: 1px dashed var(--nour-border);
          border-radius: 15px;
          color: #7c899c;
          background: var(--nour-surface);
          text-align: center;
        }

        .nr-transports-admin .nr-admin-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(3, 13, 27, 0.66);
          backdrop-filter: blur(4px);
        }

        .nr-transports-admin .nr-admin-modal {
          width: min(860px, 100%);
          max-height: min(88vh, 900px);
          overflow: auto;
          border: 1px solid var(--nour-border);
          border-radius: 20px;
          background: var(--nour-surface);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.24);
        }

        .nr-transports-admin .nr-admin-modal-header {
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

        .nr-transports-admin .nr-admin-modal-header h2 {
          margin: 0 0 6px;
          color: var(--nour-text-primary);
          font-size: 20px;
        }

        .nr-transports-admin .nr-admin-modal-header p {
          margin: 0;
          color: #7c899c;
          font-size: 11px;
        }

        .nr-transports-admin .nr-admin-modal-header > button {
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

        .nr-transports-admin .nr-admin-modal .nr-country-form {
          padding: 22px;
        }

        @media (max-width: 1000px) {
          .nr-transports-admin .nr-admin-table-shell {
            overflow-x: auto;
          }

          .nr-transports-admin .nr-admin-table {
            min-width: 920px;
          }
        }

        @media (max-width: 720px) {
          .nr-transports-admin .nr-admin-page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .nr-transports-admin .nr-admin-toolbar {
            grid-template-columns: 1fr;
          }

          .nr-transports-admin .nr-admin-modal-backdrop {
            padding: 10px;
          }

          .nr-transports-admin .nr-admin-modal {
            max-height: 94vh;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
