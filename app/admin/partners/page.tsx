"use client";

import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";

type ApplicationStatus =
  | "new"
  | "under_review"
  | "contacted"
  | "approved"
  | "rejected"
  | "archived";

type PartnerType =
  | "hotel"
  | "transport"
  | "visa"
  | "umrah_company"
  | "guide"
  | "airline"
  | "service_provider"
  | "technology"
  | "other";

type PartnerApplication = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string | null;
  city: string | null;
  partnerType: PartnerType;
  registrationNumber: string | null;
  licenseNumber: string | null;
  websiteUrl: string | null;
  companyDescription: string | null;
  servicesDescription: string | null;
  servedCountries: string[] | null;
  attachmentPath: string | null;
  notes: string | null;
  status: ApplicationStatus;
  internalNotes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
};

const copy = {
  ar: {
    kicker:"إدارة الشراكات",title:"طلبات الشراكة",subtitle:"مراجعة طلبات الفنادق والنقل والتأشيرات والشركات ومزودي الخدمات الراغبين في الشراكة مع نور.",
    refresh:"تحديث",total:"إجمالي الظاهر",new:"طلبات جديدة",review:"قيد المراجعة",contacted:"تم التواصل",all:"جميع الحالات",
    search:"بحث باسم المنشأة، المسؤول، البريد، السجل...",company:"المنشأة",type:"نوع الشراكة",country:"الدولة",status:"الحالة",date:"تاريخ الطلب",
    details:"التفاصيل",loading:"جارٍ تحميل الطلبات...",empty:"لا توجد طلبات مطابقة.",drawer:"تفاصيل طلب الشراكة",contact:"اسم المسؤول",
    email:"البريد الإلكتروني",phone:"رقم الجوال",city:"المدينة",registration:"السجل التجاري",license:"رقم الترخيص",lastContact:"آخر تواصل",
    website:"فتح الموقع الإلكتروني",attachment:"فتح المرفق",served:"الدول التي تخدمها المنشأة",companyDesc:"نبذة عن المنشأة",services:"الخدمات المقدمة",
    applicantNotes:"ملاحظات مقدم الطلب",internalNotes:"ملاحظات داخلية",notesPlaceholder:"ملاحظات فريق نور عن الشريك...",save:"حفظ الملاحظات",saving:"جارٍ الحفظ...",
    approve:"قبول",archive:"أرشفة الطلب",archiveConfirm:"هل تريد أرشفة طلب الشراكة؟",
    hotel:"فندق / ضيافة",transport:"نقل",visa:"تأشيرات",umrah:"شركة عمرة",guide:"إرشاد وخدمات ميدانية",airline:"طيران",provider:"مزود خدمات",technology:"شراكة تقنية",other:"أخرى",
    sNew:"جديد",sReview:"قيد المراجعة",sContacted:"تم التواصل",sApproved:"مقبول",sRejected:"مرفوض"
  },
  en: {
    kicker:"Partnership Management",title:"Partner Applications",subtitle:"Review applications from hotels, transport, visa providers, Umrah companies and other service partners.",
    refresh:"Refresh",total:"Visible total",new:"New applications",review:"Under review",contacted:"Contacted",all:"All statuses",
    search:"Search by company, contact, email, registration...",company:"Company",type:"Partnership type",country:"Country",status:"Status",date:"Application date",
    details:"Details",loading:"Loading applications...",empty:"No matching applications.",drawer:"Partnership application details",contact:"Contact person",
    email:"Email",phone:"Phone",city:"City",registration:"Registration number",license:"License number",lastContact:"Last contact",
    website:"Open website",attachment:"Open attachment",served:"Countries served",companyDesc:"Company overview",services:"Services provided",
    applicantNotes:"Applicant notes",internalNotes:"Internal notes",notesPlaceholder:"Internal Nour team notes about this partner...",save:"Save notes",saving:"Saving...",
    approve:"Approve",archive:"Archive application",archiveConfirm:"Archive this partnership application?",
    hotel:"Hotel / Hospitality",transport:"Transport",visa:"Visas",umrah:"Umrah Company",guide:"Guides / Field Services",airline:"Airline",provider:"Service Provider",technology:"Technology Partner",other:"Other",
    sNew:"New",sReview:"Under review",sContacted:"Contacted",sApproved:"Approved",sRejected:"Rejected"
  }
} as const;

