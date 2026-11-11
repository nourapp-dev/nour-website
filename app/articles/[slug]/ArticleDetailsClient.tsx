"use client";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock3, Copy, Check, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicArticle, getPublicArticles, articleCategory, articleDate } from "../../../src/features/articles/public-articles";
import { toContentBlocks, readingMinutes } from "../../../src/features/articles/reading";
import ArticleCard from "../../../src/features/articles/ArticleCard";
import { languageHref } from "../../../src/core/i18n/public-language";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";
import styles from "../articles.module.css";
import ArticleNavigation from "../ArticleNavigation";
export default function ArticleDetailsClient() {
  const {language} = useLanguage(), ar = language === 'ar';
  const params = useParams<{slug:string}>(), slug = typeof params.slug === 'string' ? params.slug : '';
  const supabase = useMemo(()=>createClient('pilgrim'),[]);
  const query = useQuery({queryKey:['public','article',slug],enabled:Boolean(slug),queryFn:()=>getPublicArticle(supabase,slug)});
  const article = query.data;
  const relatedQuery = useQuery({queryKey:['public','articles'],enabled:Boolean(article),queryFn:()=>getPublicArticles(supabase),staleTime:60000});
  const related = (relatedQuery.data ?? []).filter(a=>a.id!==article?.id && Boolean(article?.category_id) && a.category_id===article?.category_id).slice(0,3);
  const content = (ar ? article?.content_ar : article?.content_en) ?? '', blocks = toContentBlocks(content), headings = blocks.filter(b=>b.type==='heading');
  const [progress,setProgress] = useState(0), [copyState,setCopyState] = useState<'idle'|'copied'|'failed'>('idle');
  const prose = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let frame = 0;
    const measure=()=>{frame=0; const rect=prose.current?.getBoundingClientRect();if(rect)setProgress(Math.round(Math.max(0,Math.min(1,(window.innerHeight*.25-rect.top)/Math.max(1,rect.height-window.innerHeight*.5)))*100));};
    const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(measure);};
    schedule();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    return ()=>{window.cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[article?.id,language]);
  useEffect(()=>{if(copyState==='idle')return;const timer=setTimeout(()=>setCopyState('idle'),4000);return()=>clearTimeout(timer);},[copyState]);
  async function copyLink(){try {await navigator.clipboard.writeText(new URL(languageHref('/articles/'+encodeURIComponent(slug),language),window.location.origin).href);setCopyState('copied');}catch{setCopyState('failed');}}
  const title = ar ? article?.title_ar:article?.title_en, excerpt = ar ? article?.excerpt_ar:article?.excerpt_en, author = ar ? article?.author_name_ar:article?.author_name_en, category = article ? articleCategory(article):null;
  return <main className={`nour-redesign ${styles.page}`} dir={ar?'rtl':'ltr'}>
    <div className={styles.progress} aria-hidden="true"><span style={{width:`${progress}%`}}/></div>
    <div className={styles.container}>
      <ArticleNavigation detail />
      {query.isPending ? <div className={styles.state} role="status">{ar?'جارٍ تحميل المقال…':'Loading article…'}</div> : query.isError ? <div className={styles.state} role="alert"><h1>{ar?'تعذر تحميل المقال':'Article could not be loaded'}</h1><button onClick={()=>void query.refetch()}>{ar?'إعادة المحاولة':'Retry'}</button></div> : !article ? <div className={styles.state}><span>404</span><h1>{ar?'المقال غير متاح':'Article unavailable'}</h1><p>{ar?'قد يكون الرابط تغيّر أو المقال غير منشور.':'The link may have changed or the article is unpublished.'}</p><Link href={languageHref('/articles',language)}>{ar?'اكتشف مقالات أخرى':'Explore other articles'}</Link></div> : <>
        <header className={`${styles.detailHero} ${!article.image?styles.noCover:''}`}>
          <div><nav className={styles.breadcrumbs} aria-label={ar?'مسار الصفحة':'Breadcrumb'}><Link href={languageHref('/',language)}>{ar?'الرئيسية':'Home'}</Link><span>/</span><Link href={languageHref('/articles',language)}>{ar?'مركز المعرفة':'Knowledge center'}</Link></nav><div className={styles.meta}>{category && <Link className={styles.category} href={languageHref('/articles?category='+category.id,language)}>{ar?category.name_ar:category.name_en}</Link>}{article.published_at && <time dateTime={article.published_at}>{articleDate(article.published_at,language)}</time>}</div><h1>{title}</h1>{excerpt && <p className={styles.lead}>{excerpt}</p>}<div className={styles.readingMeta}><span><Clock3 size={16}/>{readingMinutes(content)} {ar?'دقائق قراءة تقريبًا':'min read, estimated'}</span>{author && <span>{ar?'بقلم':'By'} <strong>{author}</strong></span>}</div><div className={styles.heroActions}><a href="#article-content"><BookOpen size={17}/>{ar?'ابدأ القراءة':'Start reading'}</a><button onClick={()=>void copyLink()}>{copyState==='copied'?<Check size={17}/>:<Copy size={17}/>} {copyState==='copied'?(ar?'تم نسخ الرابط':'Link copied'):(ar?'نسخ رابط المقال':'Copy article link')}</button></div><span role="status" className={styles.copyStatus}>{copyState==='failed'?(ar?'تعذر النسخ؛ انسخ الرابط من شريط العنوان.':'Could not copy. Copy the URL from your address bar.'):''}</span></div>
          {article.image && <figure className={styles.cover}><Image src={article.image} alt={ar?article.imageAltAr:article.imageAltEn} width={900} height={700} unoptimized priority sizes="(max-width:800px) 100vw, 42vw"/></figure>}
        </header>
        <div className={styles.readingLayout}>
          {headings.length>0 && <aside className={styles.toc}><details open><summary>{ar?'في هذا المقال':'In this article'}<ChevronDown size={16}/></summary><ol>{headings.map(b=><li key={b.id}><a href={'#'+b.id}>{b.type==='heading'?b.text:''}</a></li>)}</ol></details></aside>}
          <article id="article-content" className={styles.article}>
            <div className={styles.prose} ref={prose}>{blocks.length ? blocks.map(b=>b.type==='heading'?<h2 id={b.id} key={b.id}>{b.text}</h2>:b.type==='list'?(b.ordered?<ol key={b.id}>{b.items.map((text,i)=><li key={i}>{text}</li>)}</ol>:<ul key={b.id}>{b.items.map((text,i)=><li key={i}>{text}</li>)}</ul>):<p key={b.id}>{b.text}</p>):<p>{ar?'محتوى المقال غير متوفر بهذه اللغة حاليًا.':'This article’s content is not available in this language yet.'}</p>}</div>
            {article.tags?.length>0 && <div className={styles.tags} aria-label={ar?'وسوم المقال':'Article tags'}>{article.tags.map(tag=><Link key={tag} href={languageHref('/articles?q='+encodeURIComponent(tag),language)}>#{tag}</Link>)}</div>}
            <div className={styles.articleEnd}><BookOpen size={24}/><div><h2>{ar?'لكل خطوة، معرفة تساعدك.':'A little knowledge for every step.'}</h2><p>{ar?'اكتشف المزيد من الأدلة والإرشادات لرحلتك مع نور آب.':'Explore more guides for your journey with Nour App.'}</p></div><Link href={languageHref('/articles',language)}>{ar?'تصفّح المقالات':'Browse articles'}</Link></div>
          </article>
        </div>
        {related.length>0 && <section className={styles.related}><div className={styles.resultHeader}><div><span className={styles.eyebrow}>{ar?'واصل الاكتشاف':'Keep exploring'}</span><h2>{ar?'قد يهمّك أيضًا':'You might also like'}</h2></div><Link href={languageHref('/articles',language)}>{ar?'جميع المقالات':'All articles'}</Link></div><div className={styles.grid}>{related.map(item=><ArticleCard key={item.id} article={item} language={language}/>)}</div></section>}
        {relatedQuery.isError && <p role="alert">{ar?'تعذر تحميل المقالات المقترحة.':'Suggested articles could not be loaded.'} <button onClick={()=>void relatedQuery.refetch()}>{ar?'إعادة المحاولة':'Retry'}</button></p>}
      </>}
      <footer className={styles.pageFooter}><Link href={languageHref('/',language)}>{ar?'نور آب · معك في رحلتك':'Nour App · With you on your journey'}</Link><Link href={languageHref('/programs',language)}>{ar?'استكشف البرامج':'Explore programs'}</Link></footer>
    </div>
  </main>;
}
