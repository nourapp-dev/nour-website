"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
import { mayView } from "./navigation";
export type Identity = {
  id: string;
  name: string;
  email: string;
  superAdmin: boolean;
  permissions: string[];
};
const Context = createContext<Identity | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace identity unavailable");
  return value;
}
export function can(identity: Identity, module: string, action = "view") {
  return action === "view"
    ? mayView(module, identity.permissions, identity.superAdmin)
    : identity.superAdmin ||
        identity.permissions.includes(`${module}.manage`) ||
        identity.permissions.includes(`${module}.${action}`);
}
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const cache = useQueryClient();
  const [expired, setExpired] = useState(false);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [soon, setSoon] = useState(false);
  const query = useQuery({
    queryKey: ["admin-workspace", "identity"],
    queryFn: async () => {
      const { data, error } =
        await createClient("admin").rpc("workspace_context");
      if (error) throw error;
      return data as Identity;
    },
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    const client = createClient("admin");
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      setExpiry(session?.expires_at ?? null);
      if (event === "SIGNED_OUT") {
        setExpired(true);
        cache.clear();
        window.location.replace("/admin/login?reason=signed_out");
      }
      if (event === "TOKEN_REFRESHED") setSoon(false);
    });
    const back = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", back);
    const hide = () =>
      document
        .querySelector<HTMLElement>(".aw-shell")
        ?.style.setProperty("visibility", "hidden");
    window.addEventListener("pagehide", hide);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pageshow", back);
      window.removeEventListener("pagehide", hide);
    };
  }, [cache]);
  useEffect(() => {
    if (!expiry) return;
    const timer = window.setInterval(() => {
      setSoon(expiry * 1000 - Date.now() < 120_000);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [expiry]);
  if (expired)
    return (
      <p role="status">
        {ar
          ? "انتهت الجلسة. جارٍ الانتقال للدخول…"
          : "Session ended. Returning to sign in…"}
      </p>
    );
  if (query.isPending)
    return (
      <div className="aw-gate" role="status">
        {ar ? "جارٍ التحقق من جلسة الإدارة…" : "Verifying your admin session…"}
      </div>
    );
  if (
    query.isError &&
    query.error &&
    typeof query.error === "object" &&
    "code" in query.error &&
    query.error.code === "42501"
  )
    return (
      <div className="aw-gate" role="alert">
        <h1>
          {ar ? "لا تملك صلاحية الإدارة" : "Administrative access denied"}
        </h1>
        <p>
          {ar
            ? "تواصل مع مسؤول النظام للتحقق من دور حسابك."
            : "Contact your system administrator to review your account role."}
        </p>
        <a href="/admin/login">{ar ? "صفحة الدخول" : "Sign in"}</a>
      </div>
    );
  if (query.isError)
    return (
      <div className="aw-gate" role="alert">
        <h1>
          {ar ? "تعذر التحقق من صلاحية الوصول" : "Unable to verify access"}
        </h1>
        <p>
          {ar
            ? "تحقق من الاتصال وأعد المحاولة. لم تُنهَ جلستك بسبب خطأ الاتصال."
            : "Check your connection and retry. A connection error does not sign you out."}
        </p>
        <button onClick={() => void query.refetch()}>
          {ar ? "إعادة المحاولة" : "Retry"}
        </button>
        <a href="/admin/login">{ar ? "صفحة الدخول" : "Sign in"}</a>
      </div>
    );
  return (
    <Context.Provider value={query.data}>
      {soon && (
        <p className="aw-notice" role="status">
          {ar
            ? "تقترب صلاحية الجلسة من الانتهاء؛ سيحاول النظام تجديدها تلقائيًا. احفظ عملك."
            : "Your session is nearing expiry and will refresh automatically. Save your work."}
        </p>
      )}
      {children}
    </Context.Provider>
  );
}
