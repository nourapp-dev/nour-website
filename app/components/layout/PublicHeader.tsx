"use client";

import { usePathname } from "next/navigation";
import usePublicContact from "../../../src/features/settings/hooks/usePublicContact";

import Header from "./Header";
import type { HomeCopy, Language, SectionId, Theme } from "../../data/home";

type Props = {
  t: HomeCopy;
  language: Language;
  theme: Theme;
  menuOpen: boolean;
  activeSection: SectionId;
  navItems: { id: SectionId; label: string; href?: string }[];
  homeHref?: string;
  onLanguageChange: () => void;
  onThemeChange: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
};

export default function PublicHeader(props: Props) {
  const pathname = usePathname();
  const contact = usePublicContact();
  const isProgramDetails = /^\/programs\/[^/]+\/?$/.test(pathname ?? "");
  const actionHref = contact.whatsappHref || "#contact";
  const actionLabel = props.language === "ar" ? "استفسر عن البرنامج" : "Ask about this program";

  return (
    <Header {...props} showAction={isProgramDetails} actionHref={actionHref} actionLabel={actionLabel}
      actionExternal={isProgramDetails && actionHref.startsWith("https://")} />
  );
}
