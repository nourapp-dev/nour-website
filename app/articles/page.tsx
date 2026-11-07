import type { Metadata } from "next";
import ArticlesClient from "./ArticlesClient";

export async function generateMetadata({searchParams}:{searchParams:Promise<{lang?:string}>}):Promise<Metadata>{
  const lang=(await searchParams).lang==='en'?'en':'ar';
  const title=lang==='ar'?'مقالات وإرشادات العمرة | NourApp':'Umrah articles and guides | NourApp';
  const description=lang==='ar'?'مقالات وإرشادات تساعدك على الاستعداد للعمرة وفهم الخدمات واتخاذ قرارات أوضح مع نور آب.':'Articles and guides to help you prepare for Umrah and understand Nour services.';
  return {title,description,alternates:{canonical:`/articles?lang=${lang}`,languages:{ar:'/articles?lang=ar',en:'/articles?lang=en'}},openGraph:{title,description,type:'website',locale:lang==='ar'?'ar_SA':'en_US'}};
}

export default function ArticlesPage() {
  return <ArticlesClient />;
}
