"use client";

import { useEffect, useMemo, useState } from "react";

import {
  archiveJobApplication,
  getJobApplicationCvUrl,
  listJobApplications,
  saveJobApplicationNotes,
  updateJobApplicationStatus,
} from "../../../src/features/applications/services/adminJobApplications";

import {
  type ApplicationStatus,
  type JobApplication,
} from "../../../src/features/applications/types/jobApplications";

import { useLanguage } from "../../../src/core/i18n";

const statusOptions: ApplicationStatus[] = [
  "new",
  "under_review",
  "contacted",
  "approved",
  "rejected",
];

const copy = {
  ar: {
    kicker: "إدارة الطلبات",
    title: "طلبات الانضمام",
    subtitle: "مراجعة طلبات التوظيف والتعاون الواردة من موقع نور آب.",
    refresh: "تحديث",
    total: "إجمالي الظاهر",
    new: "طلبات جديدة",
    review: "قيد المراجعة",
    contacted: "تم التواصل",
    allStatuses: "جميع الحالات",
    search: "بحث بالاسم، البريد، الجوال، التخصص...",
    applicant: "المتقدم",
    specialization: "التخصص",
    cooperation: "نوع التعاون",
    status: "الحالة",
    date: "تاريخ الطلب",
    details: "التفاصيل",
    loading: "جارٍ تحميل الطلبات...",
    empty: "لا توجد طلبات مطابقة.",
    drawerTitle: "تفاصيل الطلب",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    country: "الدولة",
    city: "المدينة",
    currentJob: "المسمى الحالي",
    experience: "سنوات الخبرة",
    lastContact: "آخر تواصل",
    linkedin: "فتح LinkedIn",
    cv: "فتح السيرة الذاتية",
    applicantNote: "نبذة المتقدم",
    internalNotes: "ملاحظات داخلية",
    notesPlaceholder: "ملاحظات فريق الإدارة عن الطلب...",
    saveNotes: "حفظ الملاحظات",
    saving: "جارٍ الحفظ...",
    approve: "قبول",
    archive: "أرشفة الطلب",
    archiveConfirm: "هل تريد أرشفة هذا الطلب؟ سيختفي من القائمة النشطة.",
    archiveError: "تعذر أرشفة الطلب.",
    statusError: "تعذر تحديث حالة الطلب.",
    notesError: "تعذر حفظ الملاحظات.",
    cvError: "تعذر فتح السيرة الذاتية.",
    loadError: "تعذر تحميل طلبات الانضمام.",
    fullTime: "دوام كامل",
    partTime: "دوام جزئي",
    remote: "عن بعد",
    internship: "تدريب",
    other: "أخرى",
    statusNew: "جديد",
    statusReview: "قيد المراجعة",
    statusContacted: "تم التواصل",
    statusApproved: "مقبول",
    statusRejected: "مرفوض",
  },
  en: {
    kicker: "Applications Management",
    title: "Join Applications",
    subtitle: "Review recruitment and collaboration applications submitted through Nour.",
    refresh: "Refresh",
    total: "Visible total",
    new: "New applications",
    review: "Under review",
    contacted: "Contacted",
    allStatuses: "All statuses",
    search: "Search by name, email, phone, specialization...",
    applicant: "Applicant",
    specialization: "Specialization",
    cooperation: "Cooperation type",
    status: "Status",
    date: "Application date",
    details: "Details",
    loading: "Loading applications...",
    empty: "No matching applications.",
    drawerTitle: "Application details",
    email: "Email",
    phone: "Phone",
    country: "Country",
    city: "City",
    currentJob: "Current title",
    experience: "Years of experience",
    lastContact: "Last contact",
    linkedin: "Open LinkedIn",
    cv: "Open CV",
    applicantNote: "Applicant note",
    internalNotes: "Internal notes",
    notesPlaceholder: "Internal team notes about this application...",
    saveNotes: "Save notes",
    saving: "Saving...",
    approve: "Approve",
    archive: "Archive application",
    archiveConfirm: "Archive this application? It will disappear from the active list.",
    archiveError: "Could not archive the application.",
    statusError: "Could not update application status.",
    notesError: "Could not save notes.",
    cvError: "Could not open CV.",
    loadError: "Could not load join applications.",
    fullTime: "Full time",
    partTime: "Part time",
    remote: "Remote",
    internship: "Internship",
    other: "Other",
    statusNew: "New",
    statusReview: "Under review",
    statusContacted: "Contacted",
    statusApproved: "Approved",
    statusRejected: "Rejected",
  },
} as const;

