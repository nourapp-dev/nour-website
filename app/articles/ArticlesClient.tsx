"use client";
import { Suspense, useMemo, useState } from "react";
import ArticleNavigation from "./ArticleNavigation";
import Link from "next/link";
import { Search, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "../../src/core/i18n";
import { createClient } from "../../src/lib/supabase/client";
import { getPublicArticles, articleCategory } from "../../src/features/articles/public-articles";
import { articleMatches } from "../../src/features/articles/reading";
import ArticleCard from "../../src/features/articles/ArticleCard";
import { languageHref } from "../../src/core/i18n/public-language";
import styles from "./articles.module.css";
export default function ArticlesClient() {
  return <Suspense fallback={<p role="status">تحميل المقالات / Loading articles…</p>}><ArticleList /></Suspense>;
}
function ArticleList() {
  const { language } = useLanguage(), ar = language === "ar", client = useMemo(() => createClient("pilgrim"), []), params = useSearchParams(), router = useRouter();
  const category = params.get("category") || "all", urlSearch = params.get('q') || '', sort = params.get('sort') || 'featured';
  const [draft, setDraft] = useState({url: urlSearch, text: urlSearch});
  const search = draft.url === urlSearch ? draft.text : urlSearch;
  if (draft.url !== urlSearch) setDraft({url: urlSearch, text: urlSearch});
  const q = useQuery({queryKey: ["public", "articles"], queryFn: () => getPublicArticles(client), staleTime: 60000});
  const categories = [...new Map((q.data ?? []).map(articleCategory).filter(c => c != null).map(c => [c.id, c])).values()];
  const articles = (q.data ?? []).filter(a => (category === "all" || a.category_id === category) && articleMatches(a, search, language)).sort((a,b) => (sort === 'featured' ? Number(b.is_featured) - Number(a.is_featured) : 0) || (Date.parse(b.published_at ?? '') || 0) - (Date.parse(a.published_at ?? '') || 0));
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if(search) next.set("q", search); else next.delete("q");
    if (!value || value === 'all' || value === 'featured') next.delete(key); else next.set(key,value);
    router.replace(languageHref('/articles' + (next.size ? '?' + next : ''),language), {scroll:false});
  }
  return <main className={`nour-redesign ${styles.page}`} dir={ar ? 'rtl':'ltr'}>
    <div className={styles.container}>
      <ArticleNavigation />
      <header className={styles.listHero}><span className={styles.eyebrow}><BookOpen size={17}/>{ar ? 'مركز المعرفة':'Knowledge center'}</span><h1>{ar ? <>رحلة أوضح،<br/><span>بمعرفة أقرب.</span></> : <>A clearer journey.<br/><span>A little more knowledge.</span></>}</h1><p>{ar ? 'أدلة وإرشادات ترافقك من أول الاستعداد إلى تفاصيل رحلتك. تصفّح، اقرأ، وخطّط بخطوات أوضح.' : 'Practical guides from your first preparations to the details of your journey. Explore, read and plan with clarity.'}</p></header>
      <section className={styles.filters} aria-label={ar ? 'البحث وتصفية المقالات':'Search and filter articles'}><label className={styles.search}><span>{ar ? 'ابحث في المقالات':'Search articles'}</span><div><Search size={19} aria-hidden="true"/><input type="search" value={search} placeholder={ar ? 'ماذا تريد أن تعرف عن رحلتك؟':'What would you like to know?'} onChange={e=>setDraft({url:urlSearch,text:e.target.value})} onBlur={()=>update('q',search)} onKeyDown={e=>{if(e.key==='Enter')update('q',search);}}/></div></label><label><span>{ar ? 'التصنيف':'Category'}</span><select value={category} onChange={e=>update('category',e.target.value)}><option value="all">{ar ? 'جميع التصنيفات':'All categories'}</option>{categories.map(c=><option key={c.id} value={c.id}>{ar ? c.name_ar:c.name_en}</option>)}</select></label><label><span>{ar ? 'الترتيب':'Sort by'}</span><select value={sort} onChange={e=>update('sort',e.target.value)}><option value="featured">{ar ? 'مختارات نور آب':'Nour App picks'}</option><option value="latest">{ar ? 'الأحدث أولًا':'Latest first'}</option></select></label></section>
      {!q.isPending && !q.isError && <div className={styles.resultHeader}><h2>{search || category !== 'all' ? (ar ? 'نتائج البحث':'Search results') : (ar ? 'اكتشف المقالات':'Explore the journal')}</h2><span role="status" aria-live="polite">{articles.length} {ar ? 'مقال':'articles'}</span></div>}
      {q.isPending ? <div className={styles.state} role="status">{ar ? 'جارٍ تحميل المقالات…':'Loading articles…'}</div> : q.isError ? <div className={styles.state} role="alert"><h2>{ar ? 'تعذر تحميل المقالات':'Articles could not be loaded'}</h2><button onClick={()=>void q.refetch()}>{ar ? 'إعادة المحاولة':'Retry'}</button></div> : !articles.length ? <div className={styles.state}><BookOpen size={32}/><h2>{ar ? 'لا توجد مقالات لعرضها':'No articles to show'}</h2><p>{ar ? 'جرّب كلمات أخرى أو استعرض جميع التصنيفات.':'Try different keywords or browse all categories.'}</p>{(search || category !== 'all') && <Link href={languageHref('/articles',language)}>{ar ? 'عرض جميع المقالات':'View all articles'}</Link>}</div> : <div className={styles.grid}>{articles.map(article=><ArticleCard key={article.id} article={article} language={language}/>)}</div>}
      <footer className={styles.pageFooter}><p>{ar ? 'معك، في كل خطوة من رحلتك.':'With you, every step of your journey.'}</p><Link href={languageHref('/programs',language)}>{ar ? 'استكشف برامج نور آب':'Explore Nour App programs'}</Link></footer>
    </div>
  </main>;
}
