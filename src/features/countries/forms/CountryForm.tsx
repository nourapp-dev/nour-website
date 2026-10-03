"use client";

import CoordinatePicker from "../../../components/maps/CoordinatePicker";
import { useState } from "react";

import Button from "../../../components/ui/Button";
import MediaUploader from "../../../components/ui/media/MediaUploader";
import { useLanguage } from "../../../core/i18n";

type CountryFormValues = {
  nameAr: string;
  nameEn: string;

  iso2: string;
  iso3: string;

  phoneCode: string;

  currencyCode: string;
  currencyNameAr: string;
  currencyNameEn: string;

  timezone: string;

  latitude: number | null;
  longitude: number | null;

  sortOrder: number;
  isActive: boolean;

  flagFile: File | null;
};

type CountryFormProps = {
  initialValues?: Partial<CountryFormValues>;
  onSubmit: (values: CountryFormValues) => Promise<void>;
  isSubmitting?: boolean;
};

const defaultValues: CountryFormValues = {
  nameAr: "",
  nameEn: "",

  iso2: "",
  iso3: "",

  phoneCode: "",

  currencyCode: "",
  currencyNameAr: "",
  currencyNameEn: "",

  timezone: "",

  latitude: null,
  longitude: null,

  sortOrder: 0,
  isActive: true,

  flagFile: null,
};

type CountryFormErrors = Partial<
  Record<keyof CountryFormValues | "form", string>
>;

const timezoneOptions = [
  "Asia/Riyadh",
  "Africa/Lagos",
  "Asia/Karachi",
  "Asia/Dubai",
  "Africa/Cairo",
  "Europe/London",
];