export default function AdminApplicationsPage() {
  const { language } = useLanguage();
  const t = copy[language];

  const statusLabels: Record<ApplicationStatus, string> = {
    new: t.statusNew,
    under_review: t.statusReview,
    contacted: t.statusContacted,
    approved: t.statusApproved,
    rejected: t.statusRejected,
    archived: language === "ar" ? "مؤرشف" : "Archived",
  };

  const employmentLabels = {
    full_time: t.fullTime,
    part_time: t.partTime,
    remote: t.remote,
    internship: t.internship,
    other: t.other,
  } as const;

  const [items, setItems] = useState<JobApplication[]>([]);
  const [selected, setSelected] = useState<JobApplication | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ApplicationStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function load() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await listJobApplications({ search, status });
      setItems(data);
      if (selected) {
        const updated = data.find((item) => item.id === selected.id);
        if (updated) {
          setSelected(updated);
          setNotes(updated.internalNotes ?? "");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, language]);

  const stats = useMemo(
    () =>
      items.reduce(
        (r, item) => {
          r.total += 1;
          if (item.status === "new") r.new += 1;
          if (item.status === "under_review") r.review += 1;
          if (item.status === "contacted") r.contacted += 1;
          return r;
        },
        { total: 0, new: 0, review: 0, contacted: 0 },
      ),
    [items],
  );

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

  function openApplication(item: JobApplication) {
    setSelected(item);
    setNotes(item.internalNotes ?? "");
    setErrorMessage("");
  }

  async function changeStatus(item: JobApplication, next: ApplicationStatus) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const updated = await updateJobApplicationStatus(item.id, next);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      if (selected?.id === updated.id) setSelected(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.statusError);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const updated = await saveJobApplicationNotes(selected.id, notes);
      setSelected(updated);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.notesError);
    } finally {
      setIsSaving(false);
    }
  }

  async function openCv(item: JobApplication) {
    if (!item.cvPath) return;
    try {
      const url = await getJobApplicationCvUrl(item.cvPath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.cvError);
    }
  }

  async function archiveSelected() {
    if (!selected || !window.confirm(t.archiveConfirm)) return;
    setIsSaving(true);
    try {
      await archiveJobApplication(selected.id);
      setItems((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t.archiveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="ja-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <section className="ja-heading">
        <div>
          <span className="ja-kicker">{t.kicker}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="ja-refresh" onClick={() => void load()}>
          {t.refresh}
        </button>
      </section>

      <section className="ja-stats">
        {[
          [t.total, stats.total],
          [t.new, stats.new],
          [t.review, stats.review],
          [t.contacted, stats.contacted],
        ].map(([label, value]) => (
          <article key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="ja-panel">
        <div className="ja-toolbar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          <select value={status} onChange={(e) => setStatus(e.target.value as "all" | ApplicationStatus)}>
            <option value="all">{t.allStatuses}</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>{statusLabels[value]}</option>
            ))}
          </select>
        </div>

        {errorMessage ? <div className="ja-error">{errorMessage}</div> : null}

        <div className="ja-table-wrap">
          <table className="ja-table">
            <thead>
              <tr>
                <th>{t.applicant}</th>
                <th>{t.specialization}</th>
                <th>{t.cooperation}</th>
                <th>{t.status}</th>
                <th>{t.date}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}><div className="ja-empty">{t.loading}</div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6}><div className="ja-empty">{t.empty}</div></td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="ja-person">
                        <strong>{item.fullName}</strong>
                        <span>{item.email}</span>
                        <small>{item.phone}</small>
                      </div>
                    </td>
                    <td>{item.specialization || item.currentJobTitle || "—"}</td>
                    <td>{employmentLabels[item.employmentType]}</td>
                    <td>
                      <select
                        className="ja-status"
                        value={item.status}
                        disabled={isSaving}
                        onChange={(e) => void changeStatus(item, e.target.value as ApplicationStatus)}
                      >
                        {statusOptions.map((value) => (
                          <option key={value} value={value}>{statusLabels[value]}</option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td><button className="ja-open" onClick={() => openApplication(item)}>{t.details}</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="ja-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <aside className="ja-drawer">
            <div className="ja-drawer-head">
              <div><span>{t.drawerTitle}</span><h2>{selected.fullName}</h2></div>
              <button onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="ja-detail-grid">
              <Detail label={t.email} value={selected.email} />
              <Detail label={t.phone} value={selected.phone} />
              <Detail label={t.country} value={selected.country} />
              <Detail label={t.city} value={selected.city} />
              <Detail label={t.specialization} value={selected.specialization} />
              <Detail label={t.currentJob} value={selected.currentJobTitle} />
              <Detail label={t.experience} value={selected.yearsOfExperience === null ? null : String(selected.yearsOfExperience)} />
              <Detail label={t.cooperation} value={employmentLabels[selected.employmentType]} />
              <Detail label={t.date} value={formatDate(selected.createdAt)} />
              <Detail label={t.lastContact} value={formatDate(selected.lastContactedAt)} />
            </div>

            {selected.linkedinUrl ? <a className="ja-link" href={selected.linkedinUrl} target="_blank" rel="noreferrer">{t.linkedin}</a> : null}
            {selected.cvPath ? <button className="ja-cv" onClick={() => void openCv(selected)}>{t.cv}</button> : null}
            {selected.message ? <section className="ja-message"><span>{t.applicantNote}</span><p>{selected.message}</p></section> : null}

            <label className="ja-notes">
              <span>{t.internalNotes}</span>
              <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} />
            </label>

            <button className="ja-save" onClick={() => void saveNotes()} disabled={isSaving}>
              {isSaving ? t.saving : t.saveNotes}
            </button>

            <div className="ja-drawer-actions">
              <button onClick={() => void changeStatus(selected, "under_review")}>{t.statusReview}</button>
              <button onClick={() => void changeStatus(selected, "contacted")}>{t.statusContacted}</button>
              <button onClick={() => void changeStatus(selected, "approved")}>{t.approve}</button>
            </div>

            <button className="ja-archive" onClick={() => void archiveSelected()}>{t.archive}</button>
          </aside>
        </div>
      ) : null}

      <style jsx>{`
        .ja-page{display:grid;gap:22px;color:var(--nour-text-primary);background:var(--nour-background)}
        .ja-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
        .ja-kicker{color:#2f82ff;font-size:12px;font-weight:900}
        .ja-heading h1{margin:7px 0 6px;color:var(--nour-text-primary);font-size:clamp(28px,4vw,40px)}
        .ja-heading p{margin:0;color:var(--nour-text-secondary);line-height:1.7}
        .ja-refresh,.ja-open,.ja-cv,.ja-save,.ja-drawer-actions button{font:inherit;font-weight:900;cursor:pointer}
        .ja-refresh{min-height:42px;padding:0 16px;border:1px solid var(--nour-border);border-radius:12px;color:var(--nour-text-primary);background:var(--nour-surface)}
        .ja-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .ja-stats article,.ja-panel,.ja-drawer{border:1px solid var(--nour-border);background:var(--nour-surface)}
        .ja-stats article{padding:18px;border-radius:18px}
        .ja-stats span{display:block;color:var(--nour-text-secondary);font-size:12px;font-weight:800}
        .ja-stats strong{display:block;margin-top:7px;color:inherit;font-size:28px}
        .ja-panel{overflow:hidden;border-radius:20px}
        .ja-toolbar{display:grid;grid-template-columns:1fr 220px;gap:12px;padding:16px;border-bottom:1px solid var(--nour-border)}
        .ja-toolbar input,.ja-toolbar select,.ja-status,.ja-notes textarea{width:100%;box-sizing:border-box;border:1px solid var(--nour-border);border-radius:12px;background:var(--nour-surface-muted);color:inherit;font:inherit;outline:none}
        .ja-toolbar input,.ja-toolbar select{min-height:44px;padding-inline:13px}
        .ja-table-wrap{overflow-x:auto}
        .ja-table{width:100%;min-width:900px;border-collapse:collapse}
        .ja-table th,.ja-table td{padding:14px 16px;border-bottom:1px solid var(--nour-border);text-align:start;vertical-align:middle;font-size:13px}
        .ja-table th{color:var(--nour-text-secondary);font-size:11px;font-weight:900;background:var(--nour-surface-muted)}
        .ja-person{display:grid;gap:3px}.ja-person span,.ja-person small{color:var(--nour-text-secondary)}
        .ja-status{min-height:38px;padding-inline:10px;font-size:12px;font-weight:800}
        .ja-open{padding:8px 11px;border:0;border-radius:10px;color:#4590ff;background:rgba(23,111,232,.12)}
        .ja-empty{padding:42px;color:var(--nour-text-secondary);text-align:center}
        .ja-error{margin:14px 16px 0;padding:11px 13px;border:1px solid rgba(239,68,68,.22);border-radius:10px;color:#f87171;background:rgba(239,68,68,.08);font-size:12px;font-weight:800}
        .ja-overlay{position:fixed;inset:0;z-index:1200;display:flex;justify-content:flex-start;background:rgba(2,8,18,.68);backdrop-filter:blur(4px)}
        .ja-drawer{width:min(560px,94vw);height:100%;overflow-y:auto;padding:24px;box-shadow:24px 0 80px rgba(0,0,0,.35)}
        .ja-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid var(--nour-border)}
        .ja-drawer-head span{color:#4590ff;font-size:11px;font-weight:900}.ja-drawer-head h2{margin:5px 0 0;color:inherit;font-size:27px}
        .ja-drawer-head button{width:38px;height:38px;border:1px solid var(--nour-border);border-radius:11px;color:inherit;background:transparent;font-size:22px;cursor:pointer}
        .ja-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px}
        .ja-link,.ja-cv{min-height:42px;display:inline-flex;align-items:center;justify-content:center;margin-top:14px;padding-inline:15px;border:0;border-radius:11px;text-decoration:none}.ja-link{margin-inline-end:8px;color:#4590ff;background:rgba(23,111,232,.12);font-weight:900}.ja-cv{color:#102b4e;background:#ffc313}
        .ja-message{margin-top:20px;padding:16px;border-radius:14px;background:var(--nour-surface-muted)}.ja-message span,.ja-notes>span{font-size:12px;font-weight:900}.ja-message p{margin:8px 0 0;color:var(--nour-text-secondary);line-height:1.8;white-space:pre-wrap}
        .ja-notes{display:grid;gap:8px;margin-top:20px}.ja-notes textarea{padding:13px;resize:vertical}
        .ja-save{width:100%;min-height:46px;margin-top:12px;border:0;border-radius:12px;color:white;background:#176fe8}
        .ja-drawer-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:18px}.ja-drawer-actions button{min-height:42px;border:1px solid var(--nour-border);border-radius:11px;color:inherit;background:var(--nour-surface-muted)}
        .ja-archive{width:100%;min-height:42px;margin-top:10px;border:1px solid rgba(239,68,68,.24);border-radius:11px;color:#f87171;background:rgba(239,68,68,.08);font:inherit;font-weight:900;cursor:pointer}
        
        .ja-toolbar input::placeholder,
        .ja-notes textarea::placeholder {
          color: var(--nour-text-muted);
        }
        .ja-toolbar input:focus,
        .ja-toolbar select:focus,
        .ja-status:focus,
        .ja-notes textarea:focus {
          border-color: var(--nour-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--nour-primary) 16%, transparent);
        }
        .ja-table tbody tr:hover td {
          background: var(--nour-surface-muted);
        }
@media(max-width:800px){.ja-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ja-toolbar,.ja-detail-grid{grid-template-columns:1fr}}@media(max-width:520px){.ja-heading{display:grid}.ja-stats{grid-template-columns:1fr}.ja-drawer-actions{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="ja-detail">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
      <style jsx>{`
        .ja-detail{padding:12px;border:1px solid var(--nour-border);border-radius:12px;background:var(--nour-surface-muted);color:inherit}
        .ja-detail span{display:block;color:var(--nour-text-secondary);font-size:10px;font-weight:800}
        .ja-detail strong{display:block;margin-top:5px;overflow-wrap:anywhere;font-size:13px}
      `}</style>
    </div>
  );
}