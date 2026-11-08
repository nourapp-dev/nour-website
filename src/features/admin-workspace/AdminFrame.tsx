"use client";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import Sidebar from "../../components/admin/layout/Sidebar";
import Topbar from "../../components/admin/layout/Topbar";
import { useLanguage } from "../../core/i18n";
import { routeTitle } from "./navigation";
import { WorkspaceProvider } from "./WorkspaceProvider";
export default function AdminFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  if (
    path === "/admin/website/preview" ||
    path === "/admin/login" ||
    path.startsWith("/admin/login/") ||
    path === "/admin/invite"
  )
    return (
      <div className="aw-auth" dir={language === "ar" ? "rtl" : "ltr"}>
        {children}
      </div>
    );
  return (
    <WorkspaceProvider>
      <div
        className={`aw-shell ${collapsed ? "aw-collapsed" : ""}`}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <Sidebar
          open={open}
          close={() => setOpen(false)}
          collapsed={collapsed}
          toggle={() => setCollapsed(!collapsed)}
        />
        <div className="aw-main">
          <Topbar openMenu={() => setOpen(!open)} />
          <main id="admin-main" className="aw-content">
            <nav
              className="aw-breadcrumb"
              aria-label={language === "ar" ? "مسار التنقل" : "Breadcrumb"}
            >
              <Link href="/admin/dashboard">
                {language === "ar" ? "مساحة العمل" : "Workspace"}
              </Link>
              <span>/</span>
              <span>{routeTitle(path, language)}</span>
            </nav>
            {children}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
