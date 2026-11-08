"use client";

import {usePresentation} from '../../src/features/website/usePresentation';
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronDown, FileCheck2, FileDown, Globe2, Handshake, Layers3, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../../src/core/i18n";
import { partnerGuide } from "../../src/features/applications/partner-guide";
import PartnerInterestForm from "../../src/features/applications/components/PartnerInterestForm";
import type { Track } from "../../src/features/applications/utils/partner-interest-form";
import styles from "../../src/features/applications/components/partnership.module.css";

const journey = [
  ["تقديم طلب الاهتمام", "Submit your interest", "عرّفنا بمنشأتك ونطاق عملك.", "Introduce your organization and scope of work."],
  ["المراجعة الأولية والتواصل", "Initial review and contact", "يراجع الفريق البيانات ويتواصل مع المسؤول.", "The team reviews your details and contacts your representative."],
  ["استكمال متطلبات التأهيل", "Complete qualification", "تُحدد الوثائق والمتطلبات المناسبة للنشاط والدولة.", "Requirements and documents are identified for your activity and country."],
  ["الاتفاق والتعاقد", "Agreement and contracting", "تُناقش الأدوار والنطاق والشروط وتُوثّق بالاتفاقية.", "Roles, scope and commercial terms are discussed and documented."],
  ["التهيئة وبدء التشغيل", "Prepare for operations", "يبدأ التشغيل بعد اختبار الجاهزية وصدور الاعتماد.", "Operations begin after readiness checks and approval."],
];

