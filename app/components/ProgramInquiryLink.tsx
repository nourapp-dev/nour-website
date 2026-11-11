"use client";
import { MessageCircle } from "lucide-react";
import usePublicContact from "../../src/features/settings/hooks/usePublicContact";
import { programInquiryHref } from "../../src/features/programs/utils/program-inquiry";
export default function ProgramInquiryLink({title, slug, language, className = "", disabled = false}: {title: string; slug: string; language: "ar" | "en"; className?: string; disabled?: boolean}) {
  const contact = usePublicContact();
  return <a className={`program-inquiry-link ${className}`} href={disabled ? "#program-card-preview" : programInquiryHref(contact.whatsappHref, title, slug, language)} target={disabled ? undefined : "_blank"} rel="noopener noreferrer" aria-disabled={disabled || undefined} onClick={disabled ? e => e.preventDefault() : undefined}><MessageCircle size={18} aria-hidden="true"/>{language === "ar" ? "استفسر عن البرنامج" : "Ask about this program"}
    <style jsx>{`.program-inquiry-link { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 16px; min-height:46px; border-radius:12px; background:#ffc313; color:#173557; text-decoration:none; font-size:13px; font-weight:800; line-height:1.6; } .program-inquiry-link:hover {background:#ffcf43} .program-inquiry-link:focus-visible{outline:3px solid #176fe8;outline-offset:3px}`}</style>
  </a>;
}
