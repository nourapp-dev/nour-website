"use client";
import { useLanguage } from "../../src/core/i18n";
import PublicPageShell from "../components/layout/PublicPageShell";
import AppLaunchPanel from "../components/AppLaunchPanel";
import "../programs/programs-ui.css";

export default function AppDownloadClient() {
  const { language } = useLanguage();
  return <PublicPageShell activeSection="journey"><main><AppLaunchPanel language={language} /></main></PublicPageShell>;
}
