"use client";

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Images, X, ImageOff} from 'lucide-react';
import styles from './ProgramGallery.module.css';

export type ProgramPhoto = {src:string;label:string};

export default function ProgramGallery({photos, language}:{photos:ProgramPhoto[];language:'ar'|'en'}) {
  const ar=language==='ar';
  const items=photos.filter((photo,index)=>photo.src && photos.findIndex(p=>p.src===photo.src)===index);
  const dialog=useRef<HTMLDialogElement>(null);
  const [selected,setSelected]=useState(0),[open,setOpen]=useState(false),[failed,setFailed]=useState<string[]>([]);
  const current=items[selected] ?? items[0];
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=previous;};
  },[open]);
  function show(index:number){setSelected(index);dialog.current?.showModal();setOpen(true);}
  function next(delta:number){setSelected(index=>(index+delta+items.length)%items.length);}
  function picture(photo:ProgramPhoto,priority=false){return failed.includes(photo.src)?<span className={styles.unavailable}><ImageOff size={28}/>{ar?'تعذر تحميل الصورة':'Image unavailable'}</span>:<Image src={photo.src} alt={photo.label} fill unoptimized priority={priority} sizes="(max-width:760px) 100vw, 50vw" onError={()=>setFailed(old=>[...old,photo.src])}/>;}
  if(!items.length)return <div className={styles.empty}><Images size={32}/><span>{ar?'لم تُنشر صور لهذا البرنامج بعد':'No photos published for this program yet'}</span></div>;
  return <div className={styles.gallery} dir={ar?'rtl':'ltr'}>
    <div className={`${styles.mosaic} ${items.length===1?styles.single:''}`}>
      <button className={styles.primary} type="button" onClick={()=>show(0)} aria-label={ar?'تكبير صورة البرنامج':'Enlarge program photo'}>{picture(items[0],true)}</button>
      {items.length>1 && <div className={styles.thumbnails}>{items.slice(1,3).map((photo,index)=><button type="button" key={photo.src} onClick={()=>show(index+1)} aria-label={(ar?'تكبير: ':'Enlarge: ')+photo.label}>{picture(photo)}</button>)}</div>}
      <button className={styles.showAll} type="button" onClick={()=>show(0)}><Images size={17}/>{ar?'عرض الصور':'View photos'} <span>({items.length})</span></button>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-label={ar?'صور البرنامج والإقامة':'Program and accommodation photos'} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();next(ar?-1:1);}if(e.key==='ArrowLeft'){e.preventDefault();next(ar?1:-1);}}}>
      {current && <div className={styles.viewer}><header><p>{current.label}</p><button type="button" onClick={()=>dialog.current?.close()} aria-label={ar?'إغلاق الصور':'Close photos'} autoFocus><X size={23}/></button></header><div className={styles.largeImage}>{open && picture(current)}</div><footer><button type="button" onClick={()=>next(-1)} disabled={items.length<2} aria-label={ar?'الصورة السابقة':'Previous photo'}>{ar?<ArrowRight size={22}/>:<ArrowLeft size={22}/>}</button><span aria-live="polite">{selected+1} / {items.length}</span><button type="button" onClick={()=>next(1)} disabled={items.length<2} aria-label={ar?'الصورة التالية':'Next photo'}>{ar?<ArrowLeft size={22}/>:<ArrowRight size={22}/>}</button></footer></div>}
    </dialog>
  </div>;
}
