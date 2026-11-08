import type { ReactNode } from "react";

import AdminFrame from "../../src/features/admin-workspace/AdminFrame";
import { ToastProvider } from "../../src/core/notifications";
import { ThemeProvider } from "../../src/core/theme";

import "../../src/styles/admin/admin.css";
import "../../src/styles/admin/workspace.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AdminFrame>{children}</AdminFrame>
      </ToastProvider>
    </ThemeProvider>
  );
}
