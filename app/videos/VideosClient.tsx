"use client";
import PublicPageShell from "../components/layout/PublicPageShell";
import { useLanguage } from "../../src/core/i18n";
import VideoShowcase from "../../src/features/videos/VideoShowcase";
export default function VideosClient() {
  const { language } = useLanguage();
  return (
    <PublicPageShell>
      <main>
        <VideoShowcase language={language} gallery />
      </main>
    </PublicPageShell>
  );
}
