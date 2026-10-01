"use client";

import {
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  CircleDollarSign,
  Contact,
  Globe2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";

type SettingGroup =
  | "general"
  | "contact"
  | "booking"
  | "payment"
  | "social"
  | "seo";

type SettingValueType =
  | "text"
  | "number"
  | "boolean"
  | "email"
  | "phone"
  | "url"
  | "json";

type PlatformSettingRow = {
  id: string;
  setting_key: string;
  setting_group: SettingGroup;
  value_type: SettingValueType;
  value_json: unknown;
  label_ar: string;
  label_en: string;
  description_ar: string | null;
  description_en: string | null;
  placeholder_ar: string | null;
  placeholder_en: string | null;
  validation_rules: Record<
    string,
    unknown
  > | null;
  is_public: boolean;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

type SettingsFormValues = Record<
  string,
  unknown
>;

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

type GroupDefinition = {
  key: SettingGroup;
  icon: LucideIcon;
};

const settingGroups: GroupDefinition[] = [
  {
    key: "general",
    icon: Settings2,
  },
  {
    key: "contact",
    icon: Contact,
  },
  {
    key: "booking",
    icon: CalendarCheck,
  },
  {
    key: "payment",
    icon: CircleDollarSign,
  },
  {
    key: "social",
    icon: Share2,
  },
  {
    key: "seo",
    icon: Globe2,
  },
];

const settingsCopy = {
  ar: {
    pageTitle: "إعدادات المنصة",
    pageDescription:
      "إدارة الإعدادات العامة والتواصل والحجوزات والدفع وروابط التواصل ومحركات البحث.",
    dashboard: "لوحة التحكم",
    refresh: "تحديث البيانات",
    saveAll: "حفظ التغييرات",
    saving: "جارٍ الحفظ...",
    searchPlaceholder:
      "البحث في الإعدادات...",

    general: "الإعدادات العامة",
    contact: "التواصل",
    booking: "الحجوزات",
    payment: "الدفع",
    social: "التواصل الاجتماعي",
    seo: "محركات البحث",

    generalDescription:
      "اسم المنصة واللغة والدولة والعملة والمنطقة الزمنية.",
    contactDescription:
      "بيانات الدعم ورقم واتساب والعنوان ورابط الموقع.",
    bookingDescription:
      "قواعد الحجوزات والضيوف والتأكيد والإلغاء.",
    paymentDescription:
      "خيارات الدفع والعربون والضريبة ووسائل الدفع.",
    socialDescription:
      "روابط حسابات المنصة على شبكات التواصل.",
    seoDescription:
      "عناوين وأوصاف الموقع وإعدادات الأرشفة.",

    publicSetting: "إعداد عام",
    privateSetting: "إعداد داخلي",
    requiredSetting: "مطلوب",
    optionalSetting: "اختياري",

    enabled: "مفعّل",
    disabled: "غير مفعّل",
    yes: "نعم",
    no: "لا",

    jsonHint:
      "أدخل قيمة JSON صحيحة.",
    jsonInvalid:
      "قيمة JSON غير صحيحة.",

    loading:
      "جارٍ تحميل إعدادات المنصة...",
    noSettings:
      "لا توجد إعدادات متاحة في هذا القسم.",
    loadError:
      "تعذر تحميل الإعدادات. تأكد من صلاحية settings.read.",
    saveSuccess:
      "تم حفظ إعدادات المنصة بنجاح.",
    saveError:
      "تعذر حفظ بعض الإعدادات. تأكد من صلاحية settings.manage.",
    noChanges:
      "لا توجد تغييرات جديدة للحفظ.",

    lastUpdated: "آخر تحديث",
    changesCount: "تغييرات غير محفوظة",
    settingsCount: "إعداد",
    filterAll: "جميع الإعدادات",
    filterPublic: "العامة",
    filterPrivate: "الداخلية",
  },

  en: {
    pageTitle: "Platform Settings",
    pageDescription:
      "Manage general, contact, booking, payment, social, and search engine settings.",
    dashboard: "Dashboard",
    refresh: "Refresh data",
    saveAll: "Save changes",
    saving: "Saving...",
    searchPlaceholder:
      "Search settings...",

    general: "General settings",
    contact: "Contact",
    booking: "Bookings",
    payment: "Payments",
    social: "Social media",
    seo: "Search engines",

    generalDescription:
      "Platform name, language, country, currency, and timezone.",
    contactDescription:
      "Support details, WhatsApp, address, and website URL.",
    bookingDescription:
      "Booking, guest, confirmation, and cancellation rules.",
    paymentDescription:
      "Payment options, deposits, tax, and payment methods.",
    socialDescription:
      "Platform social media account links.",
    seoDescription:
      "Website titles, descriptions, and indexing settings.",

    publicSetting: "Public setting",
    privateSetting: "Internal setting",
    requiredSetting: "Required",
    optionalSetting: "Optional",

    enabled: "Enabled",
    disabled: "Disabled",
    yes: "Yes",
    no: "No",

    jsonHint:
      "Enter a valid JSON value.",
    jsonInvalid:
      "The JSON value is invalid.",

    loading:
      "Loading platform settings...",
    noSettings:
      "No settings are available in this section.",
    loadError:
      "Unable to load settings. Verify the settings.read permission.",
    saveSuccess:
      "Platform settings were saved successfully.",
    saveError:
      "Some settings could not be saved. Verify the settings.manage permission.",
    noChanges:
      "There are no new changes to save.",

    lastUpdated: "Last updated",
    changesCount: "Unsaved changes",
    settingsCount: "settings",
    filterAll: "All settings",
    filterPublic: "Public",
    filterPrivate: "Internal",
  },
} as const;

async function getPlatformSettings(
  supabase: ReturnType<typeof createClient>,
): Promise<PlatformSettingRow[]> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      `
        id,
        setting_key,
        setting_group,
        value_type,
        value_json,
        label_ar,
        label_en,
        description_ar,
        description_en,
        placeholder_ar,
        placeholder_en,
        validation_rules,
        is_public,
        is_required,
        is_active,
        sort_order,
        updated_at
      `,
    )
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("setting_group", {
      ascending: true,
    })
    .order("sort_order", {
      ascending: true,
    })
    .order("setting_key", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ??
    []) as PlatformSettingRow[];
}

