"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Search, Users } from "lucide-react";

import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";

type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "expired" | "refunded";

type BookingRow = {
  id: string;
  reference: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  travelers_count: number;
  total_amount: number | string;
  currency_code: string;
  status: BookingStatus;
  payment_status: string;
  reserved_until: string | null;
  created_at: string;
  programs: { title_ar: string; title_en: string } | { title_ar: string; title_en: string }[] | null;
  program_departures: { start_at: string } | { start_at: string }[] | null;
};

const statusOptions: (BookingStatus | "all")[] = ["all", "pending_payment", "confirmed", "cancelled", "expired", "refunded"];

export default function AdminBookingsPage() {
  return <Suspense fallback={null}><AdminBookingsContent /></Suspense>;
}

function AdminBookingsContent() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const [statusOverride, setStatus] = useState<BookingStatus | "all" | null>(null);
  const requestedStatus = params.get("status") as BookingStatus | null;
  const status = statusOverride ?? (requestedStatus && statusOptions.includes(requestedStatus) ? requestedStatus : "all");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["admin", "bookings", status],
    queryFn: async () => {
      let request = supabase
        .from("bookings")
        .select("id,reference,contact_name,contact_email,contact_phone,travelers_count,total_amount,currency_code,status,payment_status,reserved_until,created_at,programs(title_ar,title_en),program_departures(start_at)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") request = request.eq("status", status);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as BookingRow[];
    },
    staleTime: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  const labels: Record<BookingStatus | "all", string> = isArabic
    ? { all: "الكل", pending_payment: "بانتظار الدفع", confirmed: "مؤكد", cancelled: "ملغي", expired: "منتهي", refunded: "مسترد" }
    : { all: "All", pending_payment: "Pending payment", confirmed: "Confirmed", cancelled: "Cancelled", expired: "Expired", refunded: "Refunded" };

  const filtered = (query.data ?? []).filter((booking) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [booking.reference, booking.contact_name, booking.contact_email ?? "", booking.contact_phone ?? "", getProgramTitle(booking, isArabic)]
      .some((value) => value.toLowerCase().includes(term));
  });

  return (
    <section className="ab-page" dir={isArabic ? "rtl" : "ltr"}>
      <header className="ab-head">
        <div>
          <span><CalendarCheck2 />{isArabic ? "إدارة الحجوزات" : "Booking management"}</span>
          <h1>{isArabic ? "الحجوزات" : "Bookings"}</h1>
          <p>{isArabic ? "راجع الحجوزات المسجلة وحالة الدفع وعدد المسافرين ومواعيد الانطلاق." : "Review recorded bookings, payment status, travelers, and departure dates."}</p>
        </div>
        <strong>{new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US").format(filtered.length)}</strong>
      </header>

      <div className="ab-toolbar">
        <label className="ab-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isArabic ? "بحث برقم الحجز أو اسم المعتمر..." : "Search reference or pilgrim name..."} /></label>
        <div className="ab-filters">{statusOptions.map((item) => <button key={item} type="button" className={status === item ? "is-active" : ""} onClick={() => setStatus(item)}>{labels[item]}</button>)}</div>
      </div>

      {query.isLoading ? <div className="ab-state">{isArabic ? "جارٍ تحميل الحجوزات..." : "Loading bookings..."}</div> : null}
      {query.isError ? <div className="ab-state is-error">{isArabic ? "تعذر تحميل الحجوزات. تحقق من الصلاحيات ثم حاول مرة أخرى." : "Unable to load bookings. Check permissions and try again."}</div> : null}
      {!query.isLoading && !query.isError && filtered.length === 0 ? <div className="ab-state">{isArabic ? "لا توجد حجوزات مطابقة." : "No matching bookings."}</div> : null}

      {filtered.length > 0 ? (
        <div className="ab-table-wrap">
          <div className="ab-table">
            <div className="ab-row ab-row-head"><span>{isArabic ? "الحجز" : "Booking"}</span><span>{isArabic ? "البرنامج" : "Program"}</span><span>{isArabic ? "المعتمر" : "Pilgrim"}</span><span>{isArabic ? "المسافرون" : "Travelers"}</span><span>{isArabic ? "القيمة" : "Amount"}</span><span>{isArabic ? "الحالة" : "Status"}</span><span>{isArabic ? "التاريخ" : "Date"}</span></div>
            {filtered.map((booking) => (
              <article className="ab-row" key={booking.id}>
                <div><strong>{booking.reference}</strong><small>{booking.payment_status}</small></div>
                <div><strong>{getProgramTitle(booking, isArabic)}</strong><small>{getDepartureDate(booking, isArabic)}</small></div>
                <div><strong>{booking.contact_name}</strong><small>{booking.contact_email || booking.contact_phone || "—"}</small></div>
                <div className="ab-travelers"><Users /><strong>{booking.travelers_count}</strong></div>
                <strong>{formatMoney(booking.total_amount, booking.currency_code, isArabic)}</strong>
                <span className={`ab-status is-${booking.status}`}>{labels[booking.status]}</span>
                <small>{formatDate(booking.created_at, isArabic)}</small>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .ab-page{display:grid;gap:20px}.ab-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.ab-head>div>span{display:flex;align-items:center;gap:7px;color:#176fe8;font-size:11px;font-weight:900}.ab-head>div>span svg{width:17px}.ab-head h1{margin:7px 0 7px;font-size:36px}.ab-head p{margin:0;color:var(--admin-text-muted,#93a4bd);line-height:1.7}.ab-head>strong{font-size:34px;color:#176fe8}.ab-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px;border:1px solid var(--admin-border,rgba(148,163,184,.18));border-radius:17px;background:var(--admin-card,#fff)}.ab-search{min-width:280px;display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid var(--admin-border,rgba(148,163,184,.18));border-radius:12px;background:var(--admin-soft,rgba(23,111,232,.03))}.ab-search svg{width:17px;color:var(--admin-text-muted,#93a4bd)}.ab-search input{width:100%;height:42px;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:12px}.ab-filters{display:flex;flex-wrap:wrap;gap:6px}.ab-filters button{min-height:35px;padding:0 11px;border:1px solid var(--admin-border,rgba(148,163,184,.18));border-radius:10px;background:transparent;color:inherit;font:inherit;font-size:10px;font-weight:800;cursor:pointer}.ab-filters button.is-active{border-color:#176fe8;background:#176fe8;color:#fff}.ab-table-wrap{overflow:auto;border:1px solid var(--admin-border,rgba(148,163,184,.18));border-radius:18px;background:var(--admin-card,#fff)}.ab-table{min-width:1020px}.ab-row{display:grid;grid-template-columns:1.05fr 1.4fr 1.25fr .55fr .8fr .75fr .75fr;align-items:center;gap:12px;min-height:72px;padding:10px 16px;border-top:1px solid var(--admin-border,rgba(148,163,184,.13))}.ab-row:first-child{border-top:0}.ab-row-head{min-height:46px;background:var(--admin-soft,rgba(23,111,232,.04));color:var(--admin-text-muted,#93a4bd);font-size:9px;font-weight:900}.ab-row>div{display:grid;gap:4px}.ab-row strong{font-size:11px}.ab-row small{color:var(--admin-text-muted,#93a4bd);font-size:9px}.ab-travelers{display:flex!important;grid-template-columns:none;align-items:center;gap:6px}.ab-travelers svg{width:15px;color:#176fe8}.ab-status{justify-self:start;display:inline-flex;align-items:center;justify-content:center;min-height:27px;padding:0 9px;border-radius:999px;background:rgba(226,169,0,.1);color:#9a7400;font-size:9px;font-weight:900}.ab-status.is-confirmed{background:rgba(26,154,97,.1);color:#1a7c50}.ab-status.is-cancelled,.ab-status.is-expired{background:rgba(197,54,54,.08);color:#b23b3b}.ab-status.is-refunded{background:rgba(120,87,216,.09);color:#7857d8}.ab-state{display:grid;place-items:center;min-height:260px;border:1px dashed var(--admin-border,rgba(148,163,184,.22));border-radius:18px;color:var(--admin-text-muted,#93a4bd);font-size:12px}.ab-state.is-error{color:#b23b3b}@media(max-width:900px){.ab-toolbar,.ab-head{align-items:flex-start;flex-direction:column}.ab-search{width:100%;min-width:0}}
      `}</style>
    </section>
  );
}

function getProgramTitle(booking: BookingRow, isArabic: boolean) {
  const program = Array.isArray(booking.programs) ? booking.programs[0] : booking.programs;
  return program ? (isArabic ? program.title_ar : program.title_en) : (isArabic ? "برنامج عمرة" : "Umrah program");
}

function getDepartureDate(booking: BookingRow, isArabic: boolean) {
  const departure = Array.isArray(booking.program_departures) ? booking.program_departures[0] : booking.program_departures;
  if (!departure?.start_at) return "—";
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(departure.start_at));
}

function formatMoney(value: number | string, currency: string, isArabic: boolean) {
  return `${new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;
}

function formatDate(value: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
