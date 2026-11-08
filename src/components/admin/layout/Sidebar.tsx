"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Handshake,
  CalendarDays,
  Building2,
  Bus,
  FileCheck,
  Globe,
  MapPin,
  Newspaper,
  Images,
  MessageSquareQuote,
  Settings,
  Users,
  Scale,
  BarChart3,
  ListChecks,
  Bell,
  Activity,
  Search,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { useModalFocus } from "../../../features/admin-workspace/useModalFocus";
const navIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  applications: ClipboardList,
  partners: Handshake,
  bookings: CalendarDays,
  hotels: Building2,
  transports: Bus,
  visas: FileCheck,
  countries: Globe,
  cities: MapPin,
  articles: Newspaper,
  media: Images,
  "ceo-message": MessageSquareQuote,
  website: Images,
  settings: Settings,
  users: Users,
  legal: Scale,
  analytics: BarChart3,
  tasks: ListChecks,
  notifications: Bell,
  activity: Activity,
  search: Search,
  programs: FolderOpen,
  subscribers: Users,
};
function NavIcon({ route }: { route: string }) {
  const Icon = navIcons[route] ?? FolderOpen;
  return <Icon size={17} strokeWidth={1.8} />;
}
import { useLanguage } from "../../../core/i18n";
import { navigation } from "../../../features/admin-workspace/navigation";
import {
  can,
  useWorkspace,
} from "../../../features/admin-workspace/WorkspaceProvider";
export default function Sidebar({
  open,
  close,
  collapsed,
  toggle,
}: {
  open: boolean;
  close: () => void;
  collapsed: boolean;
  toggle: () => void;
}) {
  const path = usePathname();
  const { language } = useLanguage();
  const ar = language === "ar";
  const identity = useWorkspace();
  const sidebarRef = useRef<HTMLElement>(null);
  useModalFocus(open, sidebarRef, close);
  const host = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    } catch {
      return "";
    }
  })();
  const local = ["localhost", "127.0.0.1"].includes(host);
  return (
    <>
      {open && (
        <button
          className="aw-scrim"
          aria-label={ar ? "إغلاق القائمة" : "Close menu"}
          onClick={close}
        />
      )}
      <aside
        ref={sidebarRef}
        tabIndex={-1}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        className={`aw-sidebar ${open ? "is-open" : ""}`}
        aria-label={ar ? "التنقل الإداري" : "Admin navigation"}
      >
        <Link href="/admin/dashboard" className="aw-brand" onClick={close}>
          <Image
            src="/images/site/v-logo.png"
            alt="Nour App"
            width={42}
            height={42}
          />
          <span>
            <strong>نور آب · Nour App</strong>
            <small>{ar ? "مساحة الإدارة" : "Admin workspace"}</small>
          </span>
        </Link>
        <button
          className="aw-collapse"
          onClick={toggle}
          aria-label={ar ? "طي أو توسيع القائمة" : "Collapse or expand menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>
        <button
          className="aw-mobile-close"
          onClick={close}
          aria-label={ar ? "إغلاق" : "Close"}
        >
          <X />
        </button>
        <nav>
          {navigation.map(([id, arabic, english, items]) => {
            const visible = items.filter((item) => can(identity, item[3]));
            return visible.length ? (
              <section key={id}>
                <h2>{ar ? arabic : english}</h2>
                {visible.map(([route, arabicLabel, englishLabel]) => (
                  <Link
                    key={route}
                    href={`/admin/${route}`}
                    aria-current={
                      path === `/admin/${route}` ||
                      path.startsWith(`/admin/${route}/`)
                        ? "page"
                        : undefined
                    }
                    title={ar ? arabicLabel : englishLabel}
                    onClick={close}
                  >
                    <span className="aw-nav-mark" aria-hidden="true">
                      <NavIcon route={route} />
                    </span>
                    <span>{ar ? arabicLabel : englishLabel}</span>
                  </Link>
                ))}
              </section>
            ) : null;
          })}
        </nav>
        <footer>
          <strong>
            {local
              ? ar
                ? "بيئة محلية معزولة"
                : "Isolated local environment"
              : ar
                ? "مشروع متصل"
                : "Connected project"}
          </strong>
          <small dir="ltr">{host || "—"}</small>
          <p>
            {ar
              ? "حجز الويب مغلق · التطبيق قريبًا"
              : "Web booking closed · App coming soon"}
          </p>
        </footer>
      </aside>
    </>
  );
}