async function savePlatformSetting(
  supabase: ReturnType<typeof createClient>,
  settingKey: string,
  value: unknown,
): Promise<void> {
  const { error } = await supabase.rpc(
    "update_platform_setting",
    {
      p_setting_key: settingKey,
      p_value_json: value,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeSettingValue(
  setting: PlatformSettingRow,
): unknown {
  if (
    setting.value_type === "boolean"
  ) {
    return setting.value_json === true;
  }

  if (
    setting.value_type === "number"
  ) {
    if (
      typeof setting.value_json ===
      "number"
    ) {
      return setting.value_json;
    }

    const parsedValue = Number(
      setting.value_json,
    );

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }

  if (setting.value_type === "json") {
    return JSON.stringify(
      setting.value_json ?? null,
      null,
      2,
    );
  }

  if (
    setting.value_json === null ||
    setting.value_json === undefined
  ) {
    return "";
  }

  return String(setting.value_json);
}

function serializeSettingValue(
  setting: PlatformSettingRow,
  value: unknown,
): unknown {
  if (
    setting.value_type === "boolean"
  ) {
    return Boolean(value);
  }

  if (
    setting.value_type === "number"
  ) {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      throw new Error(
        `Invalid numeric value for ${setting.setting_key}`,
      );
    }

    return parsedValue;
  }

  if (setting.value_type === "json") {
    if (
      typeof value !== "string"
    ) {
      return value;
    }

    return JSON.parse(value);
  }

  const textValue = String(
    value ?? "",
  ).trim();

  return textValue.length
    ? textValue
    : null;
}

export default function AdminSettingsPage() {
  const { language } = useLanguage();

  const isArabic = language === "ar";
  const t = settingsCopy[language];

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const queryClient = useQueryClient();

  const [activeGroup, setActiveGroup] =
    useState<SettingGroup>("general");

  const [formValues, setFormValues] =
    useState<SettingsFormValues>({});

  const [initialValues, setInitialValues] =
    useState<SettingsFormValues>({});

  const [searchValue, setSearchValue] =
    useState("");

  const [visibilityFilter, setVisibilityFilter] =
    useState<
      "all" | "public" | "private"
    >("all");

  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const settingsQuery = useQuery({
    queryKey: [
      "admin",
      "platform-settings",
    ],
    queryFn: () =>
      getPlatformSettings(supabase),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const settings =
    settingsQuery.data ?? [];

  const [previousSettings, setPreviousSettings] = useState<typeof settingsQuery.data>(undefined);
  if (settingsQuery.data !== previousSettings) {
    setPreviousSettings(settingsQuery.data);
    const nextValues: SettingsFormValues = {};

    settings.forEach((setting) => {
      nextValues[setting.setting_key] =
        normalizeSettingValue(setting);
    });

    setFormValues(nextValues);
    setInitialValues(nextValues);
  }

  const changedKeys = useMemo(() => {
    return settings
      .filter((setting) => {
        const current =
          formValues[
            setting.setting_key
          ];

        const initial =
          initialValues[
            setting.setting_key
          ];

        return (
          JSON.stringify(current) !==
          JSON.stringify(initial)
        );
      })
      .map(
        (setting) =>
          setting.setting_key,
      );
  }, [
    settings,
    formValues,
    initialValues,
  ]);

  const activeGroupSettings =
    useMemo(() => {
      const normalizedSearch =
        searchValue
          .trim()
          .toLowerCase();

      return settings.filter(
        (setting) => {
          if (
            setting.setting_group !==
            activeGroup
          ) {
            return false;
          }

          if (
            visibilityFilter ===
              "public" &&
            !setting.is_public
          ) {
            return false;
          }

          if (
            visibilityFilter ===
              "private" &&
            setting.is_public
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          return [
            setting.setting_key,
            setting.label_ar,
            setting.label_en,
            setting.description_ar,
            setting.description_en,
          ].some((value) =>
            value
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ),
          );
        },
      );
    }, [
      settings,
      activeGroup,
      visibilityFilter,
      searchValue,
    ]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!changedKeys.length) {
        return;
      }

      const changedSettings =
        settings.filter((setting) =>
          changedKeys.includes(
            setting.setting_key,
          ),
        );

      await Promise.all(
        changedSettings.map(
          async (setting) => {
            const currentValue =
              formValues[
                setting.setting_key
              ];

            const serializedValue =
              serializeSettingValue(
                setting,
                currentValue,
              );

            await savePlatformSetting(
              supabase,
              setting.setting_key,
              serializedValue,
            );
          },
        ),
      );
    },

    onSuccess: async () => {
      if (!changedKeys.length) {
        setFeedback({
          type: "success",
          message: t.noChanges,
        });

        return;
      }

      setFeedback({
        type: "success",
        message: t.saveSuccess,
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "admin",
          "platform-settings",
        ],
      });
    },

    onError: (error) => {
      setFeedback({
        type: "error",
        message:
          error instanceof SyntaxError
            ? t.jsonInvalid
            : t.saveError,
      });
    },
  });

  const groupDescriptions: Record<
    SettingGroup,
    string
  > = {
    general: t.generalDescription,
    contact: t.contactDescription,
    booking: t.bookingDescription,
    payment: t.paymentDescription,
    social: t.socialDescription,
    seo: t.seoDescription,
  };

  const formatDate = (
    value: string,
  ): string => {
    return new Intl.DateTimeFormat(
      isArabic ? "ar-SA" : "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(value));
  };

  const BackArrow = isArabic
    ? ArrowRight
    : ArrowLeft;

  function getSettingLabel(
    setting: PlatformSettingRow,
  ): string {
    return isArabic
      ? setting.label_ar
      : setting.label_en;
  }

  function getSettingDescription(
    setting: PlatformSettingRow,
  ): string {
    return (
      (isArabic
        ? setting.description_ar
        : setting.description_en) ?? ""
    );
  }

  function getSettingPlaceholder(
    setting: PlatformSettingRow,
  ): string {
    return (
      (isArabic
        ? setting.placeholder_ar
        : setting.placeholder_en) ?? ""
    );
  }

  function updateValue(
    settingKey: string,
    value: unknown,
  ) {
    setFeedback(null);

    setFormValues((current) => ({
      ...current,
      [settingKey]: value,
    }));
  }

  function renderSettingInput(
    setting: PlatformSettingRow,
  ) {
    const value =
      formValues[
        setting.setting_key
      ];

    if (
      setting.value_type ===
      "boolean"
    ) {
      const checked =
        value === true;

      return (
        <button
          type="button"
          className={`nr-settings-toggle ${
            checked
              ? "nr-settings-toggle--active"
              : ""
          }`}
          onClick={() => {
            updateValue(
              setting.setting_key,
              !checked,
            );
          }}
          role="switch"
          aria-checked={checked}
        >
          <span className="nr-settings-toggle-track">
            <span />
          </span>

          <strong>
            {checked
              ? t.enabled
              : t.disabled}
          </strong>
        </button>
      );
    }

    if (
      setting.value_type === "json"
    ) {
      return (
        <div className="nr-settings-json-field">
          <textarea
            value={String(value ?? "")}
            onChange={(event) => {
              updateValue(
                setting.setting_key,
                event.target.value,
              );
            }}
            placeholder={t.jsonHint}
            rows={7}
            spellCheck={false}
            dir="ltr"
          />

          <small>{t.jsonHint}</small>
        </div>
      );
    }

    if (
      setting.setting_key ===
      "general.default_language"
    ) {
      return (
        <select
          value={String(
            value ?? "ar",
          )}
          onChange={(event) => {
            updateValue(
              setting.setting_key,
              event.target.value,
            );
          }}
        >
          <option value="ar">
            العربية
          </option>

          <option value="en">
            English
          </option>
        </select>
      );
    }

    if (
      setting.setting_key ===
      "general.default_country"
    ) {
      return (
        <select
          value={String(
            value ?? "SA",
          )}
          onChange={(event) => {
            updateValue(
              setting.setting_key,
              event.target.value,
            );
          }}
        >
          <option value="SA">
            {isArabic
              ? "السعودية"
              : "Saudi Arabia"}
          </option>

          <option value="NG">
            {isArabic
              ? "نيجيريا"
              : "Nigeria"}
          </option>

          <option value="AE">
            {isArabic
              ? "الإمارات"
              : "United Arab Emirates"}
          </option>

          <option value="EG">
            {isArabic
              ? "مصر"
              : "Egypt"}
          </option>

          <option value="PK">
            {isArabic
              ? "باكستان"
              : "Pakistan"}
          </option>

          <option value="GB">
            {isArabic
              ? "المملكة المتحدة"
              : "United Kingdom"}
          </option>
        </select>
      );
    }

    if (
      setting.setting_key ===
      "general.default_currency"
    ) {
      return (
        <select
          value={String(
            value ?? "SAR",
          )}
          onChange={(event) => {
            updateValue(
              setting.setting_key,
              event.target.value,
            );
          }}
        >
          <option value="SAR">
            SAR
          </option>
          <option value="USD">
            USD
          </option>
          <option value="NGN">
            NGN
          </option>
          <option value="AED">
            AED
          </option>
          <option value="GBP">
            GBP
          </option>
        </select>
      );
    }

    return (
      <input
        type={
          setting.value_type ===
          "number"
            ? "number"
            : setting.value_type
        }
        value={String(value ?? "")}
        placeholder={
          getSettingPlaceholder(
            setting,
          )
        }
        required={
          setting.is_required
        }
        min={
          typeof setting
            .validation_rules?.min ===
          "number"
            ? setting.validation_rules
                .min
            : undefined
        }
        max={
          typeof setting
            .validation_rules?.max ===
          "number"
            ? setting.validation_rules
                .max
            : undefined
        }
        maxLength={
          typeof setting
            .validation_rules
            ?.maxLength === "number"
            ? setting.validation_rules
                .maxLength
            : undefined
        }
        dir={
          setting.value_type ===
            "email" ||
          setting.value_type ===
            "phone" ||
          setting.value_type ===
            "url"
            ? "ltr"
            : undefined
        }
        onChange={(event) => {
          updateValue(
            setting.setting_key,
            event.target.value,
          );
        }}
      />
    );
  }

  return (
    <section className="nr-settings-page">
      <header className="nr-settings-header">
        <div>
          <Link
            href="/admin/dashboard"
            className="nr-settings-back"
          >
            <BackArrow
              size={18}
              strokeWidth={1.9}
              aria-hidden={true}
            />

            <span>{t.dashboard}</span>
          </Link>

          <span className="nr-dashboard-kicker">
            Settings
          </span>

          <h1>{t.pageTitle}</h1>

          <p>{t.pageDescription}</p>
        </div>

        <div className="nr-settings-header-actions">
          <button
            type="button"
            className="nr-settings-secondary-button"
            onClick={() => {
              void settingsQuery.refetch();
            }}
            disabled={
              settingsQuery.isFetching ||
              saveMutation.isPending
            }
          >
            <RefreshCw
              size={18}
              strokeWidth={1.9}
              aria-hidden={true}
              className={
                settingsQuery.isFetching
                  ? "nr-settings-refresh-icon--loading"
                  : undefined
              }
            />

            <span>{t.refresh}</span>
          </button>

          <button
            type="button"
            className="nr-settings-primary-button"
            onClick={() => {
              setFeedback(null);
              saveMutation.mutate();
            }}
            disabled={
              saveMutation.isPending ||
              settingsQuery.isLoading
            }
          >
            {saveMutation.isPending ? (
              <RefreshCw
                size={18}
                strokeWidth={1.9}
                aria-hidden={true}
                className="nr-settings-refresh-icon--loading"
              />
            ) : (
              <Save
                size={18}
                strokeWidth={1.9}
                aria-hidden={true}
              />
            )}

            <span>
              {saveMutation.isPending
                ? t.saving
                : t.saveAll}
            </span>

            {changedKeys.length ? (
              <span className="nr-settings-save-count">
                {changedKeys.length}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {feedback ? (
        <div
          className={`nr-settings-alert nr-settings-alert--${feedback.type}`}
          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
        >
          {feedback.type ===
          "success" ? (
            <Check
              size={19}
              strokeWidth={2}
              aria-hidden={true}
            />
          ) : null}

          <span>{feedback.message}</span>
        </div>
      ) : null}

      {settingsQuery.isError ? (
        <div
          className="nr-settings-alert nr-settings-alert--error"
          role="alert"
        >
          {t.loadError}
        </div>
      ) : null}

      <div className="nr-settings-layout">
        <aside className="nr-settings-sidebar">
          <div className="nr-settings-sidebar-heading">
            <SlidersHorizontal
              size={20}
              strokeWidth={1.9}
              aria-hidden={true}
            />

            <strong>{t.pageTitle}</strong>
          </div>

          <nav className="nr-settings-groups">
            {settingGroups.map(
              (group) => {
                const Icon = group.icon;

                const count =
                  settings.filter(
                    (setting) =>
                      setting.setting_group ===
                      group.key,
                  ).length;

                return (
                  <button
                    key={group.key}
                    type="button"
                    className={
                      activeGroup ===
                      group.key
                        ? "nr-settings-group-button nr-settings-group-button--active"
                        : "nr-settings-group-button"
                    }
                    onClick={() => {
                      setActiveGroup(
                        group.key,
                      );

                      setFeedback(null);
                    }}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                      aria-hidden={true}
                    />

                    <span>
                      {t[group.key]}
                    </span>

                    <small>{count}</small>
                  </button>
                );
              },
            )}
          </nav>
        </aside>

        <main className="nr-settings-content">
          <section className="nr-settings-section-heading">
            <div>
              <span className="nr-dashboard-kicker">
                {t[activeGroup]}
              </span>

              <h2>{t[activeGroup]}</h2>

              <p>
                {
                  groupDescriptions[
                    activeGroup
                  ]
                }
              </p>
            </div>

            <div className="nr-settings-section-meta">
              <span>
                {
                  activeGroupSettings.length
                }{" "}
                {t.settingsCount}
              </span>

              <span>
                {changedKeys.length}{" "}
                {t.changesCount}
              </span>
            </div>
          </section>

          <div className="nr-settings-toolbar">
            <label className="nr-settings-search">
              <Search
                size={19}
                strokeWidth={1.9}
                aria-hidden={true}
              />

              <input
                type="search"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(
                    event.target.value,
                  );
                }}
                placeholder={
                  t.searchPlaceholder
                }
              />
            </label>

            <select
              value={visibilityFilter}
              onChange={(event) => {
                setVisibilityFilter(
                  event.target.value as
                    | "all"
                    | "public"
                    | "private",
                );
              }}
            >
              <option value="all">
                {t.filterAll}
              </option>

              <option value="public">
                {t.filterPublic}
              </option>

              <option value="private">
                {t.filterPrivate}
              </option>
            </select>
          </div>

          {settingsQuery.isLoading ? (
            <div className="nr-settings-state">
              {t.loading}
            </div>
          ) : activeGroupSettings.length ? (
            <div className="nr-settings-fields">
              {activeGroupSettings.map(
                (setting) => {
                  const isChanged =
                    changedKeys.includes(
                      setting.setting_key,
                    );

                  return (
                    <article
                      key={setting.id}
                      className={`nr-settings-field-card ${
                        isChanged
                          ? "nr-settings-field-card--changed"
                          : ""
                      }`}
                    >
                      <div className="nr-settings-field-heading">
                        <div>
                          <label
                            htmlFor={
                              setting.setting_key
                            }
                          >
                            {getSettingLabel(
                              setting,
                            )}
                          </label>

                          <code>
                            {
                              setting.setting_key
                            }
                          </code>
                        </div>

                        <div className="nr-settings-field-badges">
                          <span
                            className={
                              setting.is_public
                                ? "nr-settings-badge nr-settings-badge--public"
                                : "nr-settings-badge"
                            }
                          >
                            {setting.is_public
                              ? t.publicSetting
                              : t.privateSetting}
                          </span>

                          <span className="nr-settings-badge">
                            {setting.is_required
                              ? t.requiredSetting
                              : t.optionalSetting}
                          </span>
                        </div>
                      </div>

                      {getSettingDescription(
                        setting,
                      ) ? (
                        <p>
                          {getSettingDescription(
                            setting,
                          )}
                        </p>
                      ) : null}

                      <div
                        id={
                          setting.setting_key
                        }
                        className="nr-settings-control"
                      >
                        {renderSettingInput(
                          setting,
                        )}
                      </div>

                      <footer className="nr-settings-field-footer">
                        <span>
                          {t.lastUpdated}:{" "}
                          {formatDate(
                            setting.updated_at,
                          )}
                        </span>

                        {isChanged ? (
                          <span className="nr-settings-unsaved-indicator">
                            {
                              t.changesCount
                            }
                          </span>
                        ) : null}
                      </footer>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="nr-settings-state">
              {t.noSettings}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}