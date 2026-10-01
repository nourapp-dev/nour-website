"use client";

import Link from "next/link";
import { getErrorMessage } from "../../src/core/utils/errors";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck, UserRound, Users } from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import { createClient } from "../../src/lib/supabase/client";
import { createProgramBooking, type BookingTravelerInput, type CreatedBooking } from "../../src/features/bookings/services/public-booking.service";
import { buildBookingTravelers } from "../../src/features/bookings/utils/booking-travelers";
import { getCurrentPilgrimAccount, type PilgrimProfile } from "../../src/features/pilgrims/services/pilgrim-account.service";

type PreparedBookingSelection = {
  programId: string;
  departureId: string;
  priceTierId: string;
  travelers: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
};

type AccountState = {
  loading: boolean;
  signedIn: boolean;
  complete: boolean;
  email: string;
  profile: PilgrimProfile | null;
};

const BOOKING_STORAGE_KEY = "nour_booking_selection";

export default function ProgramBookingCheckout() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const supabase = useMemo(() => createClient(), []);
  const [selection, setSelection] = useState<PreparedBookingSelection | null>(null);
  const [account, setAccount] = useState<AccountState>({ loading: true, signedIn: false, complete: false, email: "", profile: null });
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [travelerEdits, setTravelerEdits] = useState<Record<number, Partial<BookingTravelerInput>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  useEffect(() => {
    getCurrentPilgrimAccount(supabase).then((result) => {
      setAccount({ loading: false, signedIn: Boolean(result.user), complete: result.complete, email: result.user?.email ?? "", profile: result.profile });
      if (result.user) setContactEmail(result.user.email ?? "");
      if (result.profile) {
        setContactName(result.profile.fullName);
        setContactPhone(result.profile.phone);
      }
    }).catch(() => setAccount({ loading: false, signedIn: false, complete: false, email: "", profile: null }));
  }, [supabase]);

  useEffect(() => {
    const readStored = () => {
      try {
        const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as PreparedBookingSelection;
        if (!parsed?.programId || !parsed?.departureId || !parsed?.priceTierId || !parsed?.travelers) return;
        setSelection(parsed);
        setTravelerEdits({});
      } catch {}
    };
    readStored();
    const onPrepared = (event: Event) => {
      const next = (event as CustomEvent<PreparedBookingSelection>).detail;
      if (!next) return;
      setSelection(next);
      setCreated(null);
      setError("");
      setTravelerEdits({});
      setTimeout(() => document.getElementById("booking-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    window.addEventListener("nour:booking-prepared", onPrepared as EventListener);
    return () => window.removeEventListener("nour:booking-prepared", onPrepared as EventListener);
  }, []);

  if (!selection) return null;

  const travelers = buildBookingTravelers(selection.travelers, account.profile, travelerEdits);

  const updateTraveler = (index: number, key: keyof BookingTravelerInput, value: string) => {
    setTravelerEdits((current) => ({ ...current, [index]: { ...current[index], [key]: value } }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!account.signedIn) {
      setError(isArabic ? "يجب تسجيل الدخول قبل إتمام الحجز." : "You must sign in before completing the booking.");
      return;
    }
    if (!account.complete) {
      setError(isArabic ? "أكمل بيانات المعتمر الرسمية وارفع جواز السفر قبل إتمام الحجز." : "Complete the pilgrim profile and upload the passport before booking.");
      return;
    }
    if (!contactName.trim() || (!contactEmail.trim() && !contactPhone.trim())) {
      setError(isArabic ? "أدخل اسم جهة الاتصال والبريد الإلكتروني أو رقم الجوال." : "Enter the contact name and an email or phone number.");
      return;
    }
    if (travelers.some((traveler) => !traveler.firstName.trim() || !traveler.lastName.trim() || !traveler.dateOfBirth || !traveler.nationalityCode?.trim() || !traveler.passportNumber?.trim())) {
      setError(isArabic ? "أكمل الاسم وتاريخ الميلاد والجنسية ورقم الجواز لكل مسافر." : "Complete name, birth date, nationality, and passport number for every traveler.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProgramBooking(supabase, {
        programId: selection.programId,
        departureId: selection.departureId,
        priceTierId: selection.priceTierId,
        travelersCount: selection.travelers,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        preferredLanguage: isArabic ? "ar" : "en",
        travelers,
      });
      setCreated(result);
      sessionStorage.removeItem(BOOKING_STORAGE_KEY);
    } catch (bookingError) {
      const code = getErrorMessage(bookingError, "");
      const copy: Record<string, string> = {
        authentication_required: isArabic ? "انتهت جلسة تسجيل الدخول. سجل الدخول مرة أخرى." : "Your session expired. Sign in again.",
        pilgrim_profile_required: isArabic ? "أكمل ملف المعتمر قبل الحجز." : "Complete the pilgrim profile before booking.",
        pilgrim_profile_incomplete: isArabic ? "بيانات المعتمر الرسمية غير مكتملة أو الجواز منتهي." : "The official pilgrim profile is incomplete or the passport is expired.",
        passport_document_required: isArabic ? "ارفع صورة جواز السفر قبل إتمام الحجز." : "Upload the passport document before booking.",
        insufficient_seats: isArabic ? "لم تعد المقاعد المطلوبة متاحة. حدّث الصفحة واختر عددًا أقل." : "The requested seats are no longer available.",
        departure_not_open: isArabic ? "موعد الانطلاق لم يعد متاحًا للحجز." : "This departure is no longer open for booking.",
        price_tier_not_available: isArabic ? "فئة السعر المختارة لم تعد متاحة." : "The selected price tier is no longer available.",
      };
      setError(copy[code] ?? (isArabic ? "تعذر إنشاء الحجز. يرجى المحاولة مرة أخرى." : "Could not create the booking. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <section id="booking-checkout" className="pbc-wrap" dir={isArabic ? "rtl" : "ltr"}>
        <div className="pbc-success"><CheckCircle2 /><div><span>{isArabic ? "تم إنشاء الحجز" : "Booking created"}</span><h2>{created.bookingReference}</h2><p>{isArabic ? `تم حجز المقاعد مؤقتًا حتى ${created.reservedUntil ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(created.reservedUntil)) : "إتمام الدفع"}.` : `Seats are held until ${created.reservedUntil ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(created.reservedUntil)) : "payment is completed"}.`}</p><strong>{new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(created.totalAmount)} {created.currencyCode}</strong></div></div>
        <style jsx global>{styles}</style>
      </section>
    );
  }

  if (account.loading) return <section id="booking-checkout" className="pbc-wrap"><div className="pbc-gate">{isArabic ? "جارٍ التحقق من حساب المعتمر..." : "Checking pilgrim account..."}</div><style jsx global>{styles}</style></section>;

  if (!account.signedIn) {
    return (
      <section id="booking-checkout" className="pbc-wrap" dir={isArabic ? "rtl" : "ltr"}>
        <div className="pbc-gate"><LockKeyhole /><h2>{isArabic ? "سجل الدخول لإتمام الحجز" : "Sign in to complete booking"}</h2><p>{isArabic ? "اختيار البرنامج والموعد متاح للزائر، لكن إنشاء الحجز يتطلب حسابًا مسجلاً بكلمة مرور." : "Guests can browse and select, but creating a booking requires a password-protected account."}</p><Link href={`/account/login?next=${encodeURIComponent("/account/profile")}`}>{isArabic ? "تسجيل الدخول أو إنشاء حساب" : "Sign in or create account"}</Link></div><style jsx global>{styles}</style>
      </section>
    );
  }

  if (!account.complete) {
    return (
      <section id="booking-checkout" className="pbc-wrap" dir={isArabic ? "rtl" : "ltr"}>
        <div className="pbc-gate"><ShieldCheck /><h2>{isArabic ? "أكمل بياناتك الرسمية أولًا" : "Complete your official profile first"}</h2><p>{isArabic ? "يلزم إدخال بيانات جواز السفر وتاريخ الميلاد والجنسية ورفع صورة جواز السفر قبل إنشاء الحجز." : "Passport details, birth date, nationality, and a passport document are required before booking."}</p><Link href="/account/profile">{isArabic ? "إكمال ملف المعتمر" : "Complete pilgrim profile"}</Link></div><style jsx global>{styles}</style>
      </section>
    );
  }

  return (
    <section id="booking-checkout" className="pbc-wrap" dir={isArabic ? "rtl" : "ltr"}>
      <div className="pbc-container">
        <div className="pbc-head"><span>{isArabic ? "بيانات الحجز" : "Booking details"}</span><h2>{isArabic ? "أكمل بيانات المسافرين" : "Complete traveler details"}</h2><p>{isArabic ? "تم التحقق من تسجيل الدخول واكتمال ملف المعتمر. سيتم التحقق من التوفر مرة أخرى عند إنشاء الحجز." : "Your account and official profile are verified. Availability is checked again when creating the booking."}</p></div>
        <form className="pbc-form" onSubmit={submit}>
          <section><h3><UserRound />{isArabic ? "بيانات التواصل" : "Contact details"}</h3><div className="pbc-fields"><label><span>{isArabic ? "الاسم الكامل" : "Full name"}</span><input value={contactName} onChange={(e) => setContactName(e.target.value)} required /></label><label><span>{isArabic ? "البريد الإلكتروني" : "Email"}</span><input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label><label><span>{isArabic ? "رقم الجوال" : "Phone"}</span><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></label></div></section>
          <section><h3><Users />{isArabic ? "بيانات المسافرين الرسمية" : "Official traveler details"}</h3><div className="pbc-travelers">{travelers.map((traveler, index) => <article key={index}><strong>{isArabic ? `المسافر ${index + 1}` : `Traveler ${index + 1}`}</strong><div className="pbc-fields"><label><span>{isArabic ? "الاسم الأول" : "First name"}</span><input value={traveler.firstName} onChange={(e) => updateTraveler(index, "firstName", e.target.value)} required /></label><label><span>{isArabic ? "اسم العائلة" : "Last name"}</span><input value={traveler.lastName} onChange={(e) => updateTraveler(index, "lastName", e.target.value)} required /></label><label><span>{isArabic ? "تاريخ الميلاد" : "Date of birth"}</span><input type="date" value={traveler.dateOfBirth ?? ""} onChange={(e) => updateTraveler(index, "dateOfBirth", e.target.value)} required /></label><label><span>{isArabic ? "رمز الجنسية" : "Nationality code"}</span><input maxLength={3} placeholder="SAU" value={traveler.nationalityCode ?? ""} onChange={(e) => updateTraveler(index, "nationalityCode", e.target.value.toUpperCase())} required /></label><label><span>{isArabic ? "رقم جواز السفر" : "Passport number"}</span><input value={traveler.passportNumber ?? ""} onChange={(e) => updateTraveler(index, "passportNumber", e.target.value.toUpperCase())} required /></label></div></article>)}</div></section>
          <aside className="pbc-summary"><div><span>{isArabic ? "عدد المسافرين" : "Travelers"}</span><strong>{selection.travelers}</strong></div><div><span>{isArabic ? "الإجمالي" : "Total"}</span><strong>{new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(selection.totalPrice)} {selection.currencyCode}</strong></div></aside>
          {error ? <p className="pbc-error">{error}</p> : null}
          <button className="pbc-submit" type="submit" disabled={submitting}>{submitting ? (isArabic ? "جارٍ إنشاء الحجز..." : "Creating booking...") : (isArabic ? "تأكيد وإنشاء الحجز" : "Confirm and create booking")}</button>
        </form>
      </div>
      <style jsx global>{styles}</style>
    </section>
  );
}

const styles = `
.pbc-wrap{padding:42px 0 58px;background:#fff;color:#14253d}.pbc-container{width:min(1160px,calc(100% - 56px));margin:auto}.pbc-head{margin-bottom:20px}.pbc-head>span{color:#176fe8;font-size:11px;font-weight:900}.pbc-head h2{margin:7px 0 8px;font-size:clamp(28px,4vw,40px)}.pbc-head p{margin:0;color:#718198}.pbc-form{display:grid;gap:18px}.pbc-form>section,.pbc-summary{border:1px solid #dce5f0;border-radius:20px;padding:20px;background:#fff;box-shadow:0 14px 45px rgba(20,59,102,.05)}.pbc-form h3{display:flex;align-items:center;gap:8px;margin:0 0 16px}.pbc-form h3 svg{width:18px;color:#176fe8}.pbc-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pbc-fields label{display:grid;gap:6px}.pbc-fields span{font-size:12px;font-weight:800;color:#526981}.pbc-fields input{min-height:44px;border:1px solid #d7e1ec;border-radius:11px;padding:0 11px;font:inherit;outline:none}.pbc-fields input:focus{border-color:#176fe8;box-shadow:0 0 0 3px rgba(23,111,232,.1)}.pbc-travelers{display:grid;gap:14px}.pbc-travelers article{padding:15px;border:1px solid #edf1f5;border-radius:15px;background:#fbfcfe}.pbc-travelers article>strong{display:block;margin-bottom:12px}.pbc-summary{display:flex;justify-content:space-between;gap:18px}.pbc-summary div{display:grid;gap:4px}.pbc-summary span{color:#718198;font-size:12px}.pbc-summary strong{font-size:20px}.pbc-error{margin:0;padding:12px;border-radius:12px;background:#fff1f0;color:#b42318}.pbc-submit{min-height:48px;border:0;border-radius:13px;background:#176fe8;color:#fff;font-weight:900;cursor:pointer}.pbc-submit:disabled{opacity:.55}.pbc-success{width:min(760px,calc(100% - 32px));margin:auto;display:flex;gap:18px;padding:28px;border:1px solid #cfe8d7;border-radius:22px;background:#f2fbf5}.pbc-success>svg{width:36px;height:36px;color:#16803d;flex:0 0 auto}.pbc-success span{color:#16803d;font-size:12px;font-weight:900}.pbc-success h2{margin:5px 0 7px;font-size:28px}.pbc-success p{color:#587064;line-height:1.7}.pbc-success strong{font-size:22px;color:#176fe8}.pbc-gate{width:min(680px,calc(100% - 32px));margin:auto;display:grid;justify-items:center;text-align:center;gap:10px;padding:30px;border:1px solid #dce5f0;border-radius:22px;background:#f9fbfe}.pbc-gate>svg{width:38px;height:38px;color:#176fe8}.pbc-gate h2{margin:4px 0 0;font-size:28px}.pbc-gate p{margin:0;color:#718198;line-height:1.8}.pbc-gate a{margin-top:7px;display:inline-flex;align-items:center;justify-content:center;min-height:45px;padding:0 18px;border-radius:12px;background:#176fe8;color:#fff;text-decoration:none;font-weight:900}@media(max-width:760px){.pbc-container{width:min(100% - 24px,1160px)}.pbc-fields{grid-template-columns:1fr}.pbc-summary{flex-direction:column}}
`;
