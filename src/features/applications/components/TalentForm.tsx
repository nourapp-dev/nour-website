"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, LoaderCircle, LockKeyhole, Send, Trash2, Upload } from "lucide-react";
import CountrySelect from "./CountrySelect";
import { submitJobApplication, JobSubmissionError } from "../services/jobApplications";
import { careerText } from "../career-copy";
import { careerAreas, countries, cvMetadataError, emptyTalentDraft, internationalPhone, opportunityTypes, talentInput, validateTalentStep, workModes, type Language, type TalentDraft, type TalentErrors, type TalentError } from "../utils/talent-application";
import { countryLabel } from "../utils/partner-interest-form";
import base from "./partnership.module.css";
import styles from "./careers.module.css";

export default function TalentForm({ language, area, onAreaChange, step, onStepChange, onBusyChange }: { language: Language; area: string; onAreaChange: (area: string) => void; step: number; onStepChange: (step: number) => void; onBusyChange: (busy: boolean) => void }) {
  const t = careerText[language];
  const [values, setValues] = useState<TalentDraft>({ ...emptyTalentDraft });
  const draft = { ...values, careerArea: area };
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<TalentError | undefined>();
  const [errors, setErrors] = useState<TalentErrors>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reference, setReference] = useState("");
  const formRef = useRef<HTMLFormElement>(null), headingRef = useRef<HTMLHeadingElement>(null), successRef = useRef<HTMLHeadingElement>(null), fileRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false), focusErrors = useRef(false), previousStep = useRef(0), submissionKey = useRef<string | null>(null);
  useEffect(() => { submissionKey.current = null; }, [area]);
  useEffect(() => { if (focusErrors.current && Object.keys(errors).length) { formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); focusErrors.current = false; } }, [errors]);
  useEffect(() => { if (previousStep.current !== step) { if (!Object.keys(errors).length) headingRef.current?.focus(); previousStep.current = step; } }, [step, errors]);
  useEffect(() => { if (reference) successRef.current?.focus(); }, [reference]);
  const errorText = (key: keyof TalentErrors) => errors[key] ? t.errors[errors[key]!] : undefined;
  function update<K extends keyof TalentDraft>(key: K, value: TalentDraft[K]) {
    submissionKey.current = null;
    if (key === "careerArea") onAreaChange(String(value)); else setValues(current => ({ ...current, [key]: value }));
    setErrors(current => { const next = { ...current }; delete next[key]; return next; }); setFailed(false);
  }
  function go(index: number) { onStepChange(index); setErrors({}); }
  function next() {
    const found = validateTalentStep(step, draft);
    if (step === 1 && fileError) found.cv = fileError;
    focusErrors.current = true; setErrors(found);
    if (!Object.keys(found).length) onStepChange(step + 1);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (step !== 2 || lock.current || reference) return;
    for (let index=0; index<3; index++) {
      const found = validateTalentStep(index, draft); if (index===1 && fileError) found.cv=fileError;
      if (Object.keys(found).length) { focusErrors.current = true; setErrors(found); onStepChange(index); return; }
    }
    lock.current = true; setPending(true); onBusyChange(true); setFailed(false);
    try {
      submissionKey.current ??= crypto.randomUUID();
      const response = await submitJobApplication(talentInput(draft, submissionKey.current), file);
      setReference(response.id);
      setValues({ ...emptyTalentDraft }); setFile(null); setFileError(undefined); onAreaChange("");
    } catch (error) {
      if (error instanceof JobSubmissionError && error.code === "cv_invalid") { focusErrors.current = true; setFileError("cv_invalid"); setErrors({ cv: "cv_invalid" }); onStepChange(1); }
      else setFailed(true);
    } finally { lock.current = false; setPending(false); onBusyChange(false); }
  }
  function field(key: "city" | "currentJobTitle" | "yearsOfExperience" | "linkedinUrl" | "portfolioUrl" | "fullName" | "email" | "phoneNumber", type="text", autoComplete?: string) {
    const required = ["city", "fullName", "email", "phoneNumber"].includes(key);
    return <div className={base.field}><label htmlFor={`talent-${key}`}>{t[key]}{required && " *"}</label><input id={`talent-${key}`} name={key} type={type} value={draft[key]} onChange={event => update(key, event.target.value)} autoComplete={autoComplete} required={required} maxLength={type === "url" ? 500 : 200} min={type==="number"?0:undefined} step={type==="number"?1:undefined} dir={["email","tel","url"].includes(type)?"ltr":undefined} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`talent-${key}-error`:key==="yearsOfExperience"?"talent-years-hint":undefined}/>{errorText(key) && <span className={base.error} id={`talent-${key}-error`}>{errorText(key)}</span>}</div>;
  }
  const size = (bytes: number) => `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(bytes / 1024)} ${language === "ar" ? "ك.ب" : "KB"}`;
  const areaName = careerAreas.find(item => item.value === area)?.[language] ?? t.none;
  const summary = [
    { name: t.preferences, step: 0, rows: [[t.careerArea,areaName],[t.opportunityType,t[draft.opportunityType as keyof Pick<typeof t,"full_time"|"part_time"|"internship"|"freelance">] ?? t.none],[t.workMode,t[draft.workMode as keyof Pick<typeof t,"onsite"|"hybrid"|"remote"|"no_preference">]],[t.country,countryLabel(draft.country,language)],[t.city,draft.city]] },
    { name: t.experience, step: 1, rows: [[t.currentJobTitle,draft.currentJobTitle||t.none],[t.yearsOfExperience,draft.yearsOfExperience||t.none],[t.linkedinUrl,draft.linkedinUrl||t.none],[t.portfolioUrl,draft.portfolioUrl||t.none],[t.message,draft.message||t.none],[t.cv,file?`${file.name} · ${size(file.size)}`:t.none]] },
    { name: t.contact, step: 2, rows: [[t.fullName,draft.fullName],[t.email,draft.email],[t.phoneNumber,internationalPhone(draft)]] },
  ];
  if (reference) return <div role="status" className={base.success}><CheckCircle2 size={44} aria-hidden="true"/><h3 ref={successRef} tabIndex={-1}>{t.success}</h3><p>{t.received}</p><div><span>{t.reference}</span><bdi>{reference}</bdi></div><p>{t.disclaimer}</p></div>;
  const DirectionArrow=language==="ar"?ArrowLeft:ArrowRight;
  return <form className={base.form} ref={formRef} onSubmit={submit} noValidate aria-busy={pending} onKeyDown={event => { if (step < 2 && event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }}>
    <ol className={base.progress} aria-label={language==="ar"?"خطوات طلب الانضمام":"Talent application steps"}>{t.steps.map((label,index)=><li key={index} aria-current={step===index?"step":undefined} data-complete={index<step}><button type="button" disabled={pending||index>step} onClick={()=>go(index)}><span>{index<step?<Check size={16} aria-hidden="true"/>:index+1}</span><strong>{label}</strong></button></li>)}</ol>
    <fieldset disabled={pending} className={base.formBody}><legend className={base.srOnly}>{t.steps[step]}</legend>
      <div className={base.formIntro}><span>{t.step} {step+1} {t.of} 3</span><h3 ref={headingRef} tabIndex={-1}>{t.steps[step]}</h3><p>{t.pool}</p></div>
      {step===0&&<>
        <div className={base.fieldGrid}><div className={base.field}><label htmlFor="talent-careerArea">{t.careerArea} *</label><select id="talent-careerArea" value={area} onChange={event=>update("careerArea",event.target.value)} required aria-invalid={!!errors.careerArea&&!area} aria-describedby={errors.careerArea&&!area?"talent-careerArea-error":undefined}><option value="">{t.select}</option>{careerAreas.map(item=><option key={item.value} value={item.value}>{item[language]}</option>)}</select>{errors.careerArea&&!area&&<span id="talent-careerArea-error" className={base.error}>{errorText("careerArea")}</span>}</div>
        <div className={base.field}><label htmlFor="talent-opportunityType">{t.opportunityType} *</label><select id="talent-opportunityType" value={draft.opportunityType} required onChange={event=>update("opportunityType",event.target.value)} aria-invalid={!!errors.opportunityType} aria-describedby={errors.opportunityType?"talent-opportunityType-error":undefined}><option value="">{t.select}</option>{opportunityTypes.map(value=><option key={value} value={value}>{t[value]}</option>)}</select>{errorText("opportunityType")&&<span className={base.error} id="talent-opportunityType-error">{errorText("opportunityType")}</span>}</div>
        <div className={base.field}><label htmlFor="talent-workMode">{t.workMode} *</label><select id="talent-workMode" value={draft.workMode} onChange={event=>update("workMode",event.target.value)} required aria-invalid={!!errors.workMode} aria-describedby={errors.workMode?"talent-workMode-error":undefined}>{workModes.map(value=><option key={value} value={value}>{t[value]}</option>)}</select>{errorText("workMode")&&<span className={base.error} id="talent-workMode-error">{errorText("workMode")}</span>}</div>
        <CountrySelect id="talent-country" label={t.country} value={draft.country} language={language} disabled={pending} error={errorText("country")} onChange={code=>{update("country",code);if(!draft.phoneCountry&&code)update("phoneCountry",code);}}/>{field("city","text","address-level2")}</div><p className={base.disclaimer}>{t.poolHint}</p>
      </>}
      {step===1&&<>
        <div className={base.fieldGrid}>{field("currentJobTitle","text","organization-title")}{field("yearsOfExperience","number")}{field("linkedinUrl","url")}{field("portfolioUrl","url")}</div><p className={base.hint} id="talent-years-hint">{t.optionalYears}</p>
        <div className={styles.upload}><label htmlFor="talent-cv"><Upload size={19} aria-hidden="true"/>{t.cv}</label><p id="talent-cv-help">{t.cvHint}</p><input ref={fileRef} id="talent-cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-invalid={!!errors.cv||!!fileError} aria-describedby={errors.cv||fileError?"talent-cv-help talent-cv-error":"talent-cv-help"} onChange={event=>{
          const selected=event.target.files?.[0];if(!selected)return;
          const problem=cvMetadataError(selected);submissionKey.current=null;
          if(problem){setFileError(problem);setErrors(current=>({...current,cv:problem}));event.target.value="";return;}
          setFile(selected);setFileError(undefined);setErrors(current=>{const next={...current};delete next.cv;return next;});setFailed(false);
        }}/>
        {file&&<div className={styles.file}><FileText size={25} aria-hidden="true"/><div><strong>{file.name}</strong><span>{size(file.size)}</span></div><button type="button" onClick={()=>fileRef.current?.click()}>{t.replace}</button><button type="button" onClick={()=>{setFile(null);setFileError(undefined);setErrors(current=>{const next={...current};delete next.cv;return next;});submissionKey.current=null;if(fileRef.current)fileRef.current.value="";}}><Trash2 size={15} aria-hidden="true"/>{t.remove}</button></div>}
        {!file && fileError && <button type="button" className={base.secondaryButton} onClick={()=>{setFileError(undefined);setErrors(current=>{const next={...current};delete next.cv;return next;});if(fileRef.current)fileRef.current.value="";submissionKey.current=null;}}>{t.remove}</button>}
        {(errors.cv||fileError)&&<span id="talent-cv-error" className={base.error}>{t.errors[(errors.cv??fileError)!]}</span>}</div>
        <div className={base.field}><label htmlFor="talent-message">{t.message}</label><textarea id="talent-message" rows={4} maxLength={3000} value={draft.message} onChange={event=>update("message",event.target.value)} aria-invalid={!!errors.message} aria-describedby={errors.message?"talent-message-error":undefined}/>{errorText("message")&&<span className={base.error} id="talent-message-error">{errorText("message")}</span>}</div>
      </>}
      {step===2&&<>
        <div className={base.fieldGrid}>{field("fullName","text","name")}{field("email","email","email")}</div><div className={base.phoneGrid}><div className={base.field}><label htmlFor="talent-phoneCountry">{t.phoneCountry} *</label><select id="talent-phoneCountry" required value={draft.phoneCountry} onChange={event=>update("phoneCountry",event.target.value)} aria-invalid={!!errors.phoneCountry} aria-describedby={errors.phoneCountry?"talent-phoneCountry-error":"talent-phone-help"}><option value="">{t.select}</option>{countries.map(country=><option key={country.code} value={country.code}>{country[language]} ({country.dial})</option>)}</select>{errorText("phoneCountry")&&<span className={base.error} id="talent-phoneCountry-error">{errorText("phoneCountry")}</span>}</div>{field("phoneNumber","tel","tel-national")}</div><p id="talent-phone-help" className={base.hint}>{t.phoneHint}</p>
        <section className={base.review} aria-label={t.review}><h4>{t.review}</h4>{summary.map(group=><section key={group.step}><div className={base.reviewHeading}><h5>{group.name}</h5>{group.step<2&&<button type="button" onClick={()=>go(group.step)}>{t.edit}<span className={base.srOnly}> {group.name}</span></button>}</div><dl>{group.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</section>
        <label className={base.consent}><input id="talent-privacyAccepted" type="checkbox" checked={draft.privacyAccepted} required onChange={event=>update("privacyAccepted",event.target.checked)} aria-invalid={!!errors.privacyAccepted} aria-describedby={errors.privacyAccepted?"talent-privacyAccepted-error":undefined}/><span>{t.privacy} <Link href="/privacy" target="_blank" rel="noopener noreferrer">{t.policy}</Link>.</span></label>{errorText("privacyAccepted")&&<span className={base.error} id="talent-privacyAccepted-error">{errorText("privacyAccepted")}</span>}<p className={base.disclaimer}>{t.disclaimer}</p>
      </>}
      {failed&&<div className={base.failure} role="alert">{t.failed}</div>}
      <div className={base.formActions}>{step>0&&<button type="button" className={base.secondaryButton} onClick={()=>go(step-1)}>{t.back}</button>}{step<2?<button type="button" className={base.primaryButton} onClick={next}>{t.next}<DirectionArrow size={18} aria-hidden="true"/></button>:<button type="submit" className={base.primaryButton} disabled={pending}>{pending?<LoaderCircle size={18} className={base.spinner} aria-hidden="true"/>:<Send size={18} aria-hidden="true"/>}{pending?t.sending:t.send}</button>}</div><p role="status" className={base.secureNote}><LockKeyhole size={14} aria-hidden="true"/>{pending?t.sending:t.secure}</p>
    </fieldset>
  </form>;
}