type PartnerApplicationRow = {
  id: PartnerApplication["id"];
  company_name: PartnerApplication["companyName"];
  contact_name: PartnerApplication["contactName"];
  email: PartnerApplication["email"];
  phone: PartnerApplication["phone"];
  country: PartnerApplication["country"];
  city: PartnerApplication["city"];
  partner_type: PartnerApplication["partnerType"];
  registration_number: PartnerApplication["registrationNumber"];
  license_number: PartnerApplication["licenseNumber"];
  website_url: PartnerApplication["websiteUrl"];
  company_description: PartnerApplication["companyDescription"];
  services_description: PartnerApplication["servicesDescription"];
  served_countries: PartnerApplication["servedCountries"];
  attachment_path: PartnerApplication["attachmentPath"];
  notes: PartnerApplication["notes"];
  status: PartnerApplication["status"];
  internal_notes: PartnerApplication["internalNotes"];
  last_contacted_at: PartnerApplication["lastContactedAt"];
  created_at: PartnerApplication["createdAt"];
};

function mapRow(row: PartnerApplicationRow):PartnerApplication {
  return {
    id:row.id,companyName:row.company_name,contactName:row.contact_name,email:row.email,phone:row.phone,country:row.country,city:row.city,
    partnerType:row.partner_type,registrationNumber:row.registration_number,licenseNumber:row.license_number,websiteUrl:row.website_url,
    companyDescription:row.company_description,servicesDescription:row.services_description,servedCountries:row.served_countries,
    attachmentPath:row.attachment_path,notes:row.notes,status:row.status,internalNotes:row.internal_notes,lastContactedAt:row.last_contacted_at,createdAt:row.created_at,
  };
}

