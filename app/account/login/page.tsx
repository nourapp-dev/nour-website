"use client";

import Link from "next/link";
import { getErrorMessage } from "../../../src/core/utils/errors";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient } from "../../../src/lib/supabase/client";
import { getSafeInternalPath } from "../../../src/core/utils/navigation";

function getNextPath() {
  const params = new URLSearchParams(window.location.search);
  return getSafeInternalPath(params.get("next"), "/account/profile");
}

export default function PilgrimLoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) window.location.replace(getNextPath());
    });
    return () => { active = false; };
  }, [supabase]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 أحرف على الأقل.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        window.location.assign(getNextPath());
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/account/profile` },
      });
      if (signUpError) throw signUpError;
      if (data.session) window.location.assign("/account/profile");
      else setMessage("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجل الدخول.");
    } catch (authError) {
      const text = getErrorMessage(authError, "");
      setError(text.includes("Invalid login") ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : text || "تعذر إكمال العملية.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pa-login" dir="rtl">
      <section className="pa-login-card">
        <Link className="pa-brand" href="/"><span>ن</span><div><strong>NourApp</strong><small>رفيقك لرحلة السعادة</small></div></Link>

        <div className="pa-coming-soon">
          <strong>الحجز متاح عبر تطبيق نور آب</strong>
          <span>لإتمام حجز برنامج العمرة، استخدم تطبيق نور آب واستمتع بتجربة حجز متكاملة وآمنة.</span>
        </div>

        <div className="pa-copy">
          <span><UserRound /> حساب المعتمر</span>
          <h1>{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}</h1>
          <p>{mode === "login" ? "سجل الدخول لإدارة حسابك وبياناتك، ولإتمام الحجز انتقل إلى تطبيق نور آب." : "أنشئ حسابك وجهّز بياناتك، ثم استخدم تطبيق نور آب لإتمام الحجز."}</p>
        </div>

        <form onSubmit={submit}>
          <label><span><Mail /> البريد الإلكتروني</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label><span><LockKeyhole /> كلمة المرور</span><div className="pa-password"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          {error ? <p className="pa-error">{error}</p> : null}
          {message ? <p className="pa-success">{message}</p> : null}
          <button className="pa-submit" type="submit" disabled={submitting}>{submitting ? "جارٍ المتابعة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
        </form>

        <button className="pa-switch" type="button" onClick={() => { setMode((v) => v === "login" ? "register" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}</button>
        <p className="pa-note">الحجز متاح حاليًا عبر تطبيق نور آب. يمكنك استخدام الموقع لإدارة حسابك وتجهيز بياناتك.</p>
      </section>

      <style jsx global>{`
        .pa-login{min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at top right,#eaf3ff 0,transparent 42%),#f7f9fc;color:#14253d}.pa-login-card{width:min(480px,100%);padding:30px;border:1px solid #dce5f0;border-radius:26px;background:#fff;box-shadow:0 24px 70px rgba(20,59,102,.12)}.pa-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit}.pa-brand>span{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:#176fe8;color:#fff;font-size:24px;font-weight:900}.pa-brand div{display:grid}.pa-brand strong{font-size:17px}.pa-brand small{color:#7b8a9e}.pa-coming-soon{display:grid;gap:5px;margin-top:22px;padding:14px 16px;border:1px solid rgba(23,111,232,.15);border-radius:15px;background:linear-gradient(135deg,#eef5ff,#f9fbff)}.pa-coming-soon strong{color:#176fe8;font-size:13px}.pa-coming-soon span{color:#64758b;font-size:12px;line-height:1.7}.pa-copy{margin:24px 0 22px}.pa-copy>span{display:flex;align-items:center;gap:7px;color:#176fe8;font-size:12px;font-weight:900}.pa-copy>span svg{width:17px}.pa-copy h1{margin:8px 0;font-size:32px}.pa-copy p{margin:0;color:#718198;line-height:1.8}.pa-login form{display:grid;gap:15px}.pa-login label{display:grid;gap:7px}.pa-login label>span{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:900;color:#526981}.pa-login label svg{width:16px}.pa-login input{width:100%;min-height:48px;border:1px solid #d7e1ec;border-radius:12px;padding:0 13px;font:inherit;outline:none}.pa-login input:focus{border-color:#176fe8;box-shadow:0 0 0 3px rgba(23,111,232,.1)}.pa-password{position:relative}.pa-password button{position:absolute;inset-inline-end:8px;top:7px;width:34px;height:34px;border:0;background:transparent;color:#718198;cursor:pointer}.pa-submit{min-height:49px;border:0;border-radius:13px;background:#176fe8;color:#fff;font-weight:900;cursor:pointer}.pa-submit:disabled{opacity:.55}.pa-switch{width:100%;margin-top:14px;border:0;background:transparent;color:#176fe8;font-weight:800;cursor:pointer}.pa-error,.pa-success{margin:0;padding:11px;border-radius:11px;font-size:12px;line-height:1.7}.pa-error{background:#fff1f0;color:#b42318}.pa-success{background:#eefaf2;color:#176b37}.pa-note{margin:18px 0 0;padding-top:16px;border-top:1px solid #edf1f5;text-align:center;color:#7a899b;font-size:11px;line-height:1.7}
      `}</style>
    </main>
  );
}
