"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./NewsletterSubscribeForm.module.css";

import { subscribeToUpdates } from "../services/subscribers.service";

type Language = "ar" | "en";

type NewsletterSubscribeFormProps = {
  language: Language;
};

type FormState = {
  fullName: string;
  email: string;
  countryCode: string;
  consentGiven: boolean;
};

type FormStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

const countries = [
  {
    code: "SA",
    ar: "السعودية",
    en: "Saudi Arabia",
  },
  {
    code: "AE",
    ar: "الإمارات",
    en: "United Arab Emirates",
  },
  {
    code: "BH",
    ar: "البحرين",
    en: "Bahrain",
  },
  {
    code: "KW",
    ar: "الكويت",
    en: "Kuwait",
  },
  {
    code: "OM",
    ar: "عُمان",
    en: "Oman",
  },
  {
    code: "QA",
    ar: "قطر",
    en: "Qatar",
  },
  {
    code: "EG",
    ar: "مصر",
    en: "Egypt",
  },
  {
    code: "NG",
    ar: "نيجيريا",
    en: "Nigeria",
  },
  {
    code: "PK",
    ar: "باكستان",
    en: "Pakistan",
  },
  {
    code: "IN",
    ar: "الهند",
    en: "India",
  },
  {
    code: "ID",
    ar: "إندونيسيا",
    en: "Indonesia",
  },
  {
    code: "MY",
    ar: "ماليزيا",
    en: "Malaysia",
  },
  {
    code: "GB",
    ar: "المملكة المتحدة",
    en: "United Kingdom",
  },
  {
    code: "US",
    ar: "الولايات المتحدة",
    en: "United States",
  },
  {
    code: "SD",
    ar: "السودان",
    en: "Sudan",
  },
];

export default function NewsletterSubscribeForm({
  language,
}: NewsletterSubscribeFormProps) {
  const isArabic = language === "ar";

  const [formState, setFormState] =
    useState<FormState>({
      fullName: "",
      email: "",
      countryCode: "",
      consentGiven: false,
    });

  const [status, setStatus] =
    useState<FormStatus>("idle");

  const [message, setMessage] =
    useState("");

  const isSubmitting =
    status === "submitting";

  const canSubmit = useMemo(() => {
    return (
      formState.email.trim().length > 0 &&
      formState.countryCode.length === 2 &&
      formState.consentGiven &&
      !isSubmitting
    );
  }, [
    formState.email,
    formState.countryCode,
    formState.consentGiven,
    isSubmitting,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setStatus("submitting");
    setMessage("");

    try {
      await subscribeToUpdates({
        fullName: formState.fullName,
        email: formState.email,
        countryCode: formState.countryCode,
        preferredLanguage: language,
        preferredChannel: "email",
        consentGiven: formState.consentGiven,
        consentSource:
          "website-newsletter-form",
        sourcePage:
          window.location.pathname,
      });

      setStatus("success");

      setMessage(
        isArabic
          ? "تم تسجيل اشتراكك بنجاح."
          : "Your subscription was registered successfully.",
      );

      setFormState({
        fullName: "",
        email: "",
        countryCode: "",
        consentGiven: false,
      });
    } catch (error) {
      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر تسجيل الاشتراك في الوقت الحالي."
            : "Unable to register your subscription at this time.",
      );
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>
            {isArabic ? "الاسم" : "Name"}
          </span>

          <input
            type="text"
            value={formState.fullName}
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                fullName:
                  event.target.value,
              }));
            }}
            placeholder={
              isArabic
                ? "الاسم الكامل"
                : "Full name"
            }
            autoComplete="name"
            maxLength={180}
          />
        </label>

        <label className={styles.field}>
          <span>
            {isArabic
              ? "البريد الإلكتروني"
              : "Email address"}
          </span>

          <input
            type="email"
            value={formState.email}
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                email:
                  event.target.value,
              }));
            }}
            placeholder="name@example.com"
            autoComplete="email"
            maxLength={320}
            required
            dir="ltr"
          />
        </label>

        <label className={styles.field}>
          <span>
            {isArabic
              ? "الدولة"
              : "Country"}
          </span>

          <select
            value={formState.countryCode}
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                countryCode:
                  event.target.value,
              }));
            }}
            required
          >
            <option value="" disabled>
              {isArabic
                ? "اختر الدولة"
                : "Select country"}
            </option>

            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
              >
                {isArabic
                  ? country.ar
                  : country.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={
            formState.consentGiven
          }
          onChange={(event) => {
            setFormState((current) => ({
              ...current,
              consentGiven:
                event.target.checked,
            }));
          }}
        />

        <span>
          {isArabic
            ? "أوافق على استلام تحديثات وعروض نور آب، ويمكنني إلغاء الاشتراك لاحقًا."
            : "I agree to receive NourApp updates and offers, and I can unsubscribe later."}
        </span>
      </label>

      <button
        type="submit"
        className={styles.submit}
        disabled={!canSubmit}
      >
        {isSubmitting
          ? isArabic
            ? "جارٍ التسجيل..."
            : "Subscribing..."
          : isArabic
            ? "اشترك الآن"
            : "Subscribe now"}
      </button>

      {message ? (
        <p
          className={styles.message + " " + (status === "error" ? styles.error : styles.success)}
          role={
            status === "error"
              ? "alert"
              : "status"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}