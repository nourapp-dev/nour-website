"use client";

import { FormEvent, useState } from "react";

import {
  type PartnerType,
  submitPartnerApplication,
} from "../../src/features/applications/services/partnerApplications";

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  partnerType: PartnerType;
  registrationNumber: string;
  licenseNumber: string;
  websiteUrl: string;
  companyDescription: string;
  servicesDescription: string;
  servedCountries: string;
  notes: string;
  termsAccepted: boolean;
};

const INITIAL_FORM: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  partnerType: "hotel",
  registrationNumber: "",
  licenseNumber: "",
  websiteUrl: "",
  companyDescription: "",
  servicesDescription: "",
  servedCountries: "",
  notes: "",
  termsAccepted: false,
};

const partnerOptions: Array<{
  value: PartnerType;
  label: string;
}> = [
  { value: "hotel", label: "فندق / ضيافة" },
  { value: "transport", label: "نقل" },
  { value: "visa", label: "تأشيرات" },
  { value: "umrah_company", label: "شركة عمرة" },
  { value: "guide", label: "إرشاد وخدمات ميدانية" },
  { value: "airline", label: "طيران" },
  { value: "service_provider", label: "مزود خدمات" },
  { value: "technology", label: "شراكة تقنية" },
  { value: "other", label: "أخرى" },
];

