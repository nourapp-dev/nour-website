import type { Metadata } from "next";
import CareersPage from "./CareersPage";
type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> };
export async function generateMetadata({searchParams}:Props):Promise<Metadata>{
 const en=(await searchParams).lang==="en";
 return {title:en?"Join Nour App | Talent pool":"انضم إلى فريق نور آب | قاعدة المواهب",description:en?"Explore professional areas at Nour App and share your experience and preferences through the talent pool application.":"تعرّف على مجالات العمل في نور آب وشارك خبرتك وتفضيلاتك عبر طلب الانضمام إلى قاعدة المواهب.",alternates:{canonical:`/join-us?lang=${en?"en":"ar"}`,languages:{ar:"/join-us?lang=ar",en:"/join-us?lang=en"}},...(process.env.NODE_ENV!=="production"||process.env.NEXT_PUBLIC_UI_PREVIEW==="true"?{robots:{index:false,follow:false}}:{})};
}
export default async function JoinUsPage({searchParams}:Props){return <CareersPage initialLanguage={(await searchParams).lang==="en"?"en":"ar"}/>;}
