"use client";
import Image from 'next/image';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Moon,Sun} from 'lucide-react';
import {useEffect} from 'react';
import {useLanguage} from '../../src/core/i18n';
import {languageHref} from '../../src/core/i18n/public-language';
import usePersistentState from '../../src/core/hooks/usePersistentState';
import styles from './articles.module.css';
export default function ArticleNavigation({detail=false}:{detail?:boolean}){
 const {language,toggleLanguage}=useLanguage(),ar=language==='ar';
 const [theme,setTheme]=usePersistentState<'light'|'dark'>('nour-theme','light',{serialize:v=>v,deserialize:v=>v==='dark'?'dark':'light'});
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 const Arrow=ar?ArrowRight:ArrowLeft,ThemeIcon=theme==='dark'?Sun:Moon;
 return <nav className={styles.topbar} aria-label={ar?'التنقل الرئيسي':'Main navigation'}><Link href={languageHref('/',language)}><Image src="/images/brand/nour-horizontal.svg" width={160} height={54} alt="نور آب | Nour App" priority/></Link><div className={styles.navActions}><Link className={styles.back} href={languageHref(detail?'/articles':'/',language)}><Arrow size={17}/>{detail?(ar?'المقالات':'Articles'):(ar?'الرئيسية':'Home')}</Link><button type="button" onClick={toggleLanguage} lang={ar?'en':'ar'}>{ar?'English':'العربية'}</button><button type="button" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={ar?(theme==='dark'?'المظهر الفاتح':'المظهر الداكن'):(theme==='dark'?'Light appearance':'Dark appearance')}><ThemeIcon size={18}/></button></div></nav>;
}
