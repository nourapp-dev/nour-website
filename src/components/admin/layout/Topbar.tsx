"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Menu, Moon, Sun, LogOut, Search } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { useLanguage } from "../../../core/i18n";
import { useTheme } from "../../../core/theme";
import { useWorkspace } from "../../../features/admin-workspace/WorkspaceProvider";
import { routeTitle } from "../../../features/admin-workspace/navigation";
import { confirmLeaving } from "../../../features/admin-workspace/useUnsaved";
export default function Topbar({ openMenu }: { openMenu: () => void }) {
  const { language, toggleLanguage } = useLanguage();
  const ar = language === "ar";
  const { isDark, toggleTheme } = useTheme();
  const identity = useWorkspace();
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const notifications = useQuery({
    queryKey: ["admin-workspace", "unread"],
    queryFn: async () => {
      const r = await createClient("admin")
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (r.error) throw r.error;
      return r.count ?? 0;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  async function logout() {
    if (
      busy ||
      !confirmLeaving(
        ar
          ? "لديك تعديلات غير محفوظة. هل تريد الخروج؟"
          : "You have unsaved changes. Sign out?",
      )
    )
      return;
    setBusy(true);
    setError("");
    const { error } = await createClient("admin").auth.signOut({
      scope: "local",
    });
    if (error) {
      setError(
        ar
          ? "تعذر تسجيل الخروج. أعد المحاولة."
          : "Sign out failed. Please retry.",
      );
      setBusy(false);
      return;
    }
    await cache.cancelQueries();
    cache.clear();
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <header className="aw-topbar">
      <a className="aw-skip" href="#admin-main">
        {ar ? "انتقل للمحتوى" : "Skip to content"}
      </a>
      <button
        className="aw-mobile-toggle"
        onClick={openMenu}
        aria-label={ar ? "فتح القائمة" : "Open menu"}
      >
        <Menu size={20} />
      </button>
      <div>
        <strong>{routeTitle(path, language)}</strong>
        <small>
          {ar ? "الأوقات بتوقيت الرياض" : "Times shown in Riyadh time"}
        </small>
      </div>
      <div className="aw-topbar-actions">
        <Link
          href="/admin/search"
          className="aw-icon"
          aria-label={
            ar ? "البحث في الطلبات المصرح بها" : "Search permitted requests"
          }
        >
          <Search size={20} />
        </Link>
        <Link
          href="/admin/notifications"
          className="aw-icon"
          aria-label={ar ? "الإشعارات" : "Notifications"}
        >
          <Bell size={20} />
          {notifications.isSuccess && notifications.data > 0 && (
            <span>{notifications.data}</span>
          )}
        </Link>
        <button
          onClick={toggleLanguage}
          aria-label={ar ? "Switch to English" : "التبديل للعربية"}
        >
          {ar ? "EN" : "عربي"}
        </button>
        <button
          onClick={toggleTheme}
          aria-label={ar ? "تبديل المظهر" : "Toggle appearance"}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <details className="aw-user-menu">
          <summary>
            <span className="aw-avatar">{identity.name.slice(0, 1)}</span>
            <span>{identity.name}</span>
          </summary>
          <div>
            <bdi>{identity.email}</bdi>
            <p>
              {identity.superAdmin
                ? ar
                  ? "المدير الأعلى"
                  : "Super administrator"
                : ar
                  ? "حساب إداري"
                  : "Administrator"}
            </p>
            <button onClick={() => void logout()} disabled={busy}>
              <LogOut size={17} />
              {busy
                ? ar
                  ? "جارٍ الخروج…"
                  : "Signing out…"
                : ar
                  ? "تسجيل الخروج"
                  : "Sign out"}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </details>
      </div>
    </header>
  );
}
