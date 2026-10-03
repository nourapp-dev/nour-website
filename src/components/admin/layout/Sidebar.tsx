"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpenText, BriefcaseBusiness, BusFront, CalendarCheck2, CircleGauge, FileCheck2, FolderOpen, Globe2, Handshake, Hotel, Images, MessageSquareQuote, Scale, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAdminTranslations, useLanguage } from "../../../core/i18n";

type SidebarNavigationItem = { label:string; href:string; icon:LucideIcon };

export default function Sidebar(){
 const {language}=useLanguage(); const t=getAdminTranslations(language);
 const navigationItems:SidebarNavigationItem[]=[
  {label:t.sidebar.dashboard,href:"/admin/dashboard",icon:CircleGauge},
  {label:language==="ar"?"الحجوزات":"Bookings",href:"/admin/bookings",icon:CalendarCheck2},
  {label:t.sidebar.countries,href:"/admin/countries",icon:Globe2},
  {label:language==="ar"?"مدن الانطلاق":"Departure cities",href:"/admin/cities",icon:Globe2},
  {label:t.sidebar.programs,href:"/admin/programs",icon:FolderOpen},
  {label:language==="ar"?"المقالات":"Articles",href:"/admin/articles",icon:BookOpenText},
  {label:language==="ar"?"كلمة الرئيس التنفيذي":"CEO Message",href:"/admin/ceo-message",icon:MessageSquareQuote},
  {label:language==="ar"?"الفنادق":"Hotels",href:"/admin/hotels",icon:Hotel},
  {label:language==="ar"?"النقل":"Transport",href:"/admin/transports",icon:BusFront},
  {label:language==="ar"?"التأشيرات":"Visas",href:"/admin/visas",icon:FileCheck2},
  {label:language==="ar"?"طلبات الانضمام":"Join Applications",href:"/admin/applications",icon:BriefcaseBusiness},
  {label:language==="ar"?"طلبات الشراكة":"Partner Applications",href:"/admin/partners",icon:Handshake},
  {label:t.sidebar.media,href:"/admin/media",icon:Images},
  {label:language==="ar"?"المحتوى القانوني":"Legal Content",href:"/admin/legal",icon:Scale},
  {label:t.sidebar.users,href:"/admin/users",icon:Users},
  {label:language==="ar"?"التحليلات":"Analytics",href:"/admin/analytics",icon:BarChart3},
  {label:language==="ar"?"الإعدادات":"Settings",href:"/admin/settings",icon:Settings},
 ];
 return <aside className="nr-admin-sidebar"><div className="nr-admin-sidebar-brand"><div className="nr-admin-sidebar-brand-logo"><Image src="/images/site/v-logo.png" alt="NourApp" width={42} height={42} priority/></div><div className="nr-admin-sidebar-brand-text"><strong>NourApp Platform</strong><small>{language==="ar"?"لوحة الإدارة":"Admin Panel"}</small></div></div><nav className="nr-admin-sidebar-nav" aria-label={language==="ar"?"التنقل في لوحة التحكم":"Admin navigation"}>{navigationItems.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} className="nr-admin-sidebar-link" title={item.label}><span className="nr-admin-sidebar-link-icon" aria-hidden={true}><Icon size={20} strokeWidth={1.9}/></span><span className="nr-admin-sidebar-link-label">{item.label}</span></Link>})}</nav><div className="nr-admin-sidebar-footer"><div className="nr-admin-sidebar-status"><span className="nr-admin-sidebar-status-dot" aria-hidden={true}/><div><strong>{language==="ar"?"النظام متصل":"System Online"}</strong><small>Supabase Production</small></div></div></div></aside>;
}
