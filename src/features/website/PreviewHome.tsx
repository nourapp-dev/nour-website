"use client";
import { useEffect } from "react";
import PartnerPage from '../../../app/become-a-partner/page';
import CareersPage from '../../../app/join-us/CareersPage';
import {useLanguage} from '../../core/i18n';
import Home from "../../../app/HomeClient";
import { PresentationContext } from "./usePresentation";
import { normalizePresentation } from "./presentation";
export default function PreviewHome({
  value,
  theme,page,
}: {
  value: unknown;
  theme?: string;page?:string;
}) {
  const {language}=useLanguage();
  useEffect(() => {
    document.documentElement.dataset.theme =
      theme === "dark" ? "dark" : "light";
  }, [theme]);
  return (
    <PresentationContext.Provider value={normalizePresentation(value)}>
      {page==='partner'?<PartnerPage/>:page==='careers'?<CareersPage initialLanguage={language}/>:<Home/>}
    </PresentationContext.Provider>
  );
}
