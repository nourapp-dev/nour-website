"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../src/lib/supabase/client";

export default function AdminInvitePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && mounted) {
        setErrorMessage("تعذر التحقق من جلسة الدعوة. افتح رابط الدعوة من البريد مرة أخرى.");
      }

      if (mounted) setIsReady(true);
    }

    void init();
    return () => { mounted = false; };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("admin_profiles")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    await supabase.auth.signOut();

    router.replace("/admin/login?invited=1");
    router.refresh();
  }

  return (
    <main className="nr-auth-page" dir="rtl">
      <section className="nr-auth-card">
        <div className="nr-auth-brand">
          <div className="nr-auth-logo">NR</div>
          <div>
            <span>NourApp Platform</span>
            <strong>تفعيل الحساب الإداري</strong>
          </div>
        </div>

        <div className="nr-auth-heading">
          <span>دعوة مستخدم</span>
          <h1>أنشئ كلمة المرور</h1>
          <p>أكمل تفعيل حسابك الإداري ثم سجل الدخول إلى لوحة نور آب.</p>
        </div>

        {!isReady ? (
          <div className="nr-auth-state">جاري التحقق من الدعوة...</div>
        ) : (
          <form className="nr-auth-form" onSubmit={handleSubmit}>
            <label>
              <span>كلمة المرور الجديدة</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              <span>تأكيد كلمة المرور</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {errorMessage ? <div className="nr-auth-error">{errorMessage}</div> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جارٍ تفعيل الحساب..." : "تفعيل الحساب"}
            </button>
          </form>
        )}
      </section>

      <style jsx>{`
        .nr-auth-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#07182c;color:#14253d}
        .nr-auth-card{width:min(100%,470px);padding:30px;border-radius:24px;background:#fff;box-shadow:0 28px 90px rgba(0,0,0,.28)}
        .nr-auth-brand{display:flex;align-items:center;gap:12px}.nr-auth-logo{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:#ffc313;font-weight:1000}
        .nr-auth-brand div:last-child{display:flex;flex-direction:column;gap:3px}.nr-auth-brand span{color:#718198;font-size:11px;font-weight:800}.nr-auth-brand strong{color:#17304f;font-size:13px}
        .nr-auth-heading{margin-top:28px}.nr-auth-heading>span{color:#176fe8;font-size:11px;font-weight:900}.nr-auth-heading h1{margin:7px 0 10px;font-size:30px}.nr-auth-heading p{margin:0;color:#6f7e92;line-height:1.8;font-size:13px}
        .nr-auth-form{display:grid;gap:16px;margin-top:24px}.nr-auth-form label{display:grid;gap:8px}.nr-auth-form label>span{font-size:12px;font-weight:900}
        .nr-auth-form input{min-height:50px;padding-inline:14px;border:1px solid #d6e0ec;border-radius:12px;background:#f8fafd;font:inherit}
        .nr-auth-form button{min-height:52px;border:0;border-radius:13px;background:#ffc313;color:#12345d;font:inherit;font-weight:1000;cursor:pointer}.nr-auth-form button:disabled{opacity:.65}
        .nr-auth-error{padding:11px 12px;border:1px solid rgba(220,38,38,.18);border-radius:10px;color:#b91c1c;background:rgba(220,38,38,.05);font-size:12px}
        .nr-auth-state{margin-top:22px;padding:18px;border:1px dashed #d6e0ec;border-radius:12px;color:#718198;background:#f8fafd;text-align:center;font-size:12px}
      `}</style>
    </main>
  );
}