"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ArrowUp, BookOpenText, ChevronDown, Copy, FileDown, Info, List, Printer, Search, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "../../../src/core/i18n";
import { partnerGuide, type GuideBlock, type GuideDocument } from "../../../src/features/applications/partner-guide";
import { guideBlockId, guideGroups, guideInterface, guideMatches, guideNotices, guideSummary, normalizeGuideSearch, searchGuide, type GuideLanguage } from "../../../src/features/applications/guide-reading";
import styles from "./guide.module.css";

export type GuideFileSizes = Record<GuideLanguage, { pdf: number | null; word: number | null }>;
type Highlight = { id: string; query: string } | null;
const explicitClick = (event: MouseEvent<HTMLAnchorElement>) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export default function GuideReader({ initialLanguage, fileSizes }: { initialLanguage: GuideLanguage; fileSizes: GuideFileSizes }) {
  const { setLanguage: setSharedLanguage } = useLanguage();
  const [language, setLanguage] = useState(initialLanguage);
  const guide = partnerGuide[language];
  const t = guideInterface[language];
  const ar = language === "ar";
  const [active, setActive] = useState("start");
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<Highlight>(null);
  const [copyStatus, setCopyStatus] = useState<{ id: string; success: boolean } | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDetailsElement>(null);
  const pendingSection = useRef<string | null>(null);
  const currentSection = guide.sections.find(section => section.id === active) ?? guide.sections[0];
  const results = useMemo(() => searchGuide(guide, query), [guide, query]);
  const updated = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { dateStyle: "long", calendar: "gregory", timeZone: "UTC" }).format(new Date(`${guide.updatedAt}T00:00:00Z`));

  const scrollTo = useCallback((id: string, focus = true, smooth = true) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView?.({ block: "start", behavior: smooth && !reduceMotion ? "smooth" : "instant" });
    if (focus) target.focus({ preventScroll: true });
  }, []);
  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string, sectionId = id, resultQuery?: string) {
    if (!explicitClick(event)) return;
    event.preventDefault();
    const url = new URL(window.location.href); url.hash = id;
    if (window.location.hash !== url.hash) window.history.pushState(null, "", url);
    if (guide.sections.some(section => section.id === sectionId)) setActive(sectionId);
    if (mobileRef.current) mobileRef.current.open = false;
    if (resultQuery) setHighlight({ id, query: resultQuery });
    scrollTo(id);
  }
  function switchLanguage(event: MouseEvent<HTMLAnchorElement>) {
    if (!explicitClick(event)) return;
    event.preventDefault();
    const next = ar ? "en" : "ar";
    pendingSection.current = active;
    const url = new URL(window.location.href); url.searchParams.set("lang", next); url.hash = active;
    window.history.replaceState(null, "", url);
    setLanguage(next); setSharedLanguage(next); setQuery(""); setHighlight(null);
  }
  useEffect(() => {
    if (pendingSection.current) { scrollTo(pendingSection.current, false, false); pendingSection.current = null; }
  }, [language, scrollTo]);
  useEffect(() => {
    const syncLocation = () => {
      const url = new URL(window.location.href);
      const nextLanguage = url.searchParams.get("lang") === "en" ? "en" : "ar";
      const id = decodeHash(url.hash);
      if (id && document.getElementById(id)) {
        pendingSection.current = id;
        scrollTo(id, false, false);
      }
      setLanguage(nextLanguage);
    };
    const firstId = decodeHash(window.location.hash);
    if (firstId) scrollTo(firstId, false, false);
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    return () => { window.removeEventListener("popstate", syncLocation); window.removeEventListener("hashchange", syncLocation); };
  }, [scrollTo]);
  useEffect(() => {
    let frame = 0;
    const readPosition = () => {
      frame = 0;
      const top = (headerRef.current?.getBoundingClientRect().height ?? 76) + (window.innerWidth <= 1000 ? 76 : 32);
      let id = guide.sections[0].id;
      for (const section of guide.sections) {
        if ((document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= top) id = section.id;
      }
      setActive(previous => previous === id ? previous : id);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(readPosition); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [guide]);
  useEffect(() => {
    if (!highlight) return;
    const timer = window.setTimeout(() => setHighlight(null), 4500);
    return () => window.clearTimeout(timer);
  }, [highlight]);
  useEffect(() => {
    if (!copyStatus) return;
    const timer = window.setTimeout(() => setCopyStatus(null), 3500);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);
  async function copySection(id: string) {
    const url = new URL(window.location.href); url.searchParams.set("lang", language); url.hash = id;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url.href);
      setCopyStatus({ id, success: true });
    } catch { setCopyStatus({ id, success: false }); }
  }
  const nav = <GuideNavigation guide={guide} language={language} active={active} navigate={navigate}/>;
  return <main className={styles.page} dir={ar ? "rtl" : "ltr"} lang={language}>
    <a className={styles.skipLink} href="#guide-content">{t.skip}</a>
    <header ref={headerRef} className={styles.topbar}>
      <div className={styles.container}>
        <Link href="/become-a-partner" aria-label={t.back}><Image src="/images/brand/nour-horizontal.svg" alt={t.brand} width={130} height={42} priority/></Link>
        <nav aria-label={t.contents}><Link href={`/become-a-partner?lang=${language}`}>{t.back}</Link><a href="#guide-downloads" onClick={event => navigate(event, "guide-downloads", active)} className={styles.headerDownload}><ArrowDownToLine size={16} aria-hidden="true"/>{t.download}</a><a href={`?lang=${ar ? "en" : "ar"}#${active}`} onClick={switchLanguage} lang={ar ? "en" : "ar"}>{ar ? "English" : "العربية"}</a></nav>
      </div>
    </header>
    <div className={styles.mobileBar}>
      <details ref={mobileRef} onKeyDown={event => { if (event.key === "Escape" && mobileRef.current?.open) { mobileRef.current.open = false; mobileRef.current.querySelector("summary")?.focus(); } }}>
        <summary><List size={18} aria-hidden="true"/>{t.browse}<ChevronDown size={16} aria-hidden="true"/></summary>
        <div className={styles.mobileMenu}>{nav}</div>
      </details>
      <span title={currentSection.title}>{t.section} {String(guide.sections.indexOf(currentSection) + 1).padStart(2, "0")} · {currentSection.title}</span>
    </div>
    <div className={styles.container}>
      <section id="guide-top" className={styles.intro} tabIndex={-1}>
        <span className={styles.eyebrow}><BookOpenText size={17} aria-hidden="true"/>{t.kicker}</span>
        <h1>{guide.title}</h1>{partnerGuide.ar.version!==partnerGuide.en.version&&<p role="note">{ar?`تختلف أرقام إصدارات المصدر: العربية ${partnerGuide.ar.version} والإنجليزية ${partnerGuide.en.version}. رقم هذه الصفحة يطابق ملفات اللغة المختارة؛ يبقى الإصدار العربي 1.1 محفوظًا.`:`Source versions differ: Arabic ${partnerGuide.ar.version}, English ${partnerGuide.en.version}. This reader matches the selected language files; the Arabic 1.1 baseline is retained.`}</p>}<p className={styles.purpose}>{t.purpose}</p>
        <p className={styles.meta}>{t.version} <bdi>{guide.version}</bdi><span aria-hidden="true"> / </span>{t.updated}: {updated}</p>
        <div className={styles.introActions}><Link href={`/become-a-partner?lang=${language}#interest`} className={styles.primaryButton}>{t.apply}</Link><a className={styles.secondaryButton} href="#guide-downloads" onClick={event => navigate(event, "guide-downloads", active)}><ArrowDownToLine size={17} aria-hidden="true"/>{t.download}</a></div>
        <div className={styles.notice}><ShieldCheck size={21} aria-hidden="true"/><div><strong>{t.later}</strong><p>{t.readOnly}</p></div></div>
      </section>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>{nav}</aside>
        <div className={styles.readingColumn}>
          <section className={styles.search} aria-label={t.search}>
            <label htmlFor="guide-search"><Search size={18} aria-hidden="true"/>{t.search}</label>
            <div className={styles.searchInput}><input id="guide-search" type="search" autoComplete="off" maxLength={150} value={query} onChange={event => setQuery(event.target.value)} placeholder={t.searchPlaceholder} aria-describedby="guide-search-help" aria-controls="guide-search-results"/>{query && <button type="button" aria-label={t.clear} onClick={() => { setQuery(""); setHighlight(null); document.getElementById("guide-search")?.focus(); }}><X size={17} aria-hidden="true"/></button>}</div>
            <p id="guide-search-help">{t.searchHint} <span>{t.local}</span></p>
            <div id="guide-search-results">
              <p className={styles.searchStatus} role="status" aria-live="polite">{query ? normalizeGuideSearch(query).length < 2 ? t.minimum : results.length ? `${results.length} ${t.count}` : t.none : ""}</p>
              {!!results.length && <ol className={styles.results} aria-label={t.results}>{results.map(result => <li key={result.id}><a href={`#${result.id}`} onClick={event => navigate(event, result.id, result.sectionId, query)}><strong>{result.sectionTitle}</strong><span><Marked text={result.excerpt} query={query}/></span><small>{t.openResult} ←</small></a></li>)}</ol>}
            </div>
          </section>
          <article id="guide-content" className={styles.article} tabIndex={-1} aria-label={guide.title}>
            {guide.sections.map((section, index) => <section key={section.id} id={section.id} className={styles.section} aria-labelledby={`${section.id}-title`} tabIndex={-1}>
              <div className={styles.sectionTop}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><button className={styles.copyButton} type="button" aria-label={`${t.copy}: ${section.title}`} onClick={() => void copySection(section.id)}><Copy size={15} aria-hidden="true"/>{copyStatus?.id === section.id && copyStatus.success ? t.copied : t.copy}</button></div>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              <dl className={styles.summary} aria-label={t.summary}>{guideSummary(section).map(item => <div key={item.label}><dt>{t[item.label]}</dt><dd><a href={`#${item.sourceId}`} onClick={event => navigate(event, item.sourceId, section.id)}>{item.text}</a></dd></div>)}</dl>
              <p className={styles.fullLabel}>{t.full}</p>
              <SourceBlocks section={section} language={language} highlight={highlight}/>
              <a href="#guide-top" className={styles.back} onClick={event => navigate(event, "guide-top", "start")}><ArrowUp size={14} aria-hidden="true"/>{t.top}</a>
            </section>)}
          </article>
        </div>
      </div>
      <section id="guide-downloads" className={styles.downloadCenter} tabIndex={-1} aria-labelledby="guide-downloads-title">
        <div><span className={styles.eyebrow}><FileDown size={17} aria-hidden="true"/>{t.download}</span><h2 id="guide-downloads-title">{t.downloads}</h2><p>{t.downloadHint}</p></div>
        <div className={styles.downloadCards}>{(["pdf", "word"] as const).map(format => <div className={styles.downloadCard} key={format}><span className={styles.fileIcon}>{format === "pdf" ? "PDF" : "DOCX"}</span><div><h3>{format === "pdf" ? "PDF" : "Word"}</h3><p>{t[format]}</p><span>{t.fileLanguage}: {t.language} · {t.version} <bdi>{guide.version}</bdi>{fileSizes[language][format] !== null && <> · <bdi>{formatSize(fileSizes[language][format]!, language)}</bdi></>}</span></div><a href={guide.downloads[format]} download><ArrowDownToLine size={18} aria-hidden="true"/>{t.download}<span className={styles.srOnly}> {format === "pdf" ? "PDF" : "Word"} · {t.language}</span></a></div>)}</div>
        <div className={styles.printAction}><button type="button" className={styles.secondaryButton} onClick={() => window.print()}><Printer size={18} aria-hidden="true"/>{t.print}</button><p>{t.printHint}</p></div>
      </section>
      <footer className={styles.footer}><span>{t.brand} · {t.kicker}</span><Link href={`/become-a-partner?lang=${language}#interest`}>{t.apply}</Link></footer>
    </div>
    <div className={styles.toast} role="status" aria-live="polite">{copyStatus ? copyStatus.success ? t.copied : t.copyFailed : ""}</div>
  </main>;
}

function decodeHash(hash: string) { try { return decodeURIComponent(hash.replace(/^#/, "")); } catch { return ""; } }
function formatSize(bytes: number, language: GuideLanguage) {
  const t = guideInterface[language];
  const unit = bytes >= 1024 * 1024 ? t.mb : t.kb;
  return `${new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-GB", { maximumFractionDigits: 1 }).format(bytes / (bytes >= 1024 * 1024 ? 1024 * 1024 : 1024))} ${unit}`;
}
function GuideNavigation({ guide, language, active, navigate }: { guide: GuideDocument; language: GuideLanguage; active: string; navigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void }) {
  const t = guideInterface[language];
  return <nav className={styles.contents} aria-label={t.contents}><h2>{t.contents}</h2>{guideGroups.map(group => <div key={group.sections[0]} className={styles.navGroup}><h3>{group[language]}</h3><ol>{group.sections.map(id => {
    const index = guide.sections.findIndex(section => section.id === id); const section = guide.sections[index];
    return <li key={id}><a href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={event => navigate(event, id)}><bdi>{String(index + 1).padStart(2, "0")}</bdi><span>{section.title}</span></a></li>;
  })}</ol></div>)}</nav>;
}
function Marked({ text, query }: { text: string; query?: string }) {
  const ranges = query ? guideMatches(text, query) : [];
  if (!ranges.length) return <>{text}</>;
  const parts: ReactNode[] = []; let from = 0;
  for (const range of ranges) { parts.push(text.slice(from, range.start), <mark key={range.start}>{text.slice(range.start, range.end)}</mark>); from = range.end; }
  parts.push(text.slice(from)); return <>{parts}</>;
}
function SourceBlocks({ section, language, highlight }: { section: GuideDocument["sections"][number]; language: GuideLanguage; highlight: Highlight }) {
  const t = guideInterface[language]; const output: ReactNode[] = [];
  const attributes = (index: number) => ({ id: guideBlockId(section.id, index), "data-source-block": true, tabIndex: -1, className: highlight?.id === guideBlockId(section.id, index) ? styles.resultTarget : undefined });
  const text = (index: number, value: string) => <Marked text={value} query={highlight?.id === guideBlockId(section.id, index) ? highlight.query : undefined}/>;
  for (let index = 0; index < section.blocks.length; index++) {
    const block = section.blocks[index];
    if (block.kind === "field") {
      const fields: ReactNode[] = []; const start = index;
      while (index < section.blocks.length && section.blocks[index].kind === "field") {
        const item = section.blocks[index] as Extract<GuideBlock, { text: string }>;
        fields.push(<li key={index} {...attributes(index)}>{text(index, item.text)}</li>); index++;
      }
      index--; output.push(<ul key={start} className={styles.requirementList}>{fields}</ul>); continue;
    }
    if (block.kind === "table") { output.push(<GuideTable key={index} {...attributes(index)} rows={block.rows} title={`${t.table} · ${section.title}`} language={language} query={highlight?.id === guideBlockId(section.id, index) ? highlight.query : undefined}/>); continue; }
    if (block.kind === "heading") {
      output.push(<Fragment key={index}><h3 {...attributes(index)}>{text(index, block.text)}</h3>{section.id === "submit" && index === 6 && <p className={styles.declarationNote}>{t.declaration}</p>}</Fragment>); continue;
    }
    const notice = guideNotices[section.id]?.[index];
    output.push(notice ? <aside key={index} {...attributes(index)} className={`${styles.sourceNotice} ${notice === "team" ? styles.teamNotice : ""} ${attributes(index).className ?? ""}`}><strong><Info size={17} aria-hidden="true"/>{t[notice]}</strong><p>{text(index, block.text)}</p></aside> : <p key={index} {...attributes(index)}>{text(index, block.text)}</p>);
  }
  return <div className={styles.source}>{output}</div>;
}
function GuideTable({ rows, title, language, query, ...attributes }: { rows: string[][]; title: string; language: GuideLanguage; query?: string; id: string; className?: string; tabIndex: number }) {
  const t = guideInterface[language];
  const cell = (value: string) => /^_+$/.test(value) ? <span className={styles.blank}>{t.blank}</span> : /^[A-Z][0-9]{0,2}$/.test(value) ? <bdi className={styles.code}><Marked text={value} query={query}/></bdi> : <Marked text={value} query={query}/>;
  return <div {...attributes} className={`${styles.tableBlock} ${attributes.className ?? ""}`}>
    <div className={styles.tableDesktop} tabIndex={0} role="region" aria-label={title}><table><caption className={styles.srOnly}>{title}</caption><thead><tr>{rows[0].map((heading, column) => <th key={column} scope="col">{heading}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{cell(value)}</td>)}</tr>)}</tbody></table></div>
    <div className={styles.tableCards}><ol aria-label={title}>{rows.slice(1).map((row, index) => <li key={index}><dl>{row.map((value, column) => <div key={column}><dt>{rows[0][column]}</dt><dd>{cell(value)}</dd></div>)}</dl></li>)}</ol></div>
  </div>;
}
