"use client";
import CountryRelations from "../CountryRelations";
import { marketLabel } from "../directory";

import { useState } from "react";

import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { Table, TableHeader, TableToolbar } from "../../../components/ui/table";
import { getAdminTranslations, useLanguage } from "../../../core/i18n";

import type { Country } from "../types";

type CountriesTableProps = {
  countries: Country[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onEdit: (country: Country) => void;
  onToggleStatus: (country: Country) => void;
  onDelete: (country: Country) => void | Promise<void>;
  canUpdate?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
  isStatusUpdating?: boolean;
  isDeleting?: boolean;
};

export default function CountriesTable({
  countries,
  searchValue,
  onSearchChange,
  onEdit,
  onToggleStatus,
  onDelete,
  canUpdate = false,
  canPublish = false,
  canDelete = false,
  isStatusUpdating = false,
  isDeleting = false,
}: CountriesTableProps) {
  const { language } = useLanguage();
  const t = getAdminTranslations(language);

  const [countryPendingDelete, setCountryPendingDelete] =
    useState<Country | null>(null);

  const hasSearchValue = searchValue.trim().length > 0;
  const isArabic = language === "ar";
  const canManageCountries = canUpdate || canPublish || canDelete;

  function openDeleteConfirmation(country: Country) {
    if (!canDelete) return;
    setCountryPendingDelete(country);
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;
    setCountryPendingDelete(null);
  }

  async function confirmDelete() {
    if (!countryPendingDelete || !canDelete || isDeleting) {
      return;
    }

    await onDelete(countryPendingDelete);
    setCountryPendingDelete(null);
  }

  return (
    <>
      <TableHeader
        title={t.countries.tableTitle}
        description={t.countries.tableDescription}
      />

      <TableToolbar
        search={
          <input
            className="nr-input"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.countries.searchPlaceholder}
            aria-label={isArabic ? "البحث عن دولة" : "Search for a country"}
          />
        }
      />

      <Table>
        <thead>
          <tr>
            <th>{isArabic ? "الترتيب" : "Order"}</th>
            <th>{isArabic ? "الدولة" : "Country"}</th>
            <th>{isArabic ? "الرمز" : "Code"}</th>
            <th>{isArabic ? "العملة" : "Currency"}</th>
            <th>{isArabic ? "المنطقة الزمنية" : "Timezone"}</th>
            <th>{isArabic ? "الحالة" : "Status"}</th>
            {canManageCountries ? (
              <th>{isArabic ? "الإجراءات" : "Actions"}</th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {countries.length > 0 ? (
            countries.map((country) => (
              <tr key={country.id}>
                <td>{country.sortOrder}</td>

                <td>
                  <div className="nr-country-name-cell">
                    {country.flagUrl ? (
                      <img
                        className="nr-country-flag"
                        src={country.flagUrl}
                        alt={
                          isArabic
                            ? `علم ${country.nameAr}`
                            : `${country.nameEn} flag`
                        }
                      />
                    ) : (
                      <div className="nr-country-flag-placeholder">
                        {country.iso2}
                      </div>
                    )}

                    <div className="nr-country-name-copy">
                      <strong>
                        {isArabic ? country.nameAr : country.nameEn}
                      </strong>
                      <small>
                        {isArabic ? country.nameEn : country.nameAr}
                      </small>
                    </div>
                  </div>
                </td>

                <td>
                  {country.iso2}
                  <CountryRelations countryId={country.id} />
                </td>
                <td>{country.currencyCode}</td>
                <td>
                  {country.timezone}
                  <small>
                    {marketLabel(country.marketStatus, language)} ·{" "}
                    {marketLabel(country.publicationStatus, language)}
                  </small>
                </td>

                <td>
                  <Badge
                    variant={
                      country.status === "active" ? "success" : "neutral"
                    }
                  >
                    {country.status === "active"
                      ? isArabic
                        ? "نشطة"
                        : "Active"
                      : isArabic
                        ? "غير نشطة"
                        : "Inactive"}
                  </Badge>
                </td>

                {canManageCountries ? (
                  <td>
                    <div className="nr-table-actions">
                      {canUpdate ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onEdit(country)}
                        >
                          {isArabic ? "تعديل" : "Edit"}
                        </Button>
                      ) : null}

                      {canPublish ? (
                        <Button
                          type="button"
                          variant={
                            country.status === "active" ? "outline" : "primary"
                          }
                          disabled={isStatusUpdating}
                          onClick={() => onToggleStatus(country)}
                        >
                          {country.status === "active"
                            ? isArabic
                              ? "تعطيل"
                              : "Disable"
                            : isArabic
                              ? "تفعيل"
                              : "Enable"}
                        </Button>
                      ) : null}

                      {canDelete ? (
                        <Button
                          type="button"
                          variant="danger"
                          disabled={isDeleting}
                          onClick={() => openDeleteConfirmation(country)}
                        >
                          {isArabic ? "حذف" : "Delete"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={canManageCountries ? 7 : 6}>
                <div className="nr-table-empty">
                  {hasSearchValue
                    ? isArabic
                      ? "لا توجد دول مطابقة للبحث."
                      : "No countries match your search."
                    : isArabic
                      ? "لا توجد دول مضافة حتى الآن."
                      : "No countries have been added yet."}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {countryPendingDelete && canDelete ? (
        <div
          className="nr-confirm-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div
            className="nr-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-country-title"
            aria-describedby="delete-country-description"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <button
              className="nr-confirm-dialog-close"
              type="button"
              onClick={closeDeleteConfirmation}
              disabled={isDeleting}
              aria-label={
                isArabic ? "إغلاق نافذة التأكيد" : "Close confirmation dialog"
              }
            >
              ×
            </button>

            <div className="nr-confirm-dialog-icon" aria-hidden="true">
              !
            </div>

            <h3 id="delete-country-title">
              {isArabic ? "تأكيد حذف الدولة" : "Confirm country deletion"}
            </h3>

            <p id="delete-country-description">
              {isArabic
                ? `هل أنت متأكد من حذف دولة «${countryPendingDelete.nameAr}»؟ ستُنقل إلى سلة المحذوفات ويمكن استعادتها لاحقًا.`
                : `Are you sure you want to delete “${countryPendingDelete.nameEn}”? It will be moved to the recycle bin and can be restored later.`}
            </p>

            <div className="nr-confirm-dialog-actions">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? isArabic
                    ? "جارٍ الحذف..."
                    : "Deleting..."
                  : isArabic
                    ? "نعم، حذف الدولة"
                    : "Yes, delete country"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