function normalizeUppercaseCode(value: string, maxLength: number) {
  return value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, maxLength);
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export default function CountryForm({
  initialValues: providedInitialValues,
  onSubmit,
  isSubmitting = false,
}: CountryFormProps) {
  const { language } = useLanguage();

  const isArabic = language === "ar";

  const [values, setValues] = useState<CountryFormValues>({
    ...defaultValues,
    ...providedInitialValues,

    latitude: providedInitialValues?.latitude ?? null,

    longitude: providedInitialValues?.longitude ?? null,

    flagFile: null,
  });

  const [errors, setErrors] = useState<CountryFormErrors>({});

  function updateValue<K extends keyof CountryFormValues>(
    key: K,
    value: CountryFormValues[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
      form: undefined,
    }));
  }

  function validateForm() {
    const nextErrors: CountryFormErrors = {};

    if (!values.nameAr.trim()) {
      nextErrors.nameAr = isArabic
        ? "اسم الدولة بالعربية مطلوب."
        : "Arabic country name is required.";
    }

    if (!values.nameEn.trim()) {
      nextErrors.nameEn = isArabic
        ? "اسم الدولة بالإنجليزية مطلوب."
        : "English country name is required.";
    }

    if (!/^[A-Z]{2}$/.test(values.iso2)) {
      nextErrors.iso2 = isArabic
        ? "رمز ISO2 يجب أن يتكون من حرفين إنجليزيين."
        : "ISO2 must contain exactly two English letters.";
    }

    if (!/^[A-Z]{3}$/.test(values.iso3)) {
      nextErrors.iso3 = isArabic
        ? "رمز ISO3 يجب أن يتكون من ثلاثة أحرف إنجليزية."
        : "ISO3 must contain exactly three English letters.";
    }

    if (!/^[A-Z]{3}$/.test(values.currencyCode)) {
      nextErrors.currencyCode = isArabic
        ? "رمز العملة يجب أن يتكون من ثلاثة أحرف إنجليزية."
        : "Currency code must contain exactly three English letters.";
    }

    if (
      values.latitude !== null &&
      (values.latitude < -90 || values.latitude > 90)
    ) {
      nextErrors.latitude = isArabic
        ? "خط العرض يجب أن يكون بين -90 و90."
        : "Latitude must be between -90 and 90.";
    }

    if (
      values.longitude !== null &&
      (values.longitude < -180 || values.longitude > 180)
    ) {
      nextErrors.longitude = isArabic
        ? "خط الطول يجب أن يكون بين -180 و180."
        : "Longitude must be between -180 and 180.";
    }

    if (
      (values.latitude === null && values.longitude !== null) ||
      (values.latitude !== null && values.longitude === null)
    ) {
      const message = isArabic
        ? "يجب إدخال خط العرض وخط الطول معًا."
        : "Latitude and longitude must be entered together.";

      nextErrors.latitude = message;
      nextErrors.longitude = message;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});

      await onSubmit({
        ...values,

        nameAr: values.nameAr.trim(),
        nameEn: values.nameEn.trim(),

        iso2: values.iso2.trim(),
        iso3: values.iso3.trim(),

        phoneCode: values.phoneCode.trim(),

        currencyCode: values.currencyCode.trim(),

        currencyNameAr: values.currencyNameAr.trim(),

        currencyNameEn: values.currencyNameEn.trim(),

        timezone: values.timezone.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("uq_countries_iso2") ||
        lowerMessage.includes("iso2")
      ) {
        setErrors({
          form: isArabic
            ? "رمز ISO2 مستخدم لدولة أخرى."
            : "ISO2 code is already in use.",
        });

        return;
      }

      if (
        lowerMessage.includes("uq_countries_iso3") ||
        lowerMessage.includes("iso3")
      ) {
        setErrors({
          form: isArabic
            ? "رمز ISO3 مستخدم لدولة أخرى."
            : "ISO3 code is already in use.",
        });

        return;
      }

      setErrors({
        form:
          message ||
          (isArabic ? "تعذر حفظ الدولة." : "Unable to save the country."),
      });
    }
  }

  return (
    <form className="nr-country-form" onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <div className="nr-form-error" role="alert">
          {errors.form}
        </div>
      ) : null}

      <MediaUploader
        label={isArabic ? "علم الدولة" : "Country Flag"}
        onFileSelect={(file) => {
          updateValue("flagFile", file);
        }}
      />

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>01</span>

          <div>
            <h3>{isArabic ? "المعلومات الأساسية" : "Basic Information"}</h3>

            <p>
              {isArabic
                ? "أدخل أسماء الدولة ورموزها الدولية."
                : "Enter the country names and international codes."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</span>

            <input
              className="nr-input"
              value={values.nameAr}
              onChange={(event) => updateValue("nameAr", event.target.value)}
              aria-invalid={Boolean(errors.nameAr)}
              required
            />

            {errors.nameAr ? (
              <small className="nr-field-error">{errors.nameAr}</small>
            ) : null}
          </label>

          <label>
            <span>{isArabic ? "الاسم بالإنجليزية" : "English Name"}</span>

            <input
              className="nr-input"
              value={values.nameEn}
              onChange={(event) => updateValue("nameEn", event.target.value)}
              aria-invalid={Boolean(errors.nameEn)}
              required
            />

            {errors.nameEn ? (
              <small className="nr-field-error">{errors.nameEn}</small>
            ) : null}
          </label>

          <label>
            <span>{isArabic ? "رمز ISO2" : "ISO2 Code"}</span>

            <input
              className="nr-input"
              maxLength={2}
              value={values.iso2}
              onChange={(event) =>
                updateValue(
                  "iso2",
                  normalizeUppercaseCode(event.target.value, 2),
                )
              }
              placeholder="SA"
              aria-invalid={Boolean(errors.iso2)}
              required
            />

            {errors.iso2 ? (
              <small className="nr-field-error">{errors.iso2}</small>
            ) : null}
          </label>

          <label>
            <span>{isArabic ? "رمز ISO3" : "ISO3 Code"}</span>

            <input
              className="nr-input"
              maxLength={3}
              value={values.iso3}
              onChange={(event) =>
                updateValue(
                  "iso3",
                  normalizeUppercaseCode(event.target.value, 3),
                )
              }
              placeholder="SAU"
              aria-invalid={Boolean(errors.iso3)}
              required
            />

            {errors.iso3 ? (
              <small className="nr-field-error">{errors.iso3}</small>
            ) : null}
          </label>
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>02</span>

          <div>
            <h3>{isArabic ? "الاتصال والعملة" : "Contact and Currency"}</h3>

            <p>
              {isArabic
                ? "بيانات الاتصال الرسمية والعملة المحلية."
                : "Official contact details and local currency."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>{isArabic ? "مفتاح الاتصال" : "Calling Code"}</span>

            <input
              className="nr-input"
              value={values.phoneCode}
              onChange={(event) => updateValue("phoneCode", event.target.value)}
              placeholder="+966"
              required
            />
          </label>

          <label>
            <span>{isArabic ? "رمز العملة" : "Currency Code"}</span>

            <input
              className="nr-input"
              maxLength={3}
              value={values.currencyCode}
              onChange={(event) =>
                updateValue(
                  "currencyCode",
                  normalizeUppercaseCode(event.target.value, 3),
                )
              }
              placeholder="SAR"
              aria-invalid={Boolean(errors.currencyCode)}
              required
            />

            {errors.currencyCode ? (
              <small className="nr-field-error">{errors.currencyCode}</small>
            ) : null}
          </label>

          <label>
            <span>
              {isArabic ? "اسم العملة بالعربية" : "Arabic Currency Name"}
            </span>

            <input
              className="nr-input"
              value={values.currencyNameAr}
              onChange={(event) =>
                updateValue("currencyNameAr", event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic ? "اسم العملة بالإنجليزية" : "English Currency Name"}
            </span>

            <input
              className="nr-input"
              value={values.currencyNameEn}
              onChange={(event) =>
                updateValue("currencyNameEn", event.target.value)
              }
              required
            />
          </label>
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>03</span>

          <div>
            <h3>{isArabic ? "الموقع الجغرافي" : "Geographic Location"}</h3>

            <p>
              {isArabic
                ? "تُستخدم الإحداثيات لإظهار الدولة في موقعها الصحيح على الخريطة العالمية."
                : "Coordinates are used to position the country correctly on the world map."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>{isArabic ? "خط العرض" : "Latitude"}</span>

            <input
              className="nr-input"
              type="number"
              min={-90}
              max={90}
              step="0.000001"
              value={values.latitude ?? ""}
              onChange={(event) =>
                updateValue("latitude", parseOptionalNumber(event.target.value))
              }
              placeholder="23.885900"
              dir="ltr"
              aria-invalid={Boolean(errors.latitude)}
            />

            {errors.latitude ? (
              <small className="nr-field-error">{errors.latitude}</small>
            ) : null}
          </label>

          <label>
            <span>{isArabic ? "خط الطول" : "Longitude"}</span>

            <input
              className="nr-input"
              type="number"
              min={-180}
              max={180}
              step="0.000001"
              value={values.longitude ?? ""}
              onChange={(event) =>
                updateValue(
                  "longitude",
                  parseOptionalNumber(event.target.value),
                )
              }
              placeholder="45.079200"
              dir="ltr"
              aria-invalid={Boolean(errors.longitude)}
            />

            {errors.longitude ? (
              <small className="nr-field-error">{errors.longitude}</small>
            ) : null}
          </label>
        </div>

        <div className="nr-country-coordinate-hint">
          {isArabic
            ? "مثال السعودية: خط العرض 23.885900، خط الطول 45.079200."
            : "Saudi Arabia example: latitude 23.885900, longitude 45.079200."}
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>04</span>

          <div>
            <h3>{isArabic ? "إعدادات العرض" : "Display Settings"}</h3>

            <p>
              {isArabic
                ? "المنطقة الزمنية وترتيب وحالة الدولة."
                : "Timezone, display order, and country status."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>{isArabic ? "المنطقة الزمنية" : "Timezone"}</span>

            <select
              className="nr-input"
              value={values.timezone}
              onChange={(event) => updateValue("timezone", event.target.value)}
              required
            >
              <option value="">
                {isArabic ? "اختر المنطقة الزمنية" : "Select a timezone"}
              </option>

              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{isArabic ? "ترتيب الظهور" : "Display Order"}</span>

            <input
              className="nr-input"
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(event) =>
                updateValue("sortOrder", Number(event.target.value))
              }
              required
            />
          </label>
        </div>

        <label className="nr-country-form-checkbox">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => updateValue("isActive", event.target.checked)}
          />

          <span>
            {isArabic
              ? "الدولة نشطة ومتاحة للعرض"
              : "Country is active and visible"}
          </span>
        </label>
      </section>

      <CoordinatePicker
        latitude={values.latitude}
        longitude={values.longitude}
        onChange={(lat, lon) =>
          setValues((current) => ({
            ...current,
            latitude: lat,
            longitude: lon,
          }))
        }
      />
      <div className="nr-country-form-actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : isArabic
              ? "حفظ الدولة"
              : "Save Country"}
        </Button>
      </div>
    </form>
  );
}

export type { CountryFormValues };
