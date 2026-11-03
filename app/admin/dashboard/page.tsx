"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Handshake,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";
import { getAdminAnalyticsSummary } from "../../../src/features/analytics/services/admin-analytics.service";

type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "expired" | "refunded";

type BookingRow = {
  id: string;
  reference: string;
  contact_name: string;
  travelers_count: number;
  total_amount: number | string;
  currency_code: string;
  status: BookingStatus;
  payment_status: string;
  created_at: string;
  programs: { title_ar: string; title_en: string } | { title_ar: string; title_en: string }[] | null;
};

type OverviewCard = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone?: "blue" | "green" | "gold" | "violet";
};

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const supabase = useMemo(() => createClient(), []);

  const analyticsQuery = useQuery({
    queryKey: ["admin", "analytics", "summary"],
    queryFn: () => getAdminAnalyticsSummary(supabase),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications", "new-counts"],
    queryFn: async () => {
      const [jobsResult, partnersResult] = await Promise.all([
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null),
        supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "new").is("deleted_at", null),
      ]);
      if (jobsResult.error) throw jobsResult.error;
      if (partnersResult.error) throw partnersResult.error;
      return { jobs: jobsResult.count ?? 0, partners: partnersResult.count ?? 0 };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const bookingsQuery = useQuery({
    queryKey: ["admin", "bookings", "dashboard"],
    queryFn: async () => {
      const [pending, confirmed, total, recent] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending_payment").is("deleted_at", null),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").is("deleted_at", null),
        supabase.from("bookings").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("bookings")
          .select("id,reference,contact_name,travelers_count,total_amount,currency_code,status,payment_status,created_at,programs(title_ar,title_en)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      for (const result of [pending, confirmed, total, recent]) {
        if (result.error) throw result.error;
      }

      return {
        pending: pending.count ?? 0,
        confirmed: confirmed.count ?? 0,
        total: total.count ?? 0,
        recent: (recent.data ?? []) as BookingRow[],
      };
    },
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  const today = new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const number = (value: number | undefined, loading: boolean, error: boolean) => {
    if (loading) return "...";
    if (error) return "—";
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US").format(value ?? 0);
  };

  const primaryCards: OverviewCard[] = [
    {
      title: isArabic ? "إجمالي الحجوزات" : "Total bookings",
      value: number(bookingsQuery.data?.total, bookingsQuery.isLoading, bookingsQuery.isError),
      description: isArabic ? "إجمالي الحجوزات المسجلة على المنصة" : "All bookings recorded on the platform",
      icon: CalendarCheck2,
      href: "/admin/bookings",
      tone: "blue",
    },
    {
      title: isArabic ? "الحجوزات المؤكدة" : "Confirmed bookings",
      value: number(bookingsQuery.data?.confirmed, bookingsQuery.isLoading, bookingsQuery.isError),
      description: isArabic ? "الحجوزات التي تم تأكيدها بنجاح" : "Bookings successfully confirmed",
      icon: CheckCircle2,
      href: "/admin/bookings?status=confirmed",
      tone: "green",
    },
    {
      title: isArabic ? "بانتظار الدفع" : "Pending payment",
      value: number(bookingsQuery.data?.pending, bookingsQuery.isLoading, bookingsQuery.isError),
      description: isArabic ? "حجوزات تحتاج متابعة قبل انتهاء المهلة" : "Bookings that need payment follow-up",
      icon: Clock3,
      href: "/admin/bookings?status=pending_payment",
      tone: "gold",
    },
    {
      title: isArabic ? "زيارات اليوم" : "Today's visits",
      value: number(analyticsQuery.data?.visitsToday, analyticsQuery.isLoading, analyticsQuery.isError),
      description: isArabic ? "إجمالي زيارات صفحات الموقع اليوم" : "Total website page visits today",
      icon: Activity,
      href: "/admin/analytics",
      tone: "violet",
    },
  ];

  const secondaryCards: OverviewCard[] = [
    {
      title: isArabic ? "الزوار الفريدون" : "Unique visitors",
      value: number(analyticsQuery.data?.uniqueVisitorsToday, analyticsQuery.isLoading, analyticsQuery.isError),
      description: isArabic ? "الجلسات المميزة المسجلة اليوم" : "Distinct visitor sessions today",
      icon: Users,
      href: "/admin/analytics",
      tone: "violet",
    },
    {
      title: isArabic ? "طلبات الانضمام" : "Join applications",
      value: number(applicationsQuery.data?.jobs, applicationsQuery.isLoading, applicationsQuery.isError),
      description: isArabic ? "طلبات جديدة بانتظار المراجعة" : "New applications awaiting review",
      icon: BriefcaseBusiness,
      href: "/admin/applications",
      tone: "blue",
    },
    {
      title: isArabic ? "طلبات الشراكة" : "Partner applications",
      value: number(applicationsQuery.data?.partners, applicationsQuery.isLoading, applicationsQuery.isError),
      description: isArabic ? "طلبات شراكة بانتظار المراجعة" : "Partnership requests awaiting review",
      icon: Handshake,
      href: "/admin/partners",
      tone: "gold",
    },
  ];

  const statusLabel = (status: BookingStatus) => {
    const ar: Record<BookingStatus, string> = { pending_payment: "بانتظار الدفع", confirmed: "مؤكد", cancelled: "ملغي", expired: "منتهي", refunded: "مسترد" };
    const en: Record<BookingStatus, string> = { pending_payment: "Pending payment", confirmed: "Confirmed", cancelled: "Cancelled", expired: "Expired", refunded: "Refunded" };
    return (isArabic ? ar : en)[status];
  };

  const formatMoney = (value: number | string, currency: string) =>
    `${new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

  const getProgramTitle = (row: BookingRow) => {
    const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
    return program ? (isArabic ? program.title_ar : program.title_en) : (isArabic ? "برنامج عمرة" : "Umrah program");
  };

  const renderCard = (card: OverviewCard, compact = false) => {
    const Icon = card.icon;
    return (
      <Link key={card.title} href={card.href} className={`nr-ops-stat ${compact ? "is-compact" : ""} is-${card.tone ?? "blue"}`}>
        <div className="nr-ops-stat-top">
          <span className="nr-ops-icon"><Icon size={21} /></span>
          <ArrowUpRight size={17} />
        </div>
        <strong>{card.value}</strong>
        <span className="nr-ops-stat-title">{card.title}</span>
        <small>{card.description}</small>
      </Link>
    );
  };

  return (
    <section className="nr-dashboard nr-ops-dashboard" dir={isArabic ? "rtl" : "ltr"}>
      <header className="nr-ops-head">
        <div>
          <span className="nr-dashboard-kicker">{isArabic ? "لوحة إدارة نور آب" : "Nour Administration"}</span>
          <h1>{isArabic ? "نظرة عامة على المنصة" : "Platform overview"}</h1>
          <p>{isArabic ? "ملخص واضح لأهم مؤشرات التشغيل والحجوزات والطلبات الحالية." : "A clear summary of current operations, bookings, and incoming requests."}</p>
        </div>
        <div className="nr-ops-date"><CalendarDays size={17} /><span>{today}</span></div>
      </header>

      <section className="nr-kpi-section">
        <div className="nr-kpi-heading">
          <div>
            <span className="nr-dashboard-kicker">{isArabic ? "مؤشرات الأداء" : "Performance indicators"}</span>
            <h2>{isArabic ? "الأداء التشغيلي اليوم" : "Today's operational performance"}</h2>
          </div>
          <small>{isArabic ? "الأهم أولًا" : "Priority metrics first"}</small>
        </div>

        <div className="nr-ops-stats nr-ops-stats--primary">
          {primaryCards.map((card) => renderCard(card))}
        </div>

        <div className="nr-ops-stats nr-ops-stats--secondary">
          {secondaryCards.map((card) => renderCard(card, true))}
        </div>
      </section>

      <section className="nr-ops-panel nr-ops-bookings-panel">
        <div className="nr-ops-panel-head">
          <div><span>{isArabic ? "الحجوزات" : "Bookings"}</span><h2>{isArabic ? "أحدث الحجوزات" : "Latest bookings"}</h2></div>
          <Link href="/admin/bookings">{isArabic ? "عرض جميع الحجوزات" : "View all bookings"}<ArrowUpRight size={16} /></Link>
        </div>

        {bookingsQuery.isLoading ? <div className="nr-ops-empty">{isArabic ? "جارٍ تحميل الحجوزات..." : "Loading bookings..."}</div> : null}
        {bookingsQuery.isError ? <div className="nr-ops-empty is-error">{isArabic ? "تعذر تحميل بيانات الحجوزات." : "Unable to load booking data."}</div> : null}
        {!bookingsQuery.isLoading && !bookingsQuery.isError && bookingsQuery.data?.recent.length === 0 ? <div className="nr-ops-empty">{isArabic ? "لا توجد حجوزات حتى الآن." : "No bookings yet."}</div> : null}

        {bookingsQuery.data?.recent.length ? (
          <div className="nr-ops-bookings">
            {bookingsQuery.data.recent.map((booking) => (
              <Link href={`/admin/bookings?booking=${booking.id}`} key={booking.id} className="nr-ops-booking-row">
                <div className="nr-ops-booking-main"><strong>{booking.reference}</strong><span>{getProgramTitle(booking)}</span><small>{booking.contact_name}</small></div>
                <div className="nr-ops-booking-meta"><span>{booking.travelers_count} {isArabic ? "مسافر" : "traveler(s)"}</span><strong>{formatMoney(booking.total_amount, booking.currency_code)}</strong></div>
                <div className="nr-ops-booking-end"><span className={`nr-ops-status is-${booking.status}`}>{statusLabel(booking.status)}</span><small>{formatDate(booking.created_at)}</small></div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="nr-ops-health">
        <Link href="/admin/bookings?status=pending_payment" className="nr-ops-health-card">
          <span className="nr-ops-health-icon"><CircleDollarSign size={20} /></span>
          <div><strong>{isArabic ? "متابعة الدفع" : "Payment follow-up"}</strong><p>{isArabic ? "راجع الحجوزات التي ما زالت بانتظار الدفع." : "Review bookings that are still awaiting payment."}</p></div>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/admin/subscribers" className="nr-ops-health-card">
          <span className="nr-ops-health-icon"><UserCheck size={20} /></span>
          <div><strong>{isArabic ? "المشتركون النشطون" : "Active subscribers"}</strong><p>{number(analyticsQuery.data?.activeSubscribers, analyticsQuery.isLoading, analyticsQuery.isError)} {isArabic ? "مشترك نشط" : "active subscribers"}</p></div>
          <ArrowUpRight size={17} />
        </Link>
        <Link href="/admin/analytics" className="nr-ops-health-card">
          <span className="nr-ops-health-icon"><Activity size={20} /></span>
          <div><strong>{isArabic ? "زيارات آخر 30 يومًا" : "Visits in 30 days"}</strong><p>{number(analyticsQuery.data?.visitsLast30Days, analyticsQuery.isLoading, analyticsQuery.isError)} {isArabic ? "زيارة" : "visits"}</p></div>
          <ArrowUpRight size={17} />
        </Link>
      </section>

      <style jsx>{`
        .nr-ops-dashboard{display:grid;gap:22px;color:var(--nour-text-primary)}
        .nr-ops-head{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;padding:4px 2px}
        .nr-ops-head h1{margin:7px 0 8px;color:var(--nour-text-primary);font-size:clamp(28px,3vw,40px);line-height:1.2}
        .nr-ops-head p{max-width:760px;margin:0;color:var(--nour-text-secondary);line-height:1.75}
        .nr-ops-date{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid var(--nour-border);border-radius:14px;background:var(--nour-surface);color:var(--nour-text-secondary);box-shadow:var(--nour-shadow-sm);font-size:12px;font-weight:800;white-space:nowrap}
        .nr-dashboard-kicker{color:var(--nour-primary);font-size:10px;font-weight:900;letter-spacing:.02em}

        .nr-kpi-section{display:grid;gap:12px;padding:18px;border:1px solid var(--nour-border);border-radius:22px;background:color-mix(in srgb,var(--nour-surface) 96%,var(--nour-primary));box-shadow:var(--nour-shadow-sm)}
        .nr-kpi-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:0 2px 4px}
        .nr-kpi-heading h2{margin:4px 0 0;color:var(--nour-text-primary);font-size:20px}
        .nr-kpi-heading>small{color:var(--nour-text-muted);font-size:10px;font-weight:800}

        .nr-ops-stats{display:grid;gap:12px}
        .nr-ops-stats--primary{grid-template-columns:repeat(4,minmax(0,1fr))}
        .nr-ops-stats--secondary{grid-template-columns:repeat(3,minmax(0,1fr))}
        .nr-ops-stat{position:relative;display:grid;gap:7px;min-height:166px;padding:17px;overflow:hidden;border:1px solid var(--nour-border);border-radius:18px;background:var(--nour-surface);color:var(--nour-text-primary);box-shadow:var(--nour-shadow-sm);text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
        .nr-ops-stat.is-compact{grid-template-columns:48px minmax(0,1fr) auto;grid-template-rows:auto auto;align-items:center;min-height:112px;gap:4px 12px;padding:14px 16px}
        .nr-ops-stat.is-compact .nr-ops-stat-top{grid-row:1/3;grid-column:1;align-self:center}
        .nr-ops-stat.is-compact .nr-ops-stat-top>svg{display:none}
        .nr-ops-stat.is-compact>strong{grid-column:3;grid-row:1/3;align-self:center;font-size:28px}
        .nr-ops-stat.is-compact .nr-ops-stat-title{grid-column:2;grid-row:1;align-self:end}
        .nr-ops-stat.is-compact small{grid-column:2;grid-row:2;align-self:start}
        .nr-ops-stat:hover{transform:translateY(-3px);border-color:var(--nour-border-strong);box-shadow:var(--nour-shadow-md)}
        .nr-ops-stat::before{content:"";position:absolute;inset-inline-start:0;top:0;width:4px;height:100%;background:var(--nour-primary)}
        .nr-ops-stat.is-green::before{background:var(--nour-success)}
        .nr-ops-stat.is-gold::before{background:var(--nour-warning)}
        .nr-ops-stat.is-violet::before{background:#8b6cf0}
        .nr-ops-stat-top{display:flex;align-items:center;justify-content:space-between;color:var(--nour-text-muted)}
        .nr-ops-icon,.nr-ops-health-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:color-mix(in srgb,var(--nour-primary) 12%,var(--nour-surface));color:var(--nour-primary)}
        .nr-ops-stat.is-green .nr-ops-icon{background:color-mix(in srgb,var(--nour-success) 12%,var(--nour-surface));color:var(--nour-success)}
        .nr-ops-stat.is-gold .nr-ops-icon{background:color-mix(in srgb,var(--nour-warning) 13%,var(--nour-surface));color:var(--nour-warning)}
        .nr-ops-stat.is-violet .nr-ops-icon{background:color-mix(in srgb,#8b6cf0 13%,var(--nour-surface));color:#8b6cf0}
        .nr-ops-stat>strong{font-size:30px;line-height:1}
        .nr-ops-stat-title{font-size:12px;font-weight:900}
        .nr-ops-stat small{color:var(--nour-text-secondary);font-size:10px;line-height:1.5}

        .nr-ops-panel{padding:20px;border:1px solid var(--nour-border);border-radius:20px;background:var(--nour-surface);box-shadow:var(--nour-shadow-sm)}
        .nr-ops-panel-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:15px}
        .nr-ops-panel-head span{color:var(--nour-primary);font-size:10px;font-weight:900}
        .nr-ops-panel-head h2{margin:4px 0 0;color:var(--nour-text-primary);font-size:20px}
        .nr-ops-panel-head>a{display:flex;align-items:center;gap:5px;color:var(--nour-primary);font-size:11px;font-weight:900;text-decoration:none}
        .nr-ops-bookings{display:grid}
        .nr-ops-booking-row{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(130px,.7fr) minmax(140px,.7fr);align-items:center;gap:16px;padding:15px 8px;border-top:1px solid var(--nour-border);border-radius:10px;color:var(--nour-text-primary);text-decoration:none;transition:background .18s ease}
        .nr-ops-booking-row:first-child{border-top:0}.nr-ops-booking-row:hover{background:var(--nour-surface-muted)}
        .nr-ops-booking-main,.nr-ops-booking-meta,.nr-ops-booking-end{display:grid;gap:4px}.nr-ops-booking-main strong{font-size:13px}.nr-ops-booking-meta strong{font-size:12px}
        .nr-ops-booking-main span,.nr-ops-booking-main small,.nr-ops-booking-meta span,.nr-ops-booking-end small{color:var(--nour-text-secondary);font-size:10px}.nr-ops-booking-end{justify-items:end}
        .nr-ops-status{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:0 8px;border-radius:999px;background:color-mix(in srgb,var(--nour-warning) 12%,var(--nour-surface));color:var(--nour-warning);font-size:9px;font-weight:900}
        .nr-ops-status.is-confirmed{background:color-mix(in srgb,var(--nour-success) 12%,var(--nour-surface));color:var(--nour-success)}
        .nr-ops-status.is-cancelled,.nr-ops-status.is-expired{background:color-mix(in srgb,var(--nour-danger) 12%,var(--nour-surface));color:var(--nour-danger)}
        .nr-ops-status.is-refunded{background:color-mix(in srgb,#8b6cf0 13%,var(--nour-surface));color:#8b6cf0}
        .nr-ops-empty{display:grid;place-items:center;min-height:190px;color:var(--nour-text-secondary);font-size:12px}.nr-ops-empty.is-error{color:var(--nour-danger)}

        .nr-ops-health{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .nr-ops-health-card{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:11px;padding:16px;border:1px solid var(--nour-border);border-radius:17px;background:var(--nour-surface);color:var(--nour-text-primary);box-shadow:var(--nour-shadow-sm);text-decoration:none;transition:transform .18s ease,background .18s ease}
        .nr-ops-health-card:hover{transform:translateY(-2px);background:var(--nour-surface-muted)}.nr-ops-health-card strong{font-size:12px}.nr-ops-health-card p{margin:3px 0 0;color:var(--nour-text-secondary);font-size:10px;line-height:1.5}.nr-ops-health-card>svg{color:var(--nour-text-muted)}

        @media(max-width:1300px){.nr-ops-stats--primary{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:1050px){.nr-ops-stats--secondary,.nr-ops-health{grid-template-columns:1fr}}
        @media(max-width:760px){.nr-ops-head,.nr-kpi-heading{align-items:flex-start;flex-direction:column}.nr-ops-stats--primary{grid-template-columns:1fr}.nr-ops-booking-row{grid-template-columns:1fr}.nr-ops-booking-end{justify-items:start}.nr-ops-panel-head{align-items:flex-start;flex-direction:column}.nr-ops-stat.is-compact{grid-template-columns:44px minmax(0,1fr) auto}}
        @media(max-width:520px){.nr-kpi-section{padding:14px}.nr-ops-stat.is-compact>strong{font-size:24px}}
      `}</style>
    </section>
  );
}
