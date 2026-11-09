import type { Metadata } from "next";
import VideosClient from "./VideosClient";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const en = (await searchParams).lang === "en";
  return {
    title: en ? "Nour App videos" : "فيديوهات نور آب",
    description: en
      ? "Discover Nour App through videos and visual guides."
      : "تعرّف على نور آب من خلال الفيديوهات والإرشادات المرئية.",
    alternates: {
      canonical: "/videos",
      languages: { ar: "/videos?lang=ar", en: "/videos?lang=en" },
    },
  };
}
export default function VideosPage() {
  return <VideosClient />;
}
