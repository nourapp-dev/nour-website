"use client";

import Link from "next/link";
import { getErrorMessage } from "../../../src/core/utils/errors";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileUp, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "../../../src/lib/supabase/client";
import useCurrentTime from "../../../src/core/hooks/useCurrentTime";
import { getCurrentPilgrimAccount, savePilgrimProfile, uploadPilgrimDocument, type PilgrimProfile } from "../../../src/features/pilgrims/services/pilgrim-account.service";

const emptyProfile: Omit<PilgrimProfile, "userId"> = {
  fullName: "",
  phone: "",
  countryCode: "",
  nationalityCode: "",
  dateOfBirth: "",
  passportNumber: "",
  passportExpiry: "",
  residenceCountryCode: "",
  preferredLanguage: "ar",
};

export default function PilgrimProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const now = useCurrentTime(60_000);
  const [form, setForm] = useState(emptyProfile);
  const [email, setEmail] = useState("");
  const [hasPassport, setHasPassport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"passport" | "residence_permit" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentPilgrimAccount(supabase).then((account) => {
      if (!active) return;
      if (!account.user) {
        window.location.replace("/account/login?next=/account/profile");
        return;
      }
      setEmail(account.user.email ?? "");
      if (account.profile) {
        setForm(account.profile);
      }
      setHasPassport(account.documents.some((doc) => doc.documentType === "passport"));
    }).catch((loadError: unknown) => {
      if (active) setError(getErrorMessage(loadError, "تعذر تحميل البيانات."));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [supabase]);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.fullName.trim() || !form.dateOfBirth || !form.nationalityCode.trim() || !form.passportNumber.trim() || !form.passportExpiry) {
      setError("أكمل الاسم، تاريخ الميلاد، الجنسية، رقم الجواز، وتاريخ انتهاء الجواز.");
      return;
    }
    if (new Date(form.passportExpiry).getTime() <= Date.now()) {
      setError("يجب أن يكون جواز السفر ساري المفعول.");
      return;
    }
    setSaving(true);
    try {
      await savePilgrimProfile(supabase, form);
      setMessage("تم حفظ بيانات المعتمر بنجاح.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "تعذر حفظ البيانات."));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (type: "passport" | "residence_permit", file: File | null) => {
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(type);
    try {
      await uploadPilgrimDocument(supabase, type, file);
      if (type === "passport") setHasPassport(true);
      setMessage(type === "passport" ? "تم رفع جواز السفر بنجاح." : "تم رفع مستند الإقامة بنجاح.");
    } catch (uploadError) {
      const text = getErrorMessage(uploadError, "");
      setError(text === "file_too_large" ? "حجم الملف يجب ألا يتجاوز 10 ميجابايت." : text === "invalid_file_type" ? "الملفات المسموحة: JPG أو PNG أو PDF." : text || "تعذر رفع الملف.");
    } finally {
      setUploading(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  if (loading) return <main className="pap-loading" dir="rtl">جارٍ تحميل حساب المعتمر...</main>;

  const ready = Boolean(form.fullName.trim() && form.dateOfBirth && form.nationalityCode.trim() && form.passportNumber.trim() && form.passportExpiry && new Date(form.passportExpiry).getTime() > now && hasPassport);

  return (
    <main className="pap-page" dir="rtl">
      <div className="pap-shell">
        <header className="pap-head">
          <Link href="/" className="pap-brand"><span>ن</span><strong>NourApp</strong></Link>
          <button type="button" onClick={logout}><LogOut /> تسجيل الخروج</button>
        </header>

        <section className="pap-intro">
          <div><span><UserRound /> ملف المعتمر</span><h1>البيانات الرسمية</h1><p>هذه البيانات مطلوبة قبل إتمام أي حجز. تحفظ المستندات في مساحة خاصة وغير عامة.</p></div>
          <div className={ready ? "pap-status ready" : "pap-status"}><ShieldCheck /><strong>{ready ? "الملف مكتمل للحجز" : "الملف يحتاج إكمال"}</strong></div>
        </section>

        <form className="pap-form" onSubmit={save}>
          <section>
            <h2>البيانات الشخصية</h2>
            <div className="pap-grid">
              <label><span>البريد الإلكتروني</span><input value={email} disabled /></label>
              <label><span>الاسم الكامل حسب الجواز</span><input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required /></label>
              <label><span>رقم الجوال</span><input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
              <label><span>رمز الدولة</span><input placeholder="+966" value={form.countryCode} onChange={(e) => set("countryCode", e.target.value)} /></label>
              <label><span>تاريخ الميلاد</span><input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required /></label>
              <label><span>رمز الجنسية</span><input maxLength={3} placeholder="SAU" value={form.nationalityCode} onChange={(e) => set("nationalityCode", e.target.value.toUpperCase())} required /></label>
              <label><span>رقم جواز السفر</span><input value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value.toUpperCase())} required /></label>
              <label><span>تاريخ انتهاء الجواز</span><input type="date" value={form.passportExpiry} onChange={(e) => set("passportExpiry", e.target.value)} required /></label>
              <label><span>بلد الإقامة الحالي - رمز الدولة</span><input maxLength={3} placeholder="SAU" value={form.residenceCountryCode} onChange={(e) => set("residenceCountryCode", e.target.value.toUpperCase())} /></label>
              <label><span>اللغة المفضلة</span><select value={form.preferredLanguage} onChange={(e) => set("preferredLanguage", e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label>
            </div>
            <button className="pap-save" type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ البيانات"}</button>
          </section>

          <section>
            <h2>المستندات الرسمية</h2>
            <div className="pap-docs">
              <label className={hasPassport ? "done" : ""}><FileUp /><div><strong>صورة جواز السفر</strong><small>إلزامي لإتمام الحجز · JPG / PNG / PDF · حد أقصى 10MB</small>{hasPassport ? <em><CheckCircle2 /> تم الرفع</em> : null}</div><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => void upload("passport", e.target.files?.[0] ?? null)} disabled={uploading === "passport"} /></label>
              <label><FileUp /><div><strong>الإقامة</strong><small>اختياري الآن، ويطلب عند الحاجة حسب بلد الإقامة.</small></div><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => void upload("residence_permit", e.target.files?.[0] ?? null)} disabled={uploading === "residence_permit"} /></label>
            </div>
          </section>

          {error ? <p className="pap-error">{error}</p> : null}
          {message ? <p className="pap-success">{message}</p> : null}
        </form>
      </div>

      <style jsx global>{`
        .pap-page{min-height:100vh;padding:28px;background:#f6f9fd;color:#14253d}.pap-shell{width:min(1120px,100%);margin:auto}.pap-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}.pap-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}.pap-brand span{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#176fe8;color:#fff;font-size:23px;font-weight:900}.pap-head button{display:flex;align-items:center;gap:7px;border:1px solid #dce5f0;border-radius:11px;background:#fff;padding:9px 12px;color:#526981;cursor:pointer}.pap-head button svg{width:16px}.pap-intro{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:20px}.pap-intro>div>span{display:flex;align-items:center;gap:7px;color:#176fe8;font-size:12px;font-weight:900}.pap-intro svg{width:17px}.pap-intro h1{margin:7px 0 6px;font-size:36px}.pap-intro p{margin:0;color:#718198}.pap-status{display:flex;align-items:center;gap:8px;padding:11px 14px;border:1px solid #f2d1d1;border-radius:14px;background:#fff4f3;color:#b42318}.pap-status.ready{border-color:#cce7d4;background:#f0faf3;color:#176b37}.pap-form{display:grid;gap:18px}.pap-form>section{padding:22px;border:1px solid #dce5f0;border-radius:20px;background:#fff;box-shadow:0 14px 45px rgba(20,59,102,.05)}.pap-form h2{margin:0 0 16px;font-size:19px}.pap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pap-grid label{display:grid;gap:6px}.pap-grid span{font-size:12px;font-weight:800;color:#526981}.pap-grid input,.pap-grid select{min-height:44px;border:1px solid #d7e1ec;border-radius:11px;padding:0 11px;background:#fff;font:inherit;outline:none}.pap-grid input:disabled{background:#f5f7fa;color:#8794a6}.pap-grid input:focus,.pap-grid select:focus{border-color:#176fe8;box-shadow:0 0 0 3px rgba(23,111,232,.1)}.pap-save{margin-top:16px;min-height:44px;border:0;border-radius:11px;padding:0 18px;background:#176fe8;color:#fff;font-weight:900;cursor:pointer}.pap-docs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pap-docs label{position:relative;display:flex;align-items:flex-start;gap:12px;padding:18px;border:1px dashed #bfd0e4;border-radius:16px;background:#f9fbfe;cursor:pointer}.pap-docs label.done{border-style:solid;border-color:#bfe0c9;background:#f3fbf5}.pap-docs>label>svg{width:24px;color:#176fe8}.pap-docs label div{display:grid;gap:4px}.pap-docs small{color:#7a899b;line-height:1.6}.pap-docs em{display:flex;align-items:center;gap:5px;color:#176b37;font-size:11px;font-style:normal;font-weight:900}.pap-docs em svg{width:15px}.pap-docs input{position:absolute;inset:0;opacity:0;cursor:pointer}.pap-error,.pap-success{margin:0;padding:12px;border-radius:12px}.pap-error{background:#fff1f0;color:#b42318}.pap-success{background:#eefaf2;color:#176b37}.pap-loading{min-height:100vh;display:grid;place-items:center;color:#718198}@media(max-width:760px){.pap-page{padding:18px}.pap-intro{align-items:flex-start;flex-direction:column}.pap-grid,.pap-docs{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
