"use client";

import { useMemo, useState } from "react";
import { signInAdmin } from "../../../src/features/auth/services/auth.service";
import { useRouter } from "next/navigation";
import { createClient } from "../../../src/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInAdmin(supabase, { email, password });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "تعذر تسجيل الدخول.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="nr-auth-page" dir="rtl">
      <section className="nr-auth-card">
        <div className="nr-auth-brand">
          <div className="nr-auth-logo">NR</div>
          <div>
            <span>NourApp Platform</span>
            <strong>تسجيل دخول الإدارة</strong>
          </div>
        </div>

        <div className="nr-auth-heading">
          <span>لوحة الإدارة</span>
          <h1>مرحبًا بعودتك</h1>
          <p>سجّل الدخول باستخدام حسابك الإداري للوصول إلى لوحة نور.</p>
        </div>

        <form className="nr-auth-form" onSubmit={handleSubmit}>
          <label>
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@nourappglobal.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? (
            <div className="nr-auth-error">{errorMessage}</div>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .nr-auth-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #07182c;
          color: #14253d;
        }
        .nr-auth-card {
          width: min(100%, 470px);
          padding: 30px;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.28);
        }
        .nr-auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nr-auth-logo {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #ffc313;
          font-weight: 1000;
        }
        .nr-auth-brand div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .nr-auth-brand span {
          color: #718198;
          font-size: 11px;
          font-weight: 800;
        }
        .nr-auth-brand strong {
          color: #17304f;
          font-size: 13px;
        }
        .nr-auth-heading {
          margin-top: 28px;
        }
        .nr-auth-heading > span {
          color: #176fe8;
          font-size: 11px;
          font-weight: 900;
        }
        .nr-auth-heading h1 {
          margin: 7px 0 10px;
          font-size: 30px;
        }
        .nr-auth-heading p {
          margin: 0;
          color: #6f7e92;
          line-height: 1.8;
          font-size: 13px;
        }
        .nr-auth-form {
          display: grid;
          gap: 16px;
          margin-top: 24px;
        }
        .nr-auth-form label {
          display: grid;
          gap: 8px;
        }
        .nr-auth-form label > span {
          font-size: 12px;
          font-weight: 900;
        }
        .nr-auth-form input {
          min-height: 50px;
          padding-inline: 14px;
          border: 1px solid #d6e0ec;
          border-radius: 12px;
          background: #f8fafd;
          font: inherit;
        }
        .nr-auth-form button {
          min-height: 52px;
          border: 0;
          border-radius: 13px;
          background: #ffc313;
          color: #12345d;
          font: inherit;
          font-weight: 1000;
          cursor: pointer;
        }
        .nr-auth-form button:disabled {
          opacity: 0.65;
        }
        .nr-auth-error {
          padding: 11px 12px;
          border: 1px solid rgba(220, 38, 38, 0.18);
          border-radius: 10px;
          color: #b91c1c;
          background: rgba(220, 38, 38, 0.05);
          font-size: 12px;
        }
      `}</style>
    </main>
  );
}