export default function AdminPartnersPage(){
  const {language}=useLanguage();
  const t=copy[language];
  const supabase=useMemo(()=>createClient(),[]);
  const [items,setItems]=useState<PartnerApplication[]>([]);
  const [selected,setSelected]=useState<PartnerApplication|null>(null);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState<"all"|ApplicationStatus>("all");
  const [notes,setNotes]=useState("");
  const [isLoading,setIsLoading]=useState(true);
  const [isSaving,setIsSaving]=useState(false);
  const [errorMessage,setErrorMessage]=useState("");

  const statusLabels:Record<ApplicationStatus,string>={new:t.sNew,under_review:t.sReview,contacted:t.sContacted,approved:t.sApproved,rejected:t.sRejected,archived:language==="ar"?"مؤرشف":"Archived"};
  const partnerLabels:Record<PartnerType,string>={hotel:t.hotel,transport:t.transport,visa:t.visa,umrah_company:t.umrah,guide:t.guide,airline:t.airline,service_provider:t.provider,technology:t.technology,other:t.other};
  const statusOptions:ApplicationStatus[]=["new","under_review","contacted","approved","rejected"];

  const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat(language==="ar"?"ar-SA":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";

  async function load(){
    setIsLoading(true);setErrorMessage("");
    try{
      let query=supabase.from("partner_applications").select("*").is("deleted_at",null).order("created_at",{ascending:false});
      if(status!=="all")query=query.eq("status",status);
      const term=search.trim();
      if(term){
        const safe=term.replace(/[%_]/g,"\\$&");
        query=query.or([`company_name.ilike.%${safe}%`,`contact_name.ilike.%${safe}%`,`email.ilike.%${safe}%`,`phone.ilike.%${safe}%`,`country.ilike.%${safe}%`,`city.ilike.%${safe}%`,`registration_number.ilike.%${safe}%`,`license_number.ilike.%${safe}%`].join(","));
      }
      const {data,error}=await query;
      if(error)throw error;
      const mapped=(data??[]).map(mapRow);
      setItems(mapped);
      if(selected){
        const updated=mapped.find((i)=>i.id===selected.id);
        if(updated){setSelected(updated);setNotes(updated.internalNotes??"");}
      }
    }catch(error){setErrorMessage(error instanceof Error?error.message:(language==="ar"?"تعذر تحميل طلبات الشراكة.":"Could not load partner applications."));}
    finally{setIsLoading(false);}
  }

  useEffect(()=>{const timer=window.setTimeout(()=>void load(),250);return()=>window.clearTimeout(timer);/* eslint-disable-next-line react-hooks/exhaustive-deps */},[search,status,language]);

  const stats=useMemo(()=>items.reduce((r,i)=>{r.total++;if(i.status==="new")r.new++;if(i.status==="under_review")r.review++;if(i.status==="contacted")r.contacted++;return r;},{total:0,new:0,review:0,contacted:0}),[items]);

  async function changeStatus(item:PartnerApplication,next:ApplicationStatus){
    setIsSaving(true);
    const payload:Record<string,unknown>={status:next};
    if(next==="contacted")payload.last_contacted_at=new Date().toISOString();
    const {data,error}=await supabase.from("partner_applications").update(payload).eq("id",item.id).select("*").single();
    if(error){setErrorMessage(error.message);setIsSaving(false);return;}
    const updated=mapRow(data);setItems(c=>c.map(e=>e.id===updated.id?updated:e));if(selected?.id===updated.id)setSelected(updated);setIsSaving(false);
  }

  async function saveNotes(){
    if(!selected)return;setIsSaving(true);
    const {data,error}=await supabase.from("partner_applications").update({internal_notes:notes.trim()||null}).eq("id",selected.id).select("*").single();
    if(error){setErrorMessage(error.message);setIsSaving(false);return;}
    const updated=mapRow(data);setSelected(updated);setItems(c=>c.map(e=>e.id===updated.id?updated:e));setIsSaving(false);
  }

  async function openAttachment(){
    if(!selected?.attachmentPath)return;
    const {data,error}=await supabase.storage.from("application-files").createSignedUrl(selected.attachmentPath,600);
    if(error||!data?.signedUrl){setErrorMessage(error?.message??"Unable to open attachment.");return;}
    window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function archiveSelected(){
    if(!selected||!window.confirm(t.archiveConfirm))return;setIsSaving(true);
    const now=new Date().toISOString();
    const {error}=await supabase.from("partner_applications").update({status:"archived",deleted_at:now,updated_at:now}).eq("id",selected.id);
    if(error){setErrorMessage(error.message);setIsSaving(false);return;}
    setItems(c=>c.filter(i=>i.id!==selected.id));setSelected(null);setIsSaving(false);
  }

  return <div className="pa-page" dir={language==="ar"?"rtl":"ltr"}>
    <section className="pa-heading"><div><span className="pa-kicker">{t.kicker}</span><h1>{t.title}</h1><p>{t.subtitle}</p></div><button className="pa-refresh" onClick={()=>void load()}>{t.refresh}</button></section>

    <section className="pa-stats">
      {[[t.total,stats.total],[t.new,stats.new],[t.review,stats.review],[t.contacted,stats.contacted]].map(([label,value])=><article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}
    </section>

    <section className="pa-panel">
      <div className="pa-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/><select value={status} onChange={e=>setStatus(e.target.value as "all"|ApplicationStatus)}><option value="all">{t.all}</option>{statusOptions.map(v=><option key={v} value={v}>{statusLabels[v]}</option>)}</select></div>
      {errorMessage?<div className="pa-error">{errorMessage}</div>:null}
      <div className="pa-table-wrap"><table className="pa-table"><thead><tr><th>{t.company}</th><th>{t.type}</th><th>{t.country}</th><th>{t.status}</th><th>{t.date}</th><th/></tr></thead><tbody>
        {isLoading?<tr><td colSpan={6}><div className="pa-empty">{t.loading}</div></td></tr>:items.length===0?<tr><td colSpan={6}><div className="pa-empty">{t.empty}</div></td></tr>:items.map(item=><tr key={item.id}>
          <td><div className="pa-company"><strong>{item.companyName}</strong><span>{item.contactName}</span><small>{item.email}</small></div></td>
          <td>{partnerLabels[item.partnerType]}</td><td>{[item.country,item.city].filter(Boolean).join(" - ")||"—"}</td>
          <td><select className="pa-status" value={item.status} disabled={isSaving} onChange={e=>void changeStatus(item,e.target.value as ApplicationStatus)}>{statusOptions.map(v=><option key={v} value={v}>{statusLabels[v]}</option>)}</select></td>
          <td>{formatDate(item.createdAt)}</td><td><button className="pa-open" onClick={()=>{setSelected(item);setNotes(item.internalNotes??"");}}>{t.details}</button></td>
        </tr>)}
      </tbody></table></div>
    </section>

    {selected?<div className="pa-overlay" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><aside className="pa-drawer">
      <div className="pa-drawer-head"><div><span>{t.drawer}</span><h2>{selected.companyName}</h2></div><button onClick={()=>setSelected(null)}>×</button></div>
      <div className="pa-detail-grid">
        <Detail label={t.contact} value={selected.contactName}/><Detail label={t.email} value={selected.email}/><Detail label={t.phone} value={selected.phone}/><Detail label={t.type} value={partnerLabels[selected.partnerType]}/>
        <Detail label={t.country} value={selected.country}/><Detail label={t.city} value={selected.city}/><Detail label={t.registration} value={selected.registrationNumber}/><Detail label={t.license} value={selected.licenseNumber}/><Detail label={t.date} value={formatDate(selected.createdAt)}/><Detail label={t.lastContact} value={formatDate(selected.lastContactedAt)}/>
      </div>
      {selected.websiteUrl?<a className="pa-link" href={selected.websiteUrl} target="_blank" rel="noreferrer">{t.website}</a>:null}
      {selected.attachmentPath?<button className="pa-attachment" onClick={()=>void openAttachment()}>{t.attachment}</button>:null}
      {selected.servedCountries?.length?<Message title={t.served} body={selected.servedCountries.join(language==="ar"?"، ":", ")}/>:null}
      {selected.companyDescription?<Message title={t.companyDesc} body={selected.companyDescription}/>:null}
      {selected.servicesDescription?<Message title={t.services} body={selected.servicesDescription}/>:null}
      {selected.notes?<Message title={t.applicantNotes} body={selected.notes}/>:null}
      <label className="pa-notes"><span>{t.internalNotes}</span><textarea rows={6} value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notesPlaceholder}/></label>
      <button className="pa-save" onClick={()=>void saveNotes()} disabled={isSaving}>{isSaving?t.saving:t.save}</button>
      <div className="pa-drawer-actions"><button onClick={()=>void changeStatus(selected,"under_review")}>{t.sReview}</button><button onClick={()=>void changeStatus(selected,"contacted")}>{t.sContacted}</button><button onClick={()=>void changeStatus(selected,"approved")}>{t.approve}</button></div>
      <button className="pa-archive" onClick={()=>void archiveSelected()}>{t.archive}</button>
    </aside></div>:null}

    <style jsx>{`
      .pa-page{display:grid;gap:22px;color:var(--nour-text-primary);background:var(--nour-background)}
      .pa-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.pa-kicker{color:#2f82ff;font-size:12px;font-weight:900}.pa-heading h1{margin:7px 0 6px;color:var(--nour-text-primary);font-size:clamp(28px,4vw,40px)}.pa-heading p{max-width:760px;margin:0;color:var(--nour-text-secondary);line-height:1.7}
      .pa-refresh,.pa-open,.pa-attachment,.pa-save,.pa-drawer-actions button{font:inherit;font-weight:900;cursor:pointer}.pa-refresh{min-height:42px;padding:0 16px;border:1px solid var(--nour-border);border-radius:12px;color:var(--nour-text-primary);background:var(--nour-surface)}
      .pa-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.pa-stats article,.pa-panel,.pa-drawer{border:1px solid var(--nour-border);background:var(--nour-surface)}.pa-stats article{padding:18px;border-radius:18px}.pa-stats span{display:block;color:var(--nour-text-secondary);font-size:12px;font-weight:800}.pa-stats strong{display:block;margin-top:7px;color:inherit;font-size:28px}
      .pa-panel{overflow:hidden;border-radius:20px}.pa-toolbar{display:grid;grid-template-columns:1fr 220px;gap:12px;padding:16px;border-bottom:1px solid var(--nour-border)}.pa-toolbar input,.pa-toolbar select,.pa-status,.pa-notes textarea{width:100%;box-sizing:border-box;border:1px solid var(--nour-border);border-radius:12px;background:var(--nour-surface-muted);color:inherit;font:inherit;outline:none}.pa-toolbar input,.pa-toolbar select{min-height:44px;padding-inline:13px}
      .pa-table-wrap{overflow-x:auto}.pa-table{width:100%;min-width:900px;border-collapse:collapse}.pa-table th,.pa-table td{padding:14px 16px;border-bottom:1px solid var(--nour-border);text-align:start;vertical-align:middle;font-size:13px}.pa-table th{color:var(--nour-text-secondary);font-size:11px;font-weight:900;background:var(--nour-surface-muted)}.pa-company{display:grid;gap:3px}.pa-company span,.pa-company small{color:var(--nour-text-secondary)}.pa-status{min-height:38px;padding-inline:10px;font-size:12px;font-weight:800}.pa-open{padding:8px 11px;border:0;border-radius:10px;color:#4590ff;background:rgba(23,111,232,.12)}.pa-empty{padding:42px;color:var(--nour-text-secondary);text-align:center}.pa-error{margin:14px 16px 0;padding:11px 13px;border:1px solid rgba(239,68,68,.22);border-radius:10px;color:#f87171;background:rgba(239,68,68,.08);font-size:12px;font-weight:800}
      .pa-overlay{position:fixed;inset:0;z-index:1200;display:flex;justify-content:flex-start;background:rgba(2,8,18,.68);backdrop-filter:blur(4px)}.pa-drawer{width:min(590px,94vw);height:100%;overflow-y:auto;padding:24px;box-shadow:24px 0 80px rgba(0,0,0,.35)}.pa-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid var(--nour-border)}.pa-drawer-head span{color:#4590ff;font-size:11px;font-weight:900}.pa-drawer-head h2{margin:5px 0 0;color:inherit;font-size:27px}.pa-drawer-head button{width:38px;height:38px;border:1px solid var(--nour-border);border-radius:11px;color:inherit;background:transparent;font-size:22px;cursor:pointer}
      .pa-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px}.pa-link,.pa-attachment{min-height:42px;display:inline-flex;align-items:center;justify-content:center;margin-top:14px;padding-inline:15px;border:0;border-radius:11px;text-decoration:none}.pa-link{margin-inline-end:8px;color:#4590ff;background:rgba(23,111,232,.12);font-weight:900}.pa-attachment{color:#102b4e;background:#ffc313}.pa-notes{display:grid;gap:8px;margin-top:20px}.pa-notes textarea{padding:13px;resize:vertical}.pa-notes>span{font-size:12px;font-weight:900}.pa-save{width:100%;min-height:46px;margin-top:12px;border:0;border-radius:12px;color:white;background:#176fe8}.pa-drawer-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:18px}.pa-drawer-actions button{min-height:42px;border:1px solid var(--nour-border);border-radius:11px;color:inherit;background:var(--nour-surface-muted)}.pa-archive{width:100%;min-height:42px;margin-top:10px;border:1px solid rgba(239,68,68,.24);border-radius:11px;color:#f87171;background:rgba(239,68,68,.08);font:inherit;font-weight:900;cursor:pointer}
      
        .pa-toolbar input::placeholder,
        .pa-notes textarea::placeholder {
          color: var(--nour-text-muted);
        }
        .pa-toolbar input:focus,
        .pa-toolbar select:focus,
        .pa-status:focus,
        .pa-notes textarea:focus {
          border-color: var(--nour-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--nour-primary) 16%, transparent);
        }
        .pa-table tbody tr:hover td {
          background: var(--nour-surface-muted);
        }
@media(max-width:800px){.pa-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pa-toolbar,.pa-detail-grid{grid-template-columns:1fr}}@media(max-width:520px){.pa-heading{display:grid}.pa-stats{grid-template-columns:1fr}.pa-drawer-actions{grid-template-columns:1fr}}
    `}</style>
  </div>
}

function Detail({label,value}:{label:string;value:string|null}) {
  return <div className="pa-detail"><span>{label}</span><strong>{value||"—"}</strong><style jsx>{`.pa-detail{padding:12px;border:1px solid var(--nour-border);border-radius:12px;background:var(--nour-surface-muted);color:inherit}.pa-detail span{display:block;color:var(--nour-text-secondary);font-size:10px;font-weight:800}.pa-detail strong{display:block;margin-top:5px;overflow-wrap:anywhere;font-size:13px}`}</style></div>
}

function Message({title,body}:{title:string;body:string}) {
  return <section className="pa-message"><span>{title}</span><p>{body}</p><style jsx>{`.pa-message{margin-top:20px;padding:16px;border-radius:14px;background:var(--nour-surface-muted);color:inherit}.pa-message span{font-size:12px;font-weight:900}.pa-message p{margin:8px 0 0;color:var(--nour-text-secondary);line-height:1.8;white-space:pre-wrap}`}</style></section>
}