"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, LockKeyhole, Send, X } from "lucide-react";
import { submitPartnerApplication } from "../services/partnerApplications";
import { countries, countryLabel, emptyDraft, internationalPhone, serviceChoices, toPartnerInput, validateInterestStep,
  type FormErrors, type InterestDraft, type Language, type Track } from "../utils/partner-interest-form";
import CountrySelect from "./CountrySelect";
import styles from "./partnership.module.css";

const labels = {
  ar: { steps: ["المسار والنطاق", "المنشأة", "التواصل والمراجعة"], headquartersCountry: "دولة مقر المنشأة", operatingCountry: "دولة التشغيل الأساسية أو السوق المستهدف", city: "المدينة", companyName: "الاسم القانوني للمنشأة", websiteUrl: "الموقع الإلكتروني (اختياري)", companyDescription: "نبذة مختصرة ونطاق العمل", contactName: "اسم المسؤول", contactRole: "صفة المسؤول", email: "البريد الإلكتروني", phoneCountry: "مفتاح الدولة", phoneNumber: "رقم الجوال", coverage: "دول التغطية (اختياري)", services: "مجالات الخدمة", next: "متابعة", back: "السابق", send: "إرسال طلب الاهتمام", sending: "جارٍ تسجيل الطلب…", review: "راجع بياناتك قبل الإرسال", edit: "تعديل", optional: "اختياري", selectedTrack: "المسار المحدد", international: "شريك دولي في دولة", service_provider: "مزوّد خدمات", phoneHint: "أدخل رقم الجوال دون مفتاح الدولة أو صفر البداية. يمكنك اختيار مفتاح مختلف عن دولة المنشأة.", privacy: "أوافق على استخدام بياناتي لتقييم طلب الشراكة وفق", privacyLink: "سياسة الخصوصية", disclaimer: "تقديم الطلب لا يُعد اعتمادًا للشراكة؛ يبدأ التعاون بعد المراجعة والتعاقد وإشعار الاعتماد", failed: "تعذر تسجيل الطلب. لم نتلقَّ تأكيد الحفظ. بياناتك محفوظة في هذه الصفحة؛ حاول مجددًا.", success: "تم استلام طلب اهتمامك", received: "احتفظ بمرجع الطلب. يراجع فريق نور آب البيانات ويتواصل مع المسؤول المسجل بشأن الخطوات التالية.", reference: "مرجع الطلب", noFile: "لا يلزم إرفاق مستندات في هذه المرحلة", remove: "إزالة", empty: "لم يُضف", step: "الخطوة", of: "من", scope: "النطاق", company: "المنشأة", contact: "التواصل", loading: "جارٍ الإرسال", errors: { required: "هذا الحقل مطلوب.", country: "اختر دولة من القائمة.", email: "أدخل بريدًا إلكترونيًا صحيحًا.", phone: "تحقق من المفتاح والرقم. استخدم الأرقام فقط دون مفتاح مكرر أو صفر محلي في البداية.", website: "أدخل رابطًا صحيحًا يبدأ بـ https:// أو http:// دون بيانات دخول.", length: "النص أطول من الحد المسموح.", services: "اختر مجال خدمة واحدًا على الأقل.", consent: "يلزم قبول استخدام البيانات وفق سياسة الخصوصية." } },
  en: { steps: ["Track and scope", "Organization", "Contact and review"], headquartersCountry: "Country of establishment", operatingCountry: "Primary operating country or target market", city: "City", companyName: "Legal entity name", websiteUrl: "Website (optional)", companyDescription: "Brief overview and scope of work", contactName: "Contact name", contactRole: "Contact role", email: "Email", phoneCountry: "Calling code", phoneNumber: "Mobile number", coverage: "Coverage countries (optional)", services: "Service areas", next: "Continue", back: "Back", send: "Submit expression of interest", sending: "Registering your application…", review: "Review your details before submitting", edit: "Edit", optional: "Optional", selectedTrack: "Selected track", international: "International country partner", service_provider: "Service provider", phoneHint: "Enter your mobile number without the calling code or a leading local zero. The calling code can differ from the organization's country.", privacy: "I consent to the use of my data to assess this application under the", privacyLink: "Privacy Policy", disclaimer: "Submitting an application does not constitute partnership approval; collaboration begins after review, contracting and the approval notice.", failed: "We could not confirm registration. Your entries remain on this page; please try again.", success: "Your expression of interest has been received", received: "Keep your application reference. The Nour App team will review your details and contact the person named in the application about the next steps.", reference: "Application reference", noFile: "No documents are required at this stage", remove: "Remove", empty: "Not provided", step: "Step", of: "of", scope: "Scope", company: "Organization", contact: "Contact", loading: "Submitting", errors: { required: "This field is required.", country: "Choose a country from the list.", email: "Enter a valid email address.", phone: "Check the calling code and number. Use digits without a repeated calling code or a leading local zero.", website: "Enter a valid https:// or http:// address without login details.", length: "This entry exceeds the allowed length.", services: "Select at least one service area.", consent: "Consent under the Privacy Policy is required." } },
};

