"use client";

import { createClient } from "../../../lib/supabase/client";
import { useState } from "react";
import { getAdminTranslations, useLanguage } from "../../../core/i18n";
import { useTheme } from "../../../core/theme";

export default function Topbar() {
  const [searchValue, setSearchValue] = useState("");

  const { language, toggleLanguage } = useLanguage();

  const t = getAdminTranslations(language);

  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="nr-admin-topbar">
      <div className="nr-admin-topbar-title">
        <span>{t.topbar.title}</span>
        <small>{t.topbar.subtitle}</small>
      </div>

      <div className="nr-admin-topbar-actions">
        <button
          type="button"
          onClick={async () => {
            const { error } = await createClient("admin").auth.signOut({
              scope: "local",
            });
            if (!error) window.location.assign("/admin/login");
          }}
        >
          {language === "ar" ? "خروج الإدارة" : "Sign out of admin"}
        </button>
        <label className="nr-admin-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t.topbar.searchPlaceholder}
            aria-label={t.topbar.searchPlaceholder}
          />
        </label>

        <button
          type="button"
          className="nr-admin-icon-button"
          aria-label={t.topbar.notifications}
        >
          <span aria-hidden="true">◌</span>
        </button>

        <button
          type="button"
          className="nr-topbar-language"
          onClick={toggleLanguage}
          aria-label={t.topbar.switchLanguage}
        >
          {language === "ar" ? "EN" : "AR"}
        </button>

        <button
          type="button"
          className="nr-topbar-theme"
          onClick={toggleTheme}
          aria-label={
            language === "ar"
              ? isDark
                ? "تفعيل الوضع الفاتح"
                : "تفعيل الوضع الداكن"
              : isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
          }
          title={
            language === "ar"
              ? isDark
                ? "الوضع الفاتح"
                : "الوضع الداكن"
              : isDark
                ? "Light mode"
                : "Dark mode"
          }
        >
          <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
        </button>

        <button
          type="button"
          className="nr-admin-user"
          aria-label={language === "ar" ? "قائمة المستخدم" : "User menu"}
        >
          <span className="nr-admin-user-avatar">I</span>

          <span className="nr-admin-user-copy">
            <strong>ISSA</strong>
            <small>Super Admin</small>
          </span>

          <span aria-hidden="true">⌄</span>
        </button>
      </div>
    </header>
  );
}