export default function BecomePartnerPage() {
  const pageContent=usePresentation().pages.partner;const faqs=pageContent.faqs.map(f=>[f.question.ar,f.question.en,f.answer.ar,f.answer.en]);
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const t = (a: string, e: string) => ar ? a : e;
  const [track, setTrack] = useState<Track>("international");
  const [busy, setBusy] = useState(false);
  const guide = partnerGuide[language];
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  const requirements = track === "international" ? [
    ["بيانات المنشأة والمفوّض ومستندات النشاط", "Company, representative and activity documents"],
    ["جاهزية مالية ومحاسبية ودراسة وسائل الدفع", "Financial and accounting readiness and payment assessment"],
    ["مراجعة التقنية والبيانات ومتطلبات الدولة", "Technology, data and country requirements review"],
    ["عينات البرامج وجهات التأشيرات وفهرس المرفقات", "Package samples, visa providers and attachment index"],
  ] : [
    ["بيانات المنشأة والمسؤول ونطاق التغطية", "Company, contact and service coverage details"],
    ["تعريف بالخدمات والخبرة والقدرة على تقديمها", "Service overview, experience and delivery capability"],
    ["التراخيص ذات الصلة بحسب النشاط والدولة", "Relevant licenses for the activity and country"],
    ["متطلبات الجودة والتشغيل التي تُناقش أثناء التقييم", "Quality and operational requirements discussed during evaluation"],
  ];
  return <main className={styles.page} lang={language} dir={ar ? "rtl" : "ltr"}>
    <a href="#interest" className={styles.skipLink}>{t("انتقل إلى طلب الاهتمام", "Skip to the application")}</a>
    <header className={styles.topbar}>
      <Link href="/" aria-label={t("نور آب — الرئيسية", "Nour App — Home")}><Image src="/images/brand/nour-horizontal.svg" alt={t("نور آب", "Nour App")} width={138} height={44} priority/></Link>
      <nav aria-label={t("تنقل الصفحة", "Page navigation")}><Link href="/">{t("الرئيسية", "Home")}</Link><button type="button" onClick={() => setLanguage(ar ? "en" : "ar")}>{ar ? "English" : "العربية"}</button></nav>
    </header>
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div><span className={styles.eyebrow}><Handshake size={16} aria-hidden="true"/>{t("شراكات نور آب", "Nour App partnerships")}</span>
            <h1>{pageContent.title[language]}<br/><span>{pageContent.emphasis[language]}</span></h1><p>{pageContent.description[language]}</p>
            <div className={styles.heroActions}><a className={styles.primaryButton} href="#interest">{t("ابدأ طلب الاهتمام", "Start your expression of interest")}<DirectionArrow size={18} aria-hidden="true"/></a><a className={styles.secondaryButton} href="#tracks">{t("اكتشف مسارات الشراكة", "Explore partnership tracks")}</a></div>
            <span className={styles.heroNote}><ShieldCheck size={15} aria-hidden="true"/>{t("طلب اهتمام أولي • دون مستندات حساسة", "An initial expression of interest • No sensitive documents")}</span>
          </div>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualBadge}><Image src="/images/brand/nour-symbol.svg" alt="" width={62} height={62}/></div>
            <span className={styles.visualKicker}>{t("من اهتمام مشترك", "From shared interest")}</span>
            <strong>{t("إلى تعاون واضح", "to clear collaboration")}</strong>
            <div className={styles.visualLine}><span><Globe2 size={22}/></span><i/><span><Handshake size={22}/></span><i/><span><CheckCircle2 size={22}/></span></div>
            <div className={styles.visualCaptions}><span>{t("نطاق محدد", "Defined scope")}</span><span>{t("تقييم وتعاقد", "Review and agreement")}</span><span>{t("اعتماد مستقل", "Separate approval")}</span></div>
            <div className={styles.visualFooter}><Sparkles size={16}/>{t("خطوات مدروسة لبداية مشتركة", "Considered steps towards collaboration")}</div>
          </div>
        </div>
      </div>
    </section>
    <section id="tracks" className={`${styles.section} ${styles.container}`} aria-labelledby="tracks-title">
      <div className={styles.sectionHeading}><span>{t("مساران للتعاون", "Two ways to collaborate")}</span><h2 id="tracks-title">{t("أين تبدأ شراكتك؟", "Where does your partnership begin?")}</h2><p>{t("اختر ما يناسب نشاطك. سنخصص المتطلبات وطلب الاهتمام لمسارك.", "Choose the track that fits your activity. Requirements and the application will adapt to your choice.")}</p></div>
      <div className={styles.trackGrid} role="group" aria-label={t("مسار الشراكة", "Partnership track")}>
        {(["international", "service_provider"] as const).map(value => {
          const Icon = value === "international" ? Globe2 : Building2;
          return <button type="button" key={value} className={styles.trackCard} aria-pressed={track === value} disabled={busy} onClick={() => setTrack(value)}>
            <div className={styles.trackTop}><span className={styles.iconBox}><Icon size={26} aria-hidden="true"/></span><span className={styles.selectedMark}>{track === value ? <Check size={16} aria-hidden="true"/> : null}</span></div>
            <h3>{value === "international" ? t("شريك دولي في دولة", "International country partner") : t("مزوّد خدمات", "Service provider")}</h3>
            <p>{value === "international" ? t("تعاون في سوقك المحلي، بنطاق عمل يُحدد بعد التقييم ومراجعة متطلبات الدولة والتعاقد.", "Collaborate in your local market, with a scope defined through evaluation, country requirements review and contracting.") : t("فنادق ونقل وطيران وتأشيرات وخدمات أخرى مرتبطة برحلة العمرة، بحسب النشاط والتراخيص ذات الصلة.", "Hotels, transport, flights, visas and other Umrah-related services, according to your activity and relevant licenses.")}</p>
            <span className={styles.trackAction}>{track === value ? t("المسار المحدد", "Selected track") : t("اختيار هذا المسار", "Choose this track")}<DirectionArrow size={17} aria-hidden="true"/></span>
          </button>;
        })}
      </div>
    </section>
    <section className={styles.valueSection} aria-labelledby="value-title"><div className={styles.container}>
      <div className={styles.sectionHeading}><span>{t("أساس التعاون", "The foundation of collaboration")}</span><h2 id="value-title">{t("قيمة مشتركة ومسؤوليات واضحة", "Shared purpose, clear responsibilities")}</h2></div>
      <div className={styles.valueGrid}>{[
        [Handshake, "ما نهدف إليه", "What we aim for", "تعاون منظم يسهم في جودة الخدمات ووضوح تجربة المعتمر، ضمن نطاق متفق عليه.", "Structured collaboration that supports service quality and a clearer Umrah experience within an agreed scope."],
        [Layers3, "ما تقدمه نور آب", "What Nour App provides", "دراسة فرص التعاون، ومراجعة الجاهزية والمتطلبات، وتحديد إطار العمل مع فريق الشراكات.", "Assessment of collaboration opportunities, review of readiness and requirements, and coordination of the proposed scope with the partnerships team."],
        [ShieldCheck, "ما ننتظره من الشريك", "What we expect from partners", "جودة الخدمة، ودقة البيانات، والجاهزية، والتعاون في استكمال المتطلبات والتشغيل المتفق عليه.", "Service quality, accurate information, readiness and cooperation in completing requirements and agreed operations."],
      ].map(([Icon, a, e, pa, pe], index) => {
        const CardIcon = Icon as typeof Handshake;
        return <article key={index}><CardIcon size={24} aria-hidden="true"/><h3>{t(a as string, e as string)}</h3><p>{t(pa as string, pe as string)}</p></article>;
      })}</div>
    </div></section>
    <section className={`${styles.section} ${styles.container}`} aria-labelledby="journey-title"><div className={styles.sectionHeading}><span>{t("من الطلب إلى البداية", "From application to getting started")}</span><h2 id="journey-title">{t("رحلة الانضمام", "Your partnership journey")}</h2></div>
      <ol className={styles.journey}>{journey.map(([a, e, pa, pe], index) => <li key={a}><span>{String(index + 1).padStart(2, "0")}</span><h3>{t(a, e)}</h3><p>{t(pa, pe)}</p></li>)}</ol>
    </section>
    <section id="requirements" className={styles.requirementsSection} aria-labelledby="requirements-title"><div className={`${styles.container} ${styles.requirementsGrid}`}>
      <div><div className={styles.sectionHeading}><span>{track === "international" ? t("مسار الشريك الدولي", "International partner track") : t("مسار مزوّد الخدمات", "Service provider track")}</span><h2 id="requirements-title">{t("اعرف المتطلبات قبل أن تبدأ", "Know what comes next")}</h2><p>{t("طلب الاهتمام هو البداية. تُستكمل متطلبات التأهيل المناسبة بعد المراجعة الأولية.", "Your expression of interest is the first step. Relevant qualification requirements follow the initial review.")}</p></div>
        <ul className={styles.requirementList}>{requirements.map(([a, e]) => <li key={a}><CheckCircle2 size={19} aria-hidden="true"/>{t(a, e)}</li>)}</ul>
        <p className={styles.privacyNote}><ShieldCheck size={20} aria-hidden="true"/>{t("الهويات والبيانات البنكية والمستندات الحساسة تُطلب لاحقًا عند الحاجة عبر القناة المعتمدة. لا تُرفقها بطلب الاهتمام.", "Identity, banking and other sensitive documents are requested later when needed through the approved channel. Do not attach them to your expression of interest.")}</p>
      </div>
      <aside className={styles.guideCard}><span className={styles.iconBox}><FileCheck2 size={28} aria-hidden="true"/></span><h3>{t("دليل الشريك الدولي", "International partner guide")}</h3><p>{track === "international" ? t("مرجع تجهيز ملف التأهيل ومتطلبات الدولة والمرفقات والإقرار.", "Your reference for preparing the qualification pack, country requirements, attachments and declaration.") : t("الدليل مرجع لمسار الشريك الدولي. لا تُطبّق جميع متطلباته على مزوّدي الخدمات؛ يُحدد المطلوب بحسب النشاط.", "This guide covers the international partner track. Its full requirements do not apply to every service provider; requirements depend on the activity.")}</p>
        <span className={styles.guideMeta}>{t("العربية", "English")} • {t("الإصدار", "Version")} <bdi>{guide.version}</bdi></span>
        <nav aria-label={t("الدليل وملفات التنزيل", "Guide and downloads")}><Link className={styles.blueButton} href={`/become-a-partner/guide?lang=${language}`}><ListChecks size={18} aria-hidden="true"/>{t("قراءة الدليل", "Read the guide")}</Link><div><a href={guide.downloads.pdf} download><FileDown size={17} aria-hidden="true"/>{t("تنزيل PDF", "Download PDF")}</a><a href={guide.downloads.word} download><FileDown size={17} aria-hidden="true"/>{t("تنزيل Word", "Download Word")}</a></div></nav>
      </aside>
    </div></section>
    <section id="interest" className={`${styles.section} ${styles.container}`} aria-labelledby="interest-title"><div className={styles.sectionHeading}><span>{t("لنبدأ بالتعارف", "Let's get acquainted")}</span><h2 id="interest-title">{t("قدّم طلب اهتمام", "Express your interest")}</h2><p>{t("ثلاث خطوات لتعريفنا بمنشأتك. لا حاجة لرفع مستندات الآن.", "Three steps to introduce your organization. No documents to upload at this stage.")}</p></div>
      <PartnerInterestForm track={track} language={language} onBusyChange={setBusy}/>
    </section>
    <section className={`${styles.faqSection} ${styles.container}`} aria-labelledby="faq-title"><div className={styles.sectionHeading}><span>{t("قبل أن تتقدم", "Before you apply")}</span><h2 id="faq-title">{t("أسئلة شائعة", "Frequently asked questions")}</h2></div><div className={styles.faqList}>{faqs.map(([a, e, pa, pe]) => <details key={a}><summary>{t(a, e)}<ChevronDown size={19} aria-hidden="true"/></summary><p>{t(pa, pe)}</p></details>)}</div></section>
    <footer className={styles.footer}><div className={styles.container}><span>{t("نور آب • شراكات تُبنى بخطوات واضحة", "Nour App • Partnerships built through clear steps")}</span><Link href="/privacy">{t("سياسة الخصوصية", "Privacy Policy")}</Link></div></footer>
  </main>;
}