export default function PartnerInterestForm({ track, language, onBusyChange }: { track: Track; language: Language; onBusyChange: (busy: boolean) => void }) {
  const t = labels[language];
  const separator = language === "ar" ? "، " : ", ";
  const [draft, setDraft] = useState<InterestDraft>({ ...emptyDraft, serviceTypes: [], servedCountries: [] });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reference, setReference] = useState("");
  const lock = useRef(false);
  const submissionKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(0);
  const focusErrors = useRef(false);
  useEffect(() => { submissionKey.current = null; }, [track]);
  useEffect(() => {
    if (focusErrors.current && Object.keys(errors).length) { formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); focusErrors.current = false; }
  }, [errors]);
  useEffect(() => { if (step !== previousStep.current) { if (!Object.keys(errors).length) headingRef.current?.focus(); previousStep.current = step; } }, [step, errors]);
  useEffect(() => { if (reference) successRef.current?.focus(); }, [reference]);
  const errorText = (key: keyof InterestDraft) => errors[key] ? t.errors[errors[key]!] : undefined;
  function update<K extends keyof InterestDraft>(key: K, value: InterestDraft[K]) {
    submissionKey.current = null;
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => { if (!current[key]) return current; const next = { ...current }; delete next[key]; return next; });
    setFailed(false);
  }
  function advance() {
    const found = validateInterestStep(step, draft, track); focusErrors.current = true; setErrors(found);
    if (!Object.keys(found).length) setStep(current => Math.min(2, current + 1));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step !== 2 || lock.current || reference) return;
    for (let index = 0; index < 3; index++) {
      const found = validateInterestStep(index, draft, track);
      if (Object.keys(found).length) { focusErrors.current = true; setStep(index); setErrors(found); return; }
    }
    lock.current = true; setPending(true); onBusyChange(true); setFailed(false);
    try {
      submissionKey.current ??= crypto.randomUUID();
      const response = await submitPartnerApplication(toPartnerInput(draft, track, submissionKey.current));
      setReference(response.id);
    } catch { setFailed(true); }
    finally { lock.current = false; setPending(false); onBusyChange(false); }
  }
  function field(key: "city" | "companyName" | "websiteUrl" | "contactName" | "contactRole" | "email" | "phoneNumber", type = "text", autoComplete?: string) {
    return <div className={styles.field}>
      <label htmlFor={`partner-${key}`}>{t[key]}{key !== "websiteUrl" && <span aria-hidden="true"> *</span>}</label>
      <input id={`partner-${key}`} name={key} type={type} autoComplete={autoComplete} value={draft[key]}
        onChange={event => update(key, event.target.value)} required={key !== "websiteUrl"} maxLength={key === "websiteUrl" ? 500 : 200}
        aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `partner-${key}-error` : key === "phoneNumber" ? "partner-phone-hint" : undefined}
        dir={["email", "tel", "url"].includes(type) ? "ltr" : undefined} inputMode={type === "tel" ? "tel" : undefined}
        placeholder={key === "websiteUrl" ? "https://example.com" : undefined} />
      {errorText(key) && <span className={styles.error} id={`partner-${key}-error`}>{errorText(key)}</span>}
    </div>;
  }
  if (reference) return <div className={styles.success} role="status"><CheckCircle2 size={44} aria-hidden="true"/><h3 ref={successRef} tabIndex={-1}>{t.success}</h3><p>{t.received}</p><div><span>{t.reference}</span><bdi>{reference}</bdi></div><p>{t.disclaimer}</p></div>;
  const DirectionArrow = language === "ar" ? ArrowLeft : ArrowRight;
  const country = (key: "headquartersCountry" | "operatingCountry") => <CountrySelect id={`partner-${key}`} label={t[key]} language={language} value={draft[key]} error={errorText(key)} disabled={pending} onChange={code => {
    update(key, code);
    if (key === "headquartersCountry" && !draft.phoneCountry && code) update("phoneCountry", code);
  }}/>;
  const summary = [
    { title: t.scope, step: 0, items: [[t.selectedTrack, t[track]], [t.headquartersCountry, countryLabel(draft.headquartersCountry, language)], [t.operatingCountry, countryLabel(draft.operatingCountry, language)], [t.city, draft.city], ...(track === "service_provider" ? [[t.services, serviceChoices.filter(c => draft.serviceTypes.includes(c.value)).map(c => c[language]).join(separator)]] : []), [t.coverage, draft.servedCountries.map(c => countryLabel(c, language)).join(separator) || t.empty]] },
    { title: t.company, step: 1, items: [[t.companyName, draft.companyName], [t.websiteUrl, draft.websiteUrl || t.empty], [t.companyDescription, draft.companyDescription]] },
    { title: t.contact, step: 2, items: [[t.contactName, draft.contactName], [t.contactRole, draft.contactRole], [t.email, draft.email], [t.phoneNumber, internationalPhone(draft)]] },
  ];
  return <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className={styles.form}
    onKeyDown={event => { if (event.key === "Enter" && step < 2 && event.target instanceof HTMLInputElement) event.preventDefault(); }}>
    <ol className={styles.progress} aria-label={language === "ar" ? "خطوات طلب الاهتمام" : "Application steps"}>
      {t.steps.map((label, index) => <li key={index} aria-current={step === index ? "step" : undefined} data-complete={index < step}>
        <button type="button" disabled={pending || index > step} onClick={() => { setStep(index); setErrors({}); }}><span>{index < step ? <Check size={16} aria-hidden="true"/> : index + 1}</span><strong>{label}</strong></button>
      </li>)}
    </ol>
    <fieldset disabled={pending} className={styles.formBody}>
      <legend className={styles.srOnly}>{t.steps[step]}</legend>
      <div className={styles.formIntro}><span>{t.step} {step + 1} {t.of} 3</span><h3 ref={headingRef} tabIndex={-1}>{t.steps[step]}</h3><p>{t.selectedTrack}: <strong>{t[track]}</strong></p></div>
      {step === 0 && <>
        <div className={styles.fieldGrid}>{country("headquartersCountry")}{country("operatingCountry")}{field("city", "text", "address-level2")}</div>
        {track === "service_provider" && <fieldset className={styles.services}><legend>{t.services} *</legend><div>{serviceChoices.map((choice, index) => <label key={choice.value}>
          <input type="checkbox" name="serviceTypes" value={choice.value} checked={draft.serviceTypes.includes(choice.value)} aria-invalid={index === 0 && !!errors.serviceTypes} aria-describedby={errors.serviceTypes ? "partner-serviceTypes-error" : undefined}
            onChange={event => update("serviceTypes", event.target.checked ? [...draft.serviceTypes, choice.value] : draft.serviceTypes.filter(v => v !== choice.value))}/>{choice[language]}
        </label>)}</div>{errors.serviceTypes && <span className={styles.error} id="partner-serviceTypes-error">{errorText("serviceTypes")}</span>}</fieldset>}
        <div className={styles.coverage}><CountrySelect id="partner-servedCountries" label={t.coverage} value="" optional language={language} disabled={pending} error={errorText("servedCountries")} onChange={code => { if (code && !draft.servedCountries.includes(code)) update("servedCountries", [...draft.servedCountries, code]); }}/>
          {!!draft.servedCountries.length && <ul className={styles.chips}>{draft.servedCountries.map(code => <li key={code}>{countryLabel(code, language)}<button type="button" aria-label={`${t.remove} ${countryLabel(code, language)}`} onClick={() => update("servedCountries", draft.servedCountries.filter(c => c !== code))}><X size={14}/></button></li>)}</ul>}
        </div>
      </>}
      {step === 1 && <>
        <div className={styles.fieldGrid}>{field("companyName", "text", "organization")}{field("websiteUrl", "url", "url")}</div>
        <div className={styles.field}><label htmlFor="partner-companyDescription">{t.companyDescription} *</label><textarea id="partner-companyDescription" name="companyDescription" required rows={5} maxLength={3000} value={draft.companyDescription} onChange={event => update("companyDescription", event.target.value)} aria-invalid={!!errors.companyDescription} aria-describedby={errors.companyDescription ? "partner-companyDescription-error" : undefined}/>{errorText("companyDescription") && <span className={styles.error} id="partner-companyDescription-error">{errorText("companyDescription")}</span>}</div>
      </>}
      {step === 2 && <>
        <div className={styles.fieldGrid}>{field("contactName", "text", "name")}{field("contactRole", "text", "organization-title")}{field("email", "email", "email")}</div>
        <div className={styles.phoneGrid}><div className={styles.field}><label htmlFor="partner-phoneCountry">{t.phoneCountry} *</label><select id="partner-phoneCountry" name="phoneCountry" value={draft.phoneCountry} required aria-invalid={!!errors.phoneCountry} aria-describedby={errors.phoneCountry ? "partner-phoneCountry-error" : "partner-phone-hint"} onChange={event => update("phoneCountry", event.target.value)}><option value="">{t.phoneCountry}</option>{countries.map(c => <option key={c.code} value={c.code}>{c[language]} ({c.dial})</option>)}</select>{errorText("phoneCountry") && <span id="partner-phoneCountry-error" className={styles.error}>{errorText("phoneCountry")}</span>}</div>{field("phoneNumber", "tel", "tel-national")}</div>
        <p id="partner-phone-hint" className={styles.hint}>{t.phoneHint}</p>
        <section className={styles.review} aria-label={t.review}><h4>{t.review}</h4>{summary.map(group => <section key={group.step}><div className={styles.reviewHeading}><h5>{group.title}</h5>{group.step < 2 && <button type="button" onClick={() => { setStep(group.step); setErrors({}); }}>{t.edit}<span className={styles.srOnly}> {group.title}</span></button>}</div><dl>{group.items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</section>
        <label className={styles.consent}><input id="partner-termsAccepted" name="termsAccepted" type="checkbox" checked={draft.termsAccepted} required aria-invalid={!!errors.termsAccepted} aria-describedby={errors.termsAccepted ? "partner-termsAccepted-error" : undefined} onChange={event => update("termsAccepted", event.target.checked)}/><span>{t.privacy} <Link href="/privacy" target="_blank" rel="noopener noreferrer">{t.privacyLink}</Link>.</span></label>
        {errorText("termsAccepted") && <span id="partner-termsAccepted-error" className={styles.error}>{errorText("termsAccepted")}</span>}
        <p className={styles.disclaimer}>{t.disclaimer}</p>
      </>}
      {failed && <div role="alert" className={styles.failure}>{t.failed}</div>}
      <div className={styles.formActions}>{step > 0 && <button className={styles.secondaryButton} type="button" onClick={() => { setStep(current => current - 1); setErrors({}); }}>{t.back}</button>}
        {step < 2 ? <button className={styles.primaryButton} type="button" onClick={advance}>{t.next}<DirectionArrow size={18} aria-hidden="true"/></button> : <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? <LoaderCircle size={18} className={styles.spinner} aria-hidden="true"/> : <Send size={18} aria-hidden="true"/>}{pending ? t.sending : t.send}</button>}
      </div>
      <p className={styles.secureNote}><LockKeyhole size={14} aria-hidden="true"/>{t.noFile}</p>
    </fieldset>
  </form>;
}
