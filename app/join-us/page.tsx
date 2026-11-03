"use client";

import { FormEvent, useState } from "react";

import {
  type EmploymentType,
  submitJobApplication,
} from "../../src/features/applications/services/jobApplications";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  specialization: string;
  currentJobTitle: string;
  yearsOfExperience: string;
  employmentType: EmploymentType;
  linkedinUrl: string;
  message: string;
  privacyAccepted: boolean;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  specialization: "",
  currentJobTitle: "",
  yearsOfExperience: "",
  employmentType: "full_time",
  linkedinUrl: "",
  message: "",
  privacyAccepted: false,
};

export default function JoinUsPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [cvFile, setCvFile] = useState<File | null>(null);
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

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setErrorMessage("الاسم والبريد الإلكتروني ورقم الجوال مطلوبة.");
      return;
    }

    if (!form.privacyAccepted) {
      setErrorMessage("يجب الموافقة على سياسة الخصوصية قبل إرسال الطلب.");
      return;
    }

    const yearsOfExperience =
      form.yearsOfExperience.trim() === ""
        ? null
        : Number(form.yearsOfExperience);

    if (
      yearsOfExperience !== null &&
      (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0)
    ) {
      setErrorMessage("سنوات الخبرة يجب أن تكون رقمًا صحيحًا موجبًا.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitJobApplication(
        {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          specialization: form.specialization,
          currentJobTitle: form.currentJobTitle,
          yearsOfExperience,
          employmentType: form.employmentType,
          linkedinUrl: form.linkedinUrl,
          message: form.message,
          privacyAccepted: form.privacyAccepted,
        },
        cvFile,
      );

      setForm(INITIAL_FORM);
      setCvFile(null);
      setSuccessMessage(
        "تم استلام طلبك بنجاح. سيتواصل معك فريق نور آب عند وجود فرصة مناسبة.",
      );

      const fileInput = document.getElementById(
        "join-us-cv",
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إرسال الطلب.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="join-page" dir="rtl">
      <section className="join-hero">
        <div className="join-container join-hero-grid">
          <div>
            <span className="join-kicker">انضم إلى فريق نور آب</span>
            <h1>
              اصنع معنا تجربة عمرة
              <strong> أكثر سهولة وطمأنينة</strong>
            </h1>
            <p>
              نبحث عن أشخاص يشاركوننا الاهتمام بالتقنية والخدمة وتجربة
              المعتمر. أرسل بياناتك وسنتواصل معك عند توفر فرصة مناسبة.
            </p>

            <div className="join-points">
              <span>بيئة عمل رقمية</span>
              <span>فرص متنوعة</span>
              <span>عمل مرن وعن بعد</span>
            </div>
          </div>

          <div className="join-hero-card">
            <span>لماذا نور آب؟</span>
            <strong>نبني منصة تخدم رحلة المعتمر من مكان واحد.</strong>
            <p>
              التقنية، التشغيل، المحتوى وخدمة العملاء تعمل معًا لبناء تجربة
              موثوقة وقابلة للتوسع.
            </p>
          </div>
        </div>
      </section>

      <section className="join-form-section">
        <div className="join-container">
          <div className="join-form-heading">
            <span>طلب انضمام</span>
            <h2>عرّفنا بنفسك</h2>
            <p>املأ البيانات التالية، ويمكنك إرفاق سيرتك الذاتية.</p>
          </div>

          <form className="join-form" onSubmit={handleSubmit}>
            <div className="join-grid">
              <label>
                <span>الاسم الكامل *</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
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
                <span>المجال / التخصص</span>
                <input
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                />
              </label>

              <label>
                <span>المسمى الوظيفي الحالي</span>
                <input
                  value={form.currentJobTitle}
                  onChange={(e) => setField("currentJobTitle", e.target.value)}
                />
              </label>

              <label>
                <span>سنوات الخبرة</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.yearsOfExperience}
                  onChange={(e) => setField("yearsOfExperience", e.target.value)}
                />
              </label>

              <label>
                <span>نوع التعاون *</span>
                <select
                  value={form.employmentType}
                  onChange={(e) =>
                    setField(
                      "employmentType",
                      e.target.value as EmploymentType,
                    )
                  }
                  required
                >
                  <option value="full_time">دوام كامل</option>
                  <option value="part_time">دوام جزئي</option>
                  <option value="remote">عن بعد</option>
                  <option value="internship">تدريب</option>
                  <option value="other">أخرى</option>
                </select>
              </label>

              <label>
                <span>LinkedIn</span>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  dir="ltr"
                />
              </label>

              <label className="join-file">
                <span>السيرة الذاتية</span>
                <input
                  id="join-us-cv"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                />
                <small>PDF أو DOC أو DOCX — بحد أقصى 5MB</small>
              </label>
            </div>

            <label className="join-message">
              <span>نبذة قصيرة</span>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setField("message", e.target.value)}
                placeholder="حدثنا باختصار عن خبرتك وما الذي تود تقديمه مع نور آب..."
              />
            </label>

            <label className="join-consent">
              <input
                type="checkbox"
                checked={form.privacyAccepted}
                onChange={(e) =>
                  setField("privacyAccepted", e.target.checked)
                }
                required
              />
              <span>
                أوافق على استخدام بياناتي لغرض مراجعة طلب الانضمام وفق سياسة
                الخصوصية.
              </span>
            </label>

            {errorMessage ? (
              <div className="join-alert join-alert-error">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="join-alert join-alert-success">
                {successMessage}
              </div>
            ) : null}

            <button
              className="join-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جارٍ إرسال الطلب..." : "إرسال طلب الانضمام"}
            </button>
          </form>
        </div>
      </section>

      <style jsx>{`
        .join-page{min-height:100vh;background:#f6f9fd;color:#15233b}
        .join-container{width:min(1160px,calc(100% - 32px));margin-inline:auto}
        .join-hero{position:relative;overflow:hidden;padding:92px 0 72px;background:radial-gradient(circle at 12% 15%,rgba(255,195,19,.18),transparent 25%),linear-gradient(135deg,#0b4ead 0%,#176fe8 58%,#2aa9e9 100%);color:white}
        .join-hero-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:48px;align-items:center}
        .join-kicker,.join-form-heading>span{display:inline-flex;align-items:center;width:fit-content;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:900}
        .join-kicker{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.1)}
        .join-hero h1{max-width:760px;margin:18px 0;font-size:clamp(38px,5vw,68px);line-height:1.15;letter-spacing:-.04em}
        .join-hero h1 strong{display:block;color:#ffc313}
        .join-hero p{max-width:720px;margin:0;color:rgba(255,255,255,.82);font-size:16px;line-height:2}
        .join-points{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .join-points span{padding:10px 14px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);font-size:12px;font-weight:800}
        .join-hero-card{padding:28px;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:rgba(7,24,44,.26);backdrop-filter:blur(14px);box-shadow:0 26px 80px rgba(4,31,69,.24)}
        .join-hero-card>span{color:#ffc313;font-size:12px;font-weight:900}
        .join-hero-card strong{display:block;margin:10px 0;font-size:24px;line-height:1.65}
        .join-hero-card p{font-size:13px}
        .join-form-section{padding:72px 0 96px}
        .join-form-heading{margin-bottom:26px}
        .join-form-heading>span{background:rgba(23,111,232,.08);color:#176fe8}
        .join-form-heading h2{margin:12px 0 8px;font-size:clamp(30px,4vw,44px)}
        .join-form-heading p{margin:0;color:#6d7b91}
        .join-form{padding:30px;border:1px solid #e4ebf4;border-radius:26px;background:white;box-shadow:0 20px 60px rgba(22,47,86,.08)}
        .join-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .join-form label{display:grid;gap:8px}
        .join-form label>span{font-size:12px;font-weight:900}
        .join-form input,.join-form select,.join-form textarea{width:100%;box-sizing:border-box;border:1px solid #d7e1ed;border-radius:13px;background:#f9fbfe;color:#15233b;font:inherit;outline:none;transition:border-color .18s ease,box-shadow .18s ease}
        .join-form input,.join-form select{min-height:52px;padding:0 14px}
        .join-form textarea{padding:14px;resize:vertical}
        .join-form input:focus,.join-form select:focus,.join-form textarea:focus{border-color:#176fe8;box-shadow:0 0 0 4px rgba(23,111,232,.09)}
        .join-file small{color:#7a8799;font-size:11px}
        .join-message{margin-top:18px}
        .join-consent{grid-template-columns:auto 1fr;align-items:start;gap:10px!important;margin-top:18px;color:#536279;line-height:1.8}
        .join-consent input{width:18px;min-height:18px;margin-top:4px}
        .join-alert{margin-top:18px;padding:13px 15px;border-radius:12px;font-size:13px;font-weight:800}
        .join-alert-error{border:1px solid rgba(185,28,28,.16);background:rgba(185,28,28,.05);color:#b91c1c}
        .join-alert-success{border:1px solid rgba(22,163,74,.16);background:rgba(22,163,74,.06);color:#15803d}
        .join-submit{min-height:54px;margin-top:20px;padding:0 24px;border:0;border-radius:14px;background:#ffc313;color:#12345d;font:inherit;font-weight:1000;cursor:pointer}
        .join-submit:disabled{cursor:wait;opacity:.65}
        @media(max-width:820px){.join-hero{padding-top:64px}.join-hero-grid,.join-grid{grid-template-columns:1fr}.join-hero-grid{gap:30px}.join-form{padding:20px}}
      `}</style>
    </main>
  );
}