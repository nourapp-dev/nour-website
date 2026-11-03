"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLanguage } from "../../../src/core/i18n";
import { languageHref } from "../../../src/core/i18n/public-language";
import PublicPageShell from "../../components/layout/PublicPageShell";
import Hero from "./BeforeHero";
import ProgramsPreview from "./BeforePrograms";
import AppBookingLink from "../../components/AppBookingLink";
import { copy } from "../../data/home";
import "../../programs/programs-ui.css";
import "./before.css";

const WorldMap = dynamic(() => import("../../components/home/why-nour/NourWorldMapMobileLayout"), { ssr: false });

export default function Home() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [mapOpen, setMapOpen] = useState(false);
  const steps = ar ? [
    ["استعرض البرامج", "اختر بلد الانطلاق والمدة، واقرأ تفاصيل الإقامة والنقل وما يشمله البرنامج."],
    ["انتقل إلى تطبيق نور آب", "افتح خيارات التطبيق. الانتقال إلى بدايته؛ اختر برنامجك داخله وراجع سعره وتوافره."],
    ["راجع قبل الحجز", "اتبع متطلبات الحساب والحجز داخل التطبيق. لا يُنشأ حجز أو يُطلب دفع هنا."],
  ] : [
    ["Explore programs", "Choose the departure country and duration. Read about accommodation, transport and inclusions."],
    ["Continue to the Nour app", "Open the app options. The link goes to its start screen; find your program and check its price and availability there."],
    ["Review before booking", "Follow the account and booking requirements in the app. No booking or payment is created here."],
  ];
  return <PublicPageShell activeSection="home"><main className="nour-home-batch" dir={ar ? "rtl" : "ltr"}>
    <Hero t={copy[language]} />
    <ProgramsPreview language={language} />
    <section className="nour-home-section nour-home-guide" id="journey" aria-labelledby="home-guide-title">
      <span className="nour-home-eyebrow">{ar ? "من الاستكشاف إلى التطبيق" : "From discovery to the app"}</span>
      <h2 id="home-guide-title">{ar ? "خطوات واضحة لرحلتك" : "Clear steps for your journey"}</h2>
      <ol>{steps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol>
      <AppBookingLink language={language} />
    </section>
    <section className="nour-home-section nour-home-trust" id="about">
      <div><span className="nour-home-eyebrow">{ar ? "معلومات قبل القرار" : "Information before you decide"}</span><h2>{ar ? "وضوح يساعدك على الاختيار" : "Clarity that helps you choose"}</h2><p>{ar ? "اقرأ تفاصيل البرنامج المنشورة، وتحقق من الشروط والتكلفة النهائية داخل التطبيق قبل التأكيد. إن لم تتوفر معلومة، تواصل معنا للاستفسار." : "Read the published program details and verify the terms and final cost inside the app before confirming. If information is missing, contact us."}</p></div>
      <div className="nour-home-trust-links"><Link href={languageHref("/terms", language)}>{ar ? "الشروط والأحكام" : "Terms and conditions"}</Link><Link href={languageHref("/privacy", language)}>{ar ? "سياسة الخصوصية" : "Privacy policy"}</Link><a href="#contact">{ar ? "التواصل وبيانات المنشأة والتوثيق" : "Contact, business details and verification"}</a></div>
    </section>
    <section className="nour-home-section">
      <details className="nour-home-map" onToggle={event => setMapOpen(event.currentTarget.open)}>
        <summary>{ar ? "استكشف بلد الانطلاق على الخريطة" : "Explore departure countries on the map"}</summary>
        {mapOpen && <WorldMap language={language} />}
      </details>
    </section>
    <section className="nour-home-section nour-home-next" id="download-app"><h2>{ar ? "الخطوة التالية في تطبيق نور آب" : "Your next step is in the Nour app"}</h2><p>{ar ? "خيارات فتح التطبيق وروابط التحميل المعتمدة في مكان واحد." : "App-opening options and approved download links in one place."}</p><AppBookingLink language={language} /></section>
  </main></PublicPageShell>;
}
