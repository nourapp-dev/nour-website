"use client";

import {usePresentation} from '../../src/features/website/usePresentation';
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CodeXml, Headset, Handshake, Lightbulb, PenTool, Settings2, Shapes, ShieldCheck, ChevronDown, BriefcaseBusiness } from "lucide-react";
import { useLanguage } from "../../src/core/i18n";
import { careerAreas, type Language } from "../../src/features/applications/utils/talent-application";
import TalentForm from "../../src/features/applications/components/TalentForm";
import base from "../../src/features/applications/components/partnership.module.css";
import styles from "../../src/features/applications/components/careers.module.css";

const icons = [CodeXml, Settings2, Headset, PenTool, Handshake, Shapes];
const journey = [
  ["إرسال الطلب", "Submit your application", "شارك مجالك وتفضيلاتك وخبرتك وبيانات التواصل.", "Share your area, preferences, experience and contact details."],
  ["مراجعة البيانات والخبرة", "Review of details and experience", "يراجع الفريق ما قدمته لفهم ملاءمة خبرتك.", "The team reviews what you have shared to understand your experience."],
  ["التواصل عند وجود ملاءمة", "Contact when a role is suitable", "يكون التواصل عند وجود فرصة مناسبة للملف.", "Contact takes place when there is an opportunity suited to your profile."],
  ["المقابلات والتقييم", "Interviews and assessment", "تُحدد مراحل التقييم بحسب الفرصة ومتطلباتها.", "Assessment stages depend on the opportunity and its requirements."],
];
export default function CareersPage({ initialLanguage }: { initialLanguage: Language }) {
  const pageContent=usePresentation().pages.careers;const faqs=pageContent.faqs.map(f=>[f.question.ar,f.question.en,f.answer.ar,f.answer.en]);
  const { setLanguage: setSharedLanguage } = useLanguage();
  const [language, setLanguage] = useState(initialLanguage);
  const [area, setArea] = useState(""); const [step, setStep] = useState(0); const [busy, setBusy] = useState(false);
  const ar=language==="ar", t=(a:string,e:string)=>ar?a:e;
  const DirectionArrow=ar?ArrowLeft:ArrowRight;
  function selectArea(value: string) {
    setArea(value);setStep(0);
    document.getElementById("talent-interest")?.scrollIntoView?.({block:"start",behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
    document.getElementById("talent-form-title")?.focus({preventScroll:true});
  }
  function toggleLanguage() { const next=ar?"en":"ar";setLanguage(next);setSharedLanguage(next);const url=new URL(window.location.href);url.searchParams.set("lang",next);window.history.replaceState(null,"",url); }
  return <main className={`${base.page} ${styles.page}`} dir={ar?"rtl":"ltr"} lang={language}>
    <a className={base.skipLink} href="#talent-interest">{t("انتقل إلى طلب الانضمام","Skip to the application")}</a>
    <header className={base.topbar}><Link href="/" aria-label={t("نور آب — الرئيسية","Nour App — Home")}><Image src="/images/brand/nour-horizontal.svg" width={138} height={44} alt={t("نور آب","Nour App")} priority/></Link><nav aria-label={t("تنقل الصفحة","Page navigation")}><Link href="/">{t("الرئيسية","Home")}</Link><button type="button" onClick={toggleLanguage}>{ar?"English":"العربية"}</button></nav></header>
    <section className={base.hero}><div className={base.container}><div className={base.heroGrid}>
      <div><span className={base.eyebrow}><BriefcaseBusiness size={16} aria-hidden="true"/>{t("انضم إلى فريق نور آب","Join Nour App")}</span><h1>{pageContent.title[language]}<br/><span>{pageContent.emphasis[language]}</span></h1><p>{pageContent.description[language]}</p><div className={base.heroActions}><a href="#career-areas" className={base.primaryButton}>{t("استكشف المجالات","Explore professional areas")}<DirectionArrow size={18} aria-hidden="true"/></a><a href="#talent-interest" className={base.secondaryButton}>{t("انضم إلى قاعدة المواهب","Join the talent pool")}</a></div><p className={base.heroNote}><ShieldCheck size={15} aria-hidden="true"/>{t("اهتمامك هو البداية؛ الملاءمة تُراجع بحسب الفرصة","Your interest is the start; suitability is assessed for each opportunity")}</p></div>
      <div className={base.visual} aria-hidden="true"><div className={base.visualBadge}><Image src="/images/brand/nour-symbol.svg" alt="" width={62} height={62}/></div><span className={base.visualKicker}>{t("خبرات تتكامل","Expertise working together")}</span><strong>{t("لخدمة رحلة المعتمر","to serve the Umrah journey")}</strong><div className={base.visualLine}><span><CodeXml size={22}/></span><i/><span><Settings2 size={22}/></span><i/><span><Headset size={22}/></span></div><div className={base.visualCaptions}><span>{t("تقنية","Technology")}</span><span>{t("تشغيل","Operations")}</span><span>{t("خدمة","Service")}</span></div><div className={base.visualFooter}><Lightbulb size={16}/>{t("التطبيق قريبًا","App coming soon")}</div></div>
    </div></div></section>
    <section className={`${base.section} ${base.container}`} aria-labelledby="careers-purpose-title"><div className={base.sectionHeading}><span>{t("ما نعمل على بنائه","What we are building")}</span><h2 id="careers-purpose-title">{t("مساهمتك جزء من رحلة أكبر","Contribute to a wider journey")}</h2><p>{t("تعمل نور آب على منصة لخدمات وبرامج العمرة. تتكامل فيها التقنية والتشغيل وخدمة العملاء والمحتوى لتقديم المعلومات وتنظيم تجربة الخدمة.","Nour App is building a platform for Umrah services and programs. Technology, operations, customer service and content come together to provide information and organize the service experience.")}</p></div><div className={base.valueGrid}>{[
      [CodeXml,"تطوير التجربة الرقمية","Improve the digital experience","الإسهام في وضوح المنتج وسهولة استخدامه ودقة معلوماته.","Contribute to product clarity, usability and accurate information."],
      [Settings2,"تنظيم الخدمة والتشغيل","Organize service and operations","المساعدة في تحسين الإجراءات والتنسيق ومتابعة تقديم الخدمة.","Help improve processes, coordination and service delivery."],
      [Headset,"فهم احتياج المستفيد","Understand customer needs","تقديم معرفة أو محتوى أو دعم يسهم في تجربة المعتمر.","Bring knowledge, content or support that contributes to the Umrah experience."],
    ].map(([Icon,a,e,pa,pe],index)=>{const CardIcon=Icon as typeof CodeXml;return <article key={index}><CardIcon size={24} aria-hidden="true"/><h3>{t(a as string,e as string)}</h3><p>{t(pa as string,pe as string)}</p></article>;})}</div></section>
    <section id="career-areas" className={base.valueSection} aria-labelledby="career-areas-title"><div className={base.container}><div className={base.sectionHeading}><span>{t("أين يمكن أن تسهم؟","Where could you contribute?")}</span><h2 id="career-areas-title">{t("مجالات الانضمام","Professional areas")}</h2><p>{t("هذه مجالات لاستقبال الاهتمام، وليست إعلانًا عن وظائف شاغرة. اختر مجالًا ليُحدد داخل طلبك، ويمكن تغييره لاحقًا.","These areas collect expressions of interest; they are not vacancy announcements. Choose an area to prefill your application. You can change it later.")}</p></div><div className={styles.areaGrid} role="group" aria-label={t("المجال المهني","Professional area")}>{careerAreas.map((item,index)=>{const Icon=icons[index];return <button type="button" key={item.value} aria-pressed={area===item.value} disabled={busy} data-career-area={item.value} className={styles.areaCard} onClick={()=>selectArea(item.value)}><span className={base.iconBox}><Icon size={24} aria-hidden="true"/></span><h3>{item[language]}</h3><p>{ar?item.descriptionAr:item.descriptionEn}</p><span className={base.trackAction}>{area===item.value?t("المجال المحدد","Selected area"):t("اختر هذا المجال","Choose this area")}<DirectionArrow size={16} aria-hidden="true"/></span></button>;})}</div></div></section>
    <section className={`${base.section} ${base.container}`}><div className={styles.poolBanner}><span className={base.iconBox}><BriefcaseBusiness size={26} aria-hidden="true"/></span><div><h2>{t("لم تجد فرصة مناسبة؟","Haven't found a suitable opportunity?")}</h2><p>{t("انضم إلى قاعدة المواهب لبحث ملاءمتك للفرص المستقبلية. التقديم المتاح في هذه الصفحة مخصص لقاعدة المواهب.","Join the talent pool to be considered for future opportunities. Applications on this page are for the talent pool.")}</p></div><a href="#talent-interest" className={base.blueButton}>{t("عرّفنا بنفسك","Introduce yourself")}</a></div></section>
    <section className={`${base.container} ${styles.journeySection}`} aria-labelledby="talent-journey-title"><div className={base.sectionHeading}><span>{t("خطوات التقديم","Application steps")}</span><h2 id="talent-journey-title">{t("ماذا بعد اهتمامك؟","What follows your interest?")}</h2></div><ol className={`${base.journey} ${styles.journey}`}>{journey.map(([a,e,pa,pe],index)=><li key={index}><span>{String(index+1).padStart(2,"0")}</span><h3>{t(a,e)}</h3><p>{t(pa,pe)}</p></li>)}</ol></section>
    <section id="talent-interest" className={`${base.section} ${base.container}`} aria-labelledby="talent-form-title"><div className={base.sectionHeading}><span>{t("قاعدة المواهب","Talent pool")}</span><h2 id="talent-form-title" tabIndex={-1}>{t("عرّفنا بنفسك","Tell us about yourself")}</h2><p>{t("ثلاث خطوات لتسجيل اهتمامك. السيرة الذاتية اختيارية، ولن تُرفع قبل إرسال الطلب.","Three steps to register your interest. Your CV is optional and will not be uploaded before you submit.")}</p></div><TalentForm language={language} area={area} onAreaChange={setArea} step={step} onStepChange={setStep} onBusyChange={setBusy}/></section>
    <section className={`${base.faqSection} ${base.container}`} aria-labelledby="talent-faq-title"><div className={base.sectionHeading}><span>{t("قبل أن ترسل طلبك","Before you apply")}</span><h2 id="talent-faq-title">{t("أسئلة شائعة","Frequently asked questions")}</h2></div><div className={base.faqList}>{faqs.map(([a,e,pa,pe])=><details key={a}><summary>{t(a,e)}<ChevronDown size={19} aria-hidden="true"/></summary><p>{t(pa,pe)}</p></details>)}</div></section>
    <footer className={base.footer}><div className={base.container}><span>{t("نور آب • التقنية والخدمة والتشغيل","Nour App • Technology, service and operations")}</span><Link href="/privacy">{t("سياسة الخصوصية","Privacy Policy")}</Link></div></footer>
  </main>;
}
