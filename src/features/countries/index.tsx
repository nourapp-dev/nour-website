"use client";
import { marketStates, publicationStates, marketLabel } from "./directory";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "../../components/ui/Button";
import { ConfirmDialog } from "../../core/dialogs";
import { usePersistentState } from "../../core/hooks";
import { getAdminTranslations, useLanguage } from "../../core/i18n";
import { useToast } from "../../core/notifications";
import { Pagination } from "../../core/pagination";
import { ErrorState, TableSkeleton } from "../../core/states";
import { createClient } from "../../lib/supabase/client";

import CountryForm, { type CountryFormValues } from "./forms/CountryForm";
import {
  countriesQuery,
  countriesQueryKey,
  createCountry,
  deletedCountriesQuery,
  deletedCountriesQueryKey,
  restoreCountry,
  softDeleteCountry,
  updateCountry,
  updateCountryStatus,
} from "./services";
import CountriesTable from "./tables/CountriesTable";
import type { Country } from "./types";

export default function CountriesPage() {
  const [marketFilter, setMarketFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePersistentState<number>(
    "countries-page-size",
    10,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deletingCountry, setDeletingCountry] = useState<Country | null>(null);
  const [formError, setFormError] = useState("");

  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const t = getAdminTranslations(language);
  const isArabic = language === "ar";

  const {
    data: permissions,
    isLoading: isPermissionsLoading,
    isError: isPermissionsError,
  } = useQuery({
    queryKey: ["countries", "permissions"],
    queryFn: async () => {
      const permissionKeys = [
        "countries.create",
        "countries.update",
        "countries.publish",
        "countries.delete",
        "countries.archive",
      ] as const;

      const results = await Promise.all(
        permissionKeys.map(async (permissionKey) => {
          const { data, error } = await supabase.rpc(
            "current_user_has_permission",
            {
              permission_code: permissionKey,
            },
          );

          if (error) {
            throw error;
          }

          return [permissionKey, Boolean(data)] as const;
        }),
      );

      return Object.fromEntries(results) as Record<
        (typeof permissionKeys)[number],
        boolean
      >;
    },
    staleTime: 5 * 60 * 1000,
  });

  const canCreate = permissions?.["countries.create"] ?? false;
  const canUpdate = permissions?.["countries.update"] ?? false;
  const canPublish = permissions?.["countries.publish"] ?? false;
  const canDelete = permissions?.["countries.delete"] ?? false;
  const canArchive = permissions?.["countries.archive"] ?? false;

  const {
    data: countries = [],
    isLoading,
    isError,
    error,
  } = useQuery(countriesQuery(supabase));

  const {
    data: deletedCountries = [],
    isLoading: isDeletedCountriesLoading,
    isError: isDeletedCountriesError,
  } = useQuery({
    ...deletedCountriesQuery(supabase),
    enabled: isRecycleBinOpen && canArchive,
  });

  const createMutation = useMutation({
    mutationFn: (values: CountryFormValues) => createCountry(supabase, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "country-relation-counts"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public"] });
      await queryClient.invalidateQueries({
        queryKey: countriesQueryKey,
      });
      setIsCreateOpen(false);
      setFormError("");
      showToast({
        title: isArabic
          ? "تمت إضافة الدولة بنجاح"
          : "Country added successfully",
        variant: "success",
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : isArabic
            ? "تعذر إضافة الدولة."
            : "Unable to add the country.";
      setFormError(message);
      showToast({
        title: isArabic ? "تعذر إضافة الدولة" : "Unable to add country",
        description: message,
        variant: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      country,
      values,
    }: {
      country: Country;
      values: CountryFormValues;
    }) => updateCountry(supabase, country.id, values, country.flagMediaId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "country-relation-counts"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public"] });
      await queryClient.invalidateQueries({
        queryKey: countriesQueryKey,
      });
      setEditingCountry(null);
      setFormError("");
      showToast({
        title: isArabic
          ? "تم تعديل الدولة بنجاح"
          : "Country updated successfully",
        variant: "success",
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : isArabic
            ? "تعذر تعديل الدولة."
            : "Unable to update the country.";
      setFormError(message);
      showToast({
        title: isArabic ? "تعذر تعديل الدولة" : "Unable to update country",
        description: message,
        variant: "error",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (country: Country) =>
      updateCountryStatus(supabase, country.id, country.status !== "active"),
    onSuccess: async (_, country) => {
      await queryClient.invalidateQueries({
        queryKey: countriesQueryKey,
      });
      showToast({
        title:
          country.status === "active"
            ? isArabic
              ? "تم تعطيل الدولة"
              : "Country disabled"
            : isArabic
              ? "تم تفعيل الدولة"
              : "Country enabled",
        variant: "success",
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : isArabic
            ? "تعذر تغيير حالة الدولة."
            : "Unable to change country status.";
      showToast({
        title: isArabic
          ? "تعذر تغيير حالة الدولة"
          : "Unable to change country status",
        description: message,
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (countryId: string) => softDeleteCountry(supabase, countryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "country-relation-counts"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public"] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: countriesQueryKey }),
        queryClient.invalidateQueries({ queryKey: deletedCountriesQueryKey }),
      ]);
      setFormError("");
      setDeletingCountry(null);
      showToast({
        title: isArabic
          ? "تم حذف الدولة بنجاح"
          : "Country deleted successfully",
        variant: "success",
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : isArabic
            ? "تعذر حذف الدولة."
            : "Unable to delete the country.";
      setFormError(message);
      showToast({
        title: isArabic ? "تعذر حذف الدولة" : "Unable to delete country",
        description: message,
        variant: "error",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (countryId: string) => restoreCountry(supabase, countryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "country-relation-counts"],
      });
      await queryClient.invalidateQueries({ queryKey: ["public"] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: countriesQueryKey }),
        queryClient.invalidateQueries({ queryKey: deletedCountriesQueryKey }),
      ]);
      showToast({
        title: isArabic
          ? "تمت استعادة الدولة بنجاح"
          : "Country restored successfully",
        variant: "success",
      });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : isArabic
            ? "تعذر استعادة الدولة."
            : "Unable to restore the country.";
      showToast({
        title: isArabic ? "تعذر استعادة الدولة" : "Unable to restore country",
        description: message,
        variant: "error",
      });
    },
  });

  const filteredCountries = useMemo(() => {
    const rawSearch = searchValue.trim();
    const normalizedSearch = rawSearch.toLowerCase();
    const scopedCountries = countries.filter(
      (country) =>
        (!marketFilter || country.marketStatus === marketFilter) &&
        (!publicationFilter || country.publicationStatus === publicationFilter),
    );
    if (!normalizedSearch) return scopedCountries;
    return scopedCountries.filter(
      (country) =>
        country.nameAr.includes(rawSearch) ||
        country.nameEn.toLowerCase().includes(normalizedSearch) ||
        country.iso2.toLowerCase().includes(normalizedSearch) ||
        country.iso3.toLowerCase().includes(normalizedSearch) ||
        country.phoneCode.toLowerCase().includes(normalizedSearch) ||
        country.currencyCode.toLowerCase().includes(normalizedSearch),
    );
  }, [countries, searchValue, marketFilter, publicationFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCountries.length / pageSize),
  );

  const paginatedCountries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCountries.slice(startIndex, startIndex + pageSize);
  }, [filteredCountries, currentPage, pageSize]);

  function openCreateDialog() {
    if (!canCreate) return;

    setFormError("");
    setEditingCountry(null);
    setDeletingCountry(null);
    setIsCreateOpen(true);
  }

  function closeCreateDialog() {
    if (createMutation.isPending) return;
    setFormError("");
    setIsCreateOpen(false);
  }

  function openEditDialog(country: Country) {
    if (!canUpdate) return;

    setFormError("");
    setIsCreateOpen(false);
    setDeletingCountry(null);
    setEditingCountry(country);
  }

  function closeEditDialog() {
    if (updateMutation.isPending) return;
    setFormError("");
    setEditingCountry(null);
  }

  function openDeleteDialog(country: Country) {
    if (!canDelete) return;

    setFormError("");
    setIsCreateOpen(false);
    setEditingCountry(null);
    setDeletingCountry(country);
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return;
    setFormError("");
    setDeletingCountry(null);
  }

  async function handleCreateCountry(values: CountryFormValues) {
    setFormError("");
    await createMutation.mutateAsync(values);
  }

  return (
    <section className="nr-dashboard">
      <div className="nr-dashboard-heading">
        <div>
          <span className="nr-dashboard-kicker">
            {isArabic ? "إدارة المحتوى" : "Content Management"}
          </span>
          <h1>{t.countries.pageTitle}</h1>
          <p>{t.countries.pageDescription}</p>
        </div>

        {canArchive || canCreate ? (
          <div className="nr-country-heading-actions">
            {canArchive ? (
              <button
                type="button"
                className="nr-secondary-button"
                onClick={() => setIsRecycleBinOpen(true)}
              >
                {t.countries.recycleBin}
                {deletedCountries.length > 0
                  ? ` (${deletedCountries.length})`
                  : ""}
              </button>
            ) : null}

            {canCreate ? (
              <Button type="button" onClick={openCreateDialog}>
                {t.countries.addCountry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {formError && !isCreateOpen && !editingCountry && !deletingCountry ? (
        <p className="nr-admin-login-error">{formError}</p>
      ) : null}

      {isPermissionsLoading || isLoading ? (
        <TableSkeleton
          rows={6}
          columns={canUpdate || canPublish || canDelete ? 7 : 6}
        />
      ) : isPermissionsError ? (
        <ErrorState
          title={
            isArabic
              ? "تعذر تحميل صلاحيات الدول"
              : "Unable to load country permissions"
          }
          description={
            isArabic
              ? "تعذر التحقق من صلاحيات حسابك. أعد تحميل الصفحة."
              : "Your account permissions could not be verified. Reload the page."
          }
          onRetry={() => {
            void queryClient.invalidateQueries({
              queryKey: ["countries", "permissions"],
            });
          }}
        />
      ) : isError ? (
        <ErrorState
          title={isArabic ? "تعذر تحميل الدول" : "Unable to load countries"}
          description={
            error instanceof Error
              ? error.message
              : isArabic
                ? "حدث خطأ غير معروف."
                : "An unknown error occurred."
          }
          onRetry={() => {
            void queryClient.invalidateQueries({
              queryKey: countriesQueryKey,
            });
          }}
        />
      ) : (
        <>
          <div className="aw-filters">
            <label>
              {isArabic ? "حالة السوق" : "Market status"}
              <select
                value={marketFilter}
                onChange={(event) => {
                  setMarketFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{isArabic ? "الكل" : "All"}</option>
                {marketStates.map((state) => (
                  <option value={state} key={state}>
                    {marketLabel(state, language)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {isArabic ? "حالة النشر" : "Publication"}
              <select
                value={publicationFilter}
                onChange={(event) => {
                  setPublicationFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{isArabic ? "الكل" : "All"}</option>
                {publicationStates.map((state) => (
                  <option value={state} key={state}>
                    {marketLabel(state, language)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <CountriesTable
            countries={paginatedCountries}
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);
              setCurrentPage(1);
            }}
            onEdit={openEditDialog}
            onToggleStatus={(country) => {
              setFormError("");
              statusMutation.mutate(country);
            }}
            onDelete={openDeleteDialog}
            canUpdate={canUpdate}
            canPublish={canPublish}
            canDelete={canDelete}
            isStatusUpdating={statusMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newPageSize: number) => {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      {isCreateOpen && canCreate ? (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onMouseDown={closeCreateDialog}
        >
          <section
            className="nr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-country-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="nr-modal-header">
              <div>
                <span className="nr-dashboard-kicker">
                  {isArabic ? "إدارة الدول" : "Country Management"}
                </span>
                <h2 id="create-country-title">{t.countries.addCountry}</h2>
                <p>
                  {isArabic
                    ? "أدخل بيانات الدولة الأساسية ثم اضغط حفظ."
                    : "Enter the country details, then select Save."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                onClick={closeCreateDialog}
                aria-label={isArabic ? "إغلاق النافذة" : "Close dialog"}
                disabled={createMutation.isPending}
              >
                ×
              </button>
            </div>

            {formError ? (
              <p className="nr-admin-login-error">{formError}</p>
            ) : null}

            <CountryForm
              canPublish={canPublish}
              onSubmit={handleCreateCountry}
              isSubmitting={createMutation.isPending}
            />
          </section>
        </div>
      ) : null}

      {editingCountry && canUpdate ? (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onMouseDown={closeEditDialog}
        >
          <section
            className="nr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-country-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="nr-modal-header">
              <div>
                <span className="nr-dashboard-kicker">
                  {isArabic ? "إدارة الدول" : "Country Management"}
                </span>
                <h2 id="edit-country-title">
                  {isArabic ? "تعديل الدولة" : "Edit Country"}
                </h2>
                <p>
                  {isArabic
                    ? "عدّل بيانات الدولة ثم اضغط حفظ التغييرات."
                    : "Update the country details, then save your changes."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                onClick={closeEditDialog}
                aria-label={isArabic ? "إغلاق النافذة" : "Close dialog"}
                disabled={updateMutation.isPending}
              >
                ×
              </button>
            </div>

            {formError ? (
              <p className="nr-admin-login-error">{formError}</p>
            ) : null}

            <CountryForm
              key={`${editingCountry.id}-${editingCountry.updatedAt}`}
              canPublish={canPublish}
              initialValues={{
                marketStatus: editingCountry.marketStatus ?? null,
                publicationStatus: editingCountry.publicationStatus ?? null,
                showPublic: editingCountry.showPublic ?? null,
                showOnMap: editingCountry.showOnMap ?? null,
                statusLabelAr: editingCountry.statusLabelAr ?? "",
                statusLabelEn: editingCountry.statusLabelEn ?? "",
                phoneCodes: editingCountry.phoneCodes ?? [],
                currencyCodes: editingCountry.currencyCodes ?? [],
                timezones: editingCountry.timezones ?? [],
                directorySource: editingCountry.directorySource ?? "",
                flagEmoji: editingCountry.flagEmoji ?? "",
                nameAr: editingCountry.nameAr,
                nameEn: editingCountry.nameEn,
                iso2: editingCountry.iso2,
                iso3: editingCountry.iso3,
                phoneCode: editingCountry.phoneCode,
                currencyCode: editingCountry.currencyCode,
                currencyNameAr: editingCountry.currencyNameAr,
                currencyNameEn: editingCountry.currencyNameEn,
                timezone: editingCountry.timezone,

                latitude: editingCountry.latitude,
                longitude: editingCountry.longitude,

                sortOrder: editingCountry.sortOrder,
                isActive: editingCountry.status === "active",
              }}
              isSubmitting={updateMutation.isPending}
              onSubmit={async (values) => {
                setFormError("");

                await updateMutation.mutateAsync({
                  country: editingCountry,
                  values,
                });
              }}
            />
          </section>
        </div>
      ) : null}

      {isRecycleBinOpen && canArchive ? (
        <div
          className="nr-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            if (!restoreMutation.isPending) {
              setIsRecycleBinOpen(false);
            }
          }}
        >
          <section
            className="nr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recycle-bin-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="nr-modal-header">
              <div>
                <span className="nr-dashboard-kicker">
                  {isArabic ? "إدارة الدول" : "Country Management"}
                </span>
                <h2 id="recycle-bin-title">{t.countries.recycleBin}</h2>
                <p>
                  {isArabic
                    ? "يمكنك استعادة الدول المحذوفة وإعادتها إلى القائمة."
                    : "Restore deleted countries and return them to the list."}
                </p>
              </div>

              <button
                type="button"
                className="nr-modal-close"
                aria-label={isArabic ? "إغلاق النافذة" : "Close dialog"}
                disabled={restoreMutation.isPending}
                onClick={() => setIsRecycleBinOpen(false)}
              >
                ×
              </button>
            </div>

            {isDeletedCountriesLoading ? (
              <div className="nr-table-empty">
                {isArabic
                  ? "جارٍ تحميل الدول المحذوفة..."
                  : "Loading deleted countries..."}
              </div>
            ) : isDeletedCountriesError ? (
              <div className="nr-table-empty">
                {isArabic
                  ? "تعذر تحميل الدول المحذوفة."
                  : "Unable to load deleted countries."}
              </div>
            ) : deletedCountries.length === 0 ? (
              <div className="nr-table-empty">
                {isArabic
                  ? "لا توجد دول محذوفة."
                  : "There are no deleted countries."}
              </div>
            ) : (
              <div className="nr-recycle-list">
                {deletedCountries.map((country) => (
                  <article key={country.id} className="nr-recycle-item">
                    <div className="nr-recycle-country">
                      {country.flagUrl ? (
                        <img
                          src={country.flagUrl}
                          alt={
                            isArabic
                              ? `علم ${country.nameAr}`
                              : `${country.nameEn} flag`
                          }
                          className="nr-recycle-flag"
                        />
                      ) : null}

                      <div>
                        <strong>
                          {isArabic ? country.nameAr : country.nameEn}
                        </strong>
                        <span>
                          {isArabic ? country.nameEn : country.nameAr} ·{" "}
                          {country.iso2}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="nr-secondary-button"
                      disabled={restoreMutation.isPending || !canArchive}
                      onClick={() => {
                        if (!canArchive) return;
                        restoreMutation.mutate(country.id);
                      }}
                    >
                      {restoreMutation.isPending
                        ? isArabic
                          ? "جارٍ الاستعادة..."
                          : "Restoring..."
                        : isArabic
                          ? "استعادة"
                          : "Restore"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingCountry) && canDelete}
        title={isArabic ? "حذف الدولة" : "Delete Country"}
        description={
          deletingCountry
            ? isArabic
              ? `هل تريد حذف "${deletingCountry.nameAr}"؟ لن تظهر الدولة في القائمة بعد الحذف.`
              : `Do you want to delete "${deletingCountry.nameEn}"? It will no longer appear in the list.`
            : ""
        }
        confirmLabel={
          deleteMutation.isPending
            ? isArabic
              ? "جارٍ الحذف..."
              : "Deleting..."
            : isArabic
              ? "حذف"
              : "Delete"
        }
        isLoading={deleteMutation.isPending}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          if (!deletingCountry || !canDelete) return;
          setFormError("");
          deleteMutation.mutate(deletingCountry.id);
        }}
      />
    </section>
  );
}