export default function BecomePartnerPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function setField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setErrorMessage(
        "اسم المنشأة واسم المسؤول والبريد الإلكتروني ورقم الجوال مطلوبة.",
      );
      return;
    }

    if (!form.termsAccepted) {
      setErrorMessage(
        "يجب الموافقة على الشروط وسياسة الخصوصية قبل إرسال الطلب.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitPartnerApplication(
        {
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          partnerType: form.partnerType,
          registrationNumber: form.registrationNumber,
          licenseNumber: form.licenseNumber,
          websiteUrl: form.websiteUrl,
          companyDescription: form.companyDescription,
          servicesDescription: form.servicesDescription,
          servedCountries: form.servedCountries
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          notes: form.notes,
          termsAccepted: form.termsAccepted,
        },
        attachment,
      );

      setForm(INITIAL_FORM);
      setAttachment(null);
      setSuccessMessage(
        "تم استلام طلب الشراكة بنجاح. سيقوم فريق نور آب بمراجعة البيانات والتواصل معكم.",
      );

      const fileInput = document.getElementById(
        "partner-attachment",
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إرسال طلب الشراكة.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="partner-page" dir="rtl">
      <section className="partner-hero">
        <div className="partner-container partner-hero-grid">
          <div>
            <span className="partner-kicker">كن شريك نور آب</span>
            <h1>
              ننمو مع شركائنا
              <strong> لنصنع رحلة أفضل للمعتمر</strong>
            </h1>
            <p>
              إذا كنت فندقًا، شركة نقل، مزود تأشيرات، شركة عمرة أو مقدم خدمة
              مرتبط برحلة المعتمر، يسعدنا التعرف على خدماتكم وبحث فرص التعاون.
            </p>

            <div className="partner-points">
              <span>وصول لعملاء جدد</span>
              <span>تشغيل رقمي</span>
              <span>شراكات قابلة للتوسع</span>
            </div>
          </div>

          <div className="partner-hero-card">
            <span>شراكة متكاملة</span>
            <strong>
              اربط خدماتك بمنصة نور آب وكن جزءًا من تجربة رقمية موثوقة.
            </strong>
            <p>
              نراجع كل طلب شراكة وفق نوع الخدمة، الجودة، نطاق التغطية والجاهزية
              التشغيلية قبل بدء التعاون.
            </p>
          </div>
        </div>
      </section>

      <section className="partner-form-section">
        <div className="partner-container">
          <div className="partner-form-heading">
            <span>طلب شراكة</span>
            <h2>عرّفنا بمنشأتك</h2>
            <p>
              أدخل المعلومات الأساسية وسيتولى فريق نور آب مراجعة الطلب.
            </p>
          </div>

          <form className="partner-form" onSubmit={handleSubmit}>
            <div className="partner-grid">
              <label>
                <span>اسم الشركة / المنشأة *</span>
                <input
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  required
                />
              </label>

              <label>
                <span>اسم المسؤول *</span>
                <input
                  value={form.contactName}
                  onChange={(e) => setField("contactName", e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                <span>البريد الإلكتروني *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  autoComplete="email"
                  dir="ltr"
                  required
                />
              </label>

              <label>
                <span>رقم الجوال *</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  autoComplete="tel"
                  dir="ltr"
                  required
                />
              </label>

              <label>
                <span>الدولة</span>
                <input
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  autoComplete="country-name"
                />
              </label>

              <label>
                <span>المدينة</span>
                <input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  autoComplete="address-level2"
                />
              </label>

              <label>
                <span>نوع الشراكة *</span>
                <select
                  value={form.partnerType}
                  onChange={(e) =>
                    setField("partnerType", e.target.value as PartnerType)
                  }
                  required
                >
                  {partnerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>رقم السجل التجاري</span>
                <input
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setField("registrationNumber", e.target.value)
                  }
                />
              </label>

              <label>
                <span>رقم الترخيص</span>
                <input
                  value={form.licenseNumber}
                  onChange={(e) => setField("licenseNumber", e.target.value)}
                />
              </label>

              <label>
                <span>الموقع الإلكتروني</span>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setField("websiteUrl", e.target.value)}
                  placeholder="https://example.com"
                  dir="ltr"
                />
              </label>

              <label>
                <span>الدول التي تخدمونها</span>
                <input
                  value={form.servedCountries}
                  onChange={(e) => setField("servedCountries", e.target.value)}
                  placeholder="السعودية، نيجيريا، باكستان"
                />
                <small>افصل بين الدول بفاصلة.</small>
              </label>

              <label className="partner-file">
                <span>مرفق تعريفي / ترخيص</span>
                <input
                  id="partner-attachment"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0] ?? null)
                  }
                />
                <small>PDF أو Word أو JPG أو PNG — بحد أقصى 5MB</small>
              </label>
            </div>

            <label className="partner-message">
              <span>نبذة عن الشركة</span>
              <textarea
                rows={5}
                value={form.companyDescription}
                onChange={(e) =>
                  setField("companyDescription", e.target.value)
                }
                placeholder="نبذة مختصرة عن المنشأة وخبرتها..."
              />
            </label>

            <label className="partner-message">
              <span>الخدمات المقدمة</span>
              <textarea
                rows={5}
                value={form.servicesDescription}
                onChange={(e) =>
                  setField("servicesDescription", e.target.value)
                }
                placeholder="اشرح الخدمات التي يمكن تقديمها لمستخدمي نور آب..."
              />
            </label>

            <label className="partner-message">
              <span>ملاحظات إضافية</span>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </label>

            <label className="partner-consent">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) =>
                  setField("termsAccepted", e.target.checked)
                }
                required
              />
              <span>
                أوافق على استخدام البيانات لغرض تقييم طلب الشراكة وفق الشروط
                وسياسة الخصوصية.
              </span>
            </label>

            {errorMessage ? (
              <div className="partner-alert partner-alert-error">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="partner-alert partner-alert-success">
                {successMessage}
              </div>
            ) : null}

            <button
              className="partner-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جارٍ إرسال الطلب..." : "إرسال طلب الشراكة"}
            </button>
          </form>
        </div>
      </section>

      <style jsx>{`
        .partner-page{min-height:100vh;background:#f6f9fd;color:#15233b}
        .partner-container{width:min(1160px,calc(100% - 32px));margin-inline:auto}
        .partner-hero{position:relative;overflow:hidden;padding:92px 0 72px;background:radial-gradient(circle at 12% 15%,rgba(255,195,19,.18),transparent 25%),linear-gradient(135deg,#082c67 0%,#176fe8 58%,#2aa9e9 100%);color:white}
        .partner-hero-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:48px;align-items:center}
        .partner-kicker,.partner-form-heading>span{display:inline-flex;align-items:center;width:fit-content;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:900}
        .partner-kicker{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1)}
        .partner-hero h1{max-width:760px;margin:18px 0;font-size:clamp(38px,5vw,68px);line-height:1.15;letter-spacing:-.04em}
        .partner-hero h1 strong{display:block;color:#ffc313}
        .partner-hero p{max-width:720px;margin:0;color:rgba(255,255,255,.82);font-size:16px;line-height:2}
        .partner-points{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .partner-points span{padding:10px 14px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);font-size:12px;font-weight:800}
        .partner-hero-card{padding:28px;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:rgba(7,24,44,.26);backdrop-filter:blur(14px);box-shadow:0 26px 80px rgba(4,31,69,.24)}
        .partner-hero-card>span{color:#ffc313;font-size:12px;font-weight:900}
        .partner-hero-card strong{display:block;margin:10px 0;font-size:24px;line-height:1.65}
        .partner-hero-card p{font-size:13px}
        .partner-form-section{padding:72px 0 96px}
        .partner-form-heading{margin-bottom:26px}
        .partner-form-heading>span{background:rgba(23,111,232,.08);color:#176fe8}
        .partner-form-heading h2{margin:12px 0 8px;font-size:clamp(30px,4vw,44px)}
        .partner-form-heading p{margin:0;color:#6d7b91}
        .partner-form{padding:30px;border:1px solid #e4ebf4;border-radius:26px;background:#fff;box-shadow:0 20px 60px rgba(22,47,86,.08)}
        .partner-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .partner-form label{display:grid;gap:8px}
        .partner-form label>span{font-size:12px;font-weight:900}
        .partner-form input,.partner-form select,.partner-form textarea{width:100%;box-sizing:border-box;border:1px solid #d7e1ed;border-radius:13px;background:#f9fbfe;color:#15233b;font:inherit;outline:none;transition:border-color .18s ease,box-shadow .18s ease}
        .partner-form input,.partner-form select{min-height:52px;padding:0 14px}
        .partner-form textarea{padding:14px;resize:vertical}
        .partner-form input:focus,.partner-form select:focus,.partner-form textarea:focus{border-color:#176fe8;box-shadow:0 0 0 4px rgba(23,111,232,.09)}
        .partner-file small,.partner-grid small{color:#7a8799;font-size:11px}
        .partner-message{margin-top:18px}
        .partner-consent{grid-template-columns:auto 1fr;align-items:start;gap:10px!important;margin-top:18px;color:#536279;line-height:1.8}
        .partner-consent input{width:18px;min-height:18px;margin-top:4px}
        .partner-alert{margin-top:18px;padding:13px 15px;border-radius:12px;font-size:13px;font-weight:800}
        .partner-alert-error{border:1px solid rgba(185,28,28,.16);background:rgba(185,28,28,.05);color:#b91c1c}
        .partner-alert-success{border:1px solid rgba(22,163,74,.16);background:rgba(22,163,74,.06);color:#15803d}
        .partner-submit{min-height:54px;margin-top:20px;padding:0 24px;border:0;border-radius:14px;background:#ffc313;color:#12345d;font:inherit;font-weight:1000;cursor:pointer}
        .partner-submit:disabled{cursor:wait;opacity:.65}
        @media(max-width:820px){.partner-hero{padding-top:64px}.partner-hero-grid,.partner-grid{grid-template-columns:1fr}.partner-hero-grid{gap:30px}.partner-form{padding:20px}}
      `}</style>
    </main>
  );
}