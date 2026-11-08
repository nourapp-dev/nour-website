"use client";
import { useRef, useState, Suspense } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAdmin } from "../../../src/features/auth/services/auth.service";
import { createClient } from "../../../src/lib/supabase/client";
import { useLanguage } from "../../../src/core/i18n";
import { useTheme } from "../../../src/core/theme";
import { safeAdminNext } from "../../../src/features/admin-workspace/contracts";
export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
function AdminLoginForm() {
  const params = useSearchParams();
  const { language, toggleLanguage } = useLanguage();
  const ar = language === "ar";
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const lock = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await signInAdmin(createClient("admin"), { email, password });
      const next = safeAdminNext(
        new URLSearchParams(window.location.search).get("next"),
      );
      setPassword("");
      router.replace(next);
      router.refresh();
    } catch (error) {
      const code =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      setError(
        code === "admin_access_required"
          ? ar
            ? "هذا الحساب لا يملك صلاحية الإدارة."
            : "This account does not have administrative access."
          : /fetch|network|connection/i.test(code)
            ? ar
              ? "تعذر الاتصال بخدمة الدخول. تحقق من الاتصال وحاول مجددًا."
              : "Unable to connect to authentication. Check your connection and retry."
            : ar
              ? "تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور."
              : "Unable to sign in. Check your email and password.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="aw-login">
      <section className="aw-login-card">
        <div className="aw-login-tools">
          <button onClick={toggleLanguage}>{ar ? "EN" : "عربي"}</button>
          <button onClick={toggleTheme}>{ar ? "المظهر" : "Appearance"}</button>
        </div>
        <Image
          src="/images/site/v-logo.png"
          alt="Nour App"
          width={64}
          height={64}
          priority
        />
        <p className="aw-eyebrow">
          NOUR APP · {ar ? "الإدارة" : "ADMINISTRATION"}
        </p>
        <h1>{ar ? "مرحبًا بعودتك" : "Welcome back"}</h1>
        <p>
          {ar
            ? "سجّل الدخول إلى مساحة عمل نور آب."
            : "Sign in to your Nour App workspace."}
        </p>
        {params.get("error") === "forbidden" && (
          <p className="aw-error" role="alert">
            {ar
              ? "هذا الحساب لا يملك صلاحية الإدارة. تواصل مع مسؤول النظام."
              : "This account does not have administrative access. Contact your system administrator."}
          </p>
        )}
        {params.get("reason") === "session_required" && (
          <p className="aw-muted" role="status">
            {ar
              ? "يلزم تسجيل الدخول لمتابعة المسار المطلوب."
              : "Sign in to continue to your requested page."}
          </p>
        )}
        <form onSubmit={submit} aria-busy={busy}>
          <label>
            {ar ? "البريد الإلكتروني" : "Email"}
            <input
              name="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label>
            {ar ? "كلمة المرور" : "Password"}
            <span className="aw-password">
              <input
                name="password"
                dir="ltr"
                type={shown ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-pressed={shown}
                aria-label={
                  ar
                    ? shown
                      ? "إخفاء كلمة المرور"
                      : "إظهار كلمة المرور"
                    : shown
                      ? "Hide password"
                      : "Show password"
                }
                onClick={() => setShown(!shown)}
              >
                {shown ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </label>
          {error && (
            <p role="alert" className="aw-error">
              {error}
            </p>
          )}
          <button className="aw-primary" disabled={busy} type="submit">
            {busy
              ? ar
                ? "جارٍ التحقق…"
                : "Signing in…"
              : ar
                ? "تسجيل الدخول"
                : "Sign in"}
          </button>
        </form>
        <p className="aw-muted">
          {ar
            ? "للحصول على صلاحية الإدارة أو استعادة الوصول، تواصل مع مسؤول النظام."
            : "Contact your system administrator for access or account recovery."}
        </p>
      </section>
    </main>
  );
}
