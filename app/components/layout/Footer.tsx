"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import type {
  HomeCopy,
  Language,
} from "../../data/home";

import NewsletterSubscribeForm from "../../../src/features/subscribers/components/NewsletterSubscribeForm";
import { usePublicSettings } from "../../../src/features/settings/providers/PublicSettingsProvider";
import usePublicContact from "../../../src/features/settings/hooks/usePublicContact";
import { normalizePublicUrl } from "../../../src/features/settings/utils/public-contact";

type FooterProps = {
  t: HomeCopy;
  language: Language;
};

type SocialIcon = ComponentType<{
  size?: number;
  "aria-hidden"?: boolean;
}>;

type SocialLink = {
  key: string;
  label: string;
  url: string;
  icon: SocialIcon;
};

export default function Footer({
  language,
}: FooterProps) {
  const { getText } = usePublicSettings();
  const contact = usePublicContact();
  const isArabic = language === "ar";

  const platformName = getText(
    isArabic
      ? "general.platform_name"
      : "general.platform_name_en",
    isArabic ? "نور آب" : "NourApp",
  );

  const address = getText(
    isArabic
      ? "contact.address_ar"
      : "contact.address_en",
    isArabic
      ? "المملكة العربية السعودية"
      : "Saudi Arabia",
  );

  const displayedWebsite = contact.websiteHref
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const socialLinks: SocialLink[] = [
    {
      key: "facebook",
      label: "Facebook",
      url: getText("social.facebook_url", ""),
      icon: FaFacebookF,
    },
    {
      key: "instagram",
      label: "Instagram",
      url: getText("social.instagram_url", ""),
      icon: FaInstagram,
    },
    {
      key: "x",
      label: "X",
      url: getText("social.x_url", ""),
      icon: FaXTwitter,
    },
    {
      key: "youtube",
      label: "YouTube",
      url: getText("social.youtube_url", ""),
      icon: FaYoutube,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: getText("social.linkedin_url", ""),
      icon: FaLinkedinIn,
    },
    {
      key: "tiktok",
      label: "TikTok",
      url: getText("social.tiktok_url", ""),
      icon: FaTiktok,
    },
  ]
    .map((item) => ({
      ...item,
      url: normalizePublicUrl(item.url),
    }))
    .filter((item) => item.url.length > 0);

  return (
    <footer
      className="nr-footer nr-footer-premium"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="nr-newsletter nr-newsletter-premium">
        <div className="nr-container nr-newsletter-premium-shell">
          <div className="nr-newsletter-copy">
            <span className="nr-newsletter-kicker">
              {isArabic ? "ابقَ على اطلاع" : "Stay informed"}
            </span>

            <h2>
              {isArabic
                ? `كن أول من يعرف جديد ${platformName}`
                : `Be the first to know what's new at ${platformName}`}
            </h2>

            <p>
              {isArabic
                ? "برامج جديدة، تحديثات مهمة وعروض مختارة تصل إليك مباشرة."
                : "New programs, important updates, and selected offers delivered directly to you."}
            </p>

            <div className="nr-newsletter-trust">
              <ShieldCheck />
              <span>
                {isArabic
                  ? "اشتراك اختياري ويمكنك إلغاؤه في أي وقت."
                  : "Optional subscription. Unsubscribe at any time."}
              </span>
            </div>
          </div>

          <NewsletterSubscribeForm language={language} />
        </div>
      </section>

      <div className="nr-container nr-footer-content nr-footer-premium-content">
        <div className="nr-footer-brand">
          <div className="nr-footer-brand-head">
            <Image
              src="/images/site/v-logo.png"
              alt={platformName}
              width={130}
              height={110}
            />

            <div>
              <strong>{platformName}</strong>
              <p>
                {isArabic
                  ? "تجربة رقمية متكاملة تساعد المعتمر على التخطيط لرحلته ومتابعة تفاصيلها بوضوح وطمأنينة."
                  : "An integrated digital experience helping pilgrims plan and follow their Umrah journey with clarity and confidence."}
              </p>
            </div>
          </div>

          {socialLinks.length > 0 ? (
            <div
              className="nr-footer-social"
              aria-label={
                isArabic
                  ? "روابط التواصل الاجتماعي"
                  : "Social media links"
              }
            >
              {socialLinks.map((socialLink) => {
                const Icon = socialLink.icon;

                return (
                  <a
                    key={socialLink.key}
                    href={socialLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLink.label}
                    title={socialLink.label}
                  >
                    <Icon
                      size={17}
                      aria-hidden={true}
                    />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="nr-footer-column" id="contact" style={{ scrollMarginTop: 130 }}>
          <span className="nr-footer-column-title">
            {isArabic ? "تواصل معنا" : "Contact"}
          </span>

          <div className="nr-footer-contact">
            {contact.phone ? (
              <a href={contact.phoneHref} dir="ltr">
                <Phone />
                <span>{contact.phoneLabel}</span>
              </a>
            ) : null}

            {contact.email ? (
              <a href={`mailto:${contact.email}`} dir="ltr">
                <Mail />
                <span>{contact.email}</span>
              </a>
            ) : null}

            {contact.whatsappHref ? (
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                <span>
                  {isArabic
                    ? "تواصل عبر واتساب"
                    : "WhatsApp"}
                </span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="nr-footer-column">
          <span className="nr-footer-column-title">
            {isArabic ? "نور آب" : "NourApp"}
          </span>

          <div className="nr-footer-contact">
            {contact.websiteHref ? (
              <a
                href={contact.websiteHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe2 />
                <span dir="ltr">{displayedWebsite}</span>
              </a>
            ) : null}

            {address ? (
              <span className="nr-footer-contact-static">
                <MapPin />
                <span>{address}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="nr-footer-column">
          <span className="nr-footer-column-title">
            {isArabic ? "روابط مهمة" : "Important links"}
          </span>

          <div className="nr-footer-links">
            <Link href="/become-a-partner"><span>{isArabic ? "كن شريك نور" : "Partner with Nour"}</span><ExternalLink /></Link>
            <Link href="/join-us"><span>{isArabic ? "انضم إلى فريقنا" : "Join our team"}</span><ExternalLink /></Link>
            <a href="/privacy">
              <span>
                {isArabic
                  ? "سياسة الخصوصية"
                  : "Privacy Policy"}
              </span>
              <ExternalLink />
            </a>

            <a href="/terms">
              <span>
                {isArabic
                  ? "الشروط والأحكام"
                  : "Terms & Conditions"}
              </span>
              <ExternalLink />
            </a>
          </div>
        </div>
      </div>

      <div className="nr-container nr-footer-bottom">
        <span>
          © {new Date().getFullYear()} {platformName}.{" "}
          {isArabic
            ? "جميع الحقوق محفوظة."
            : "All rights reserved."}
        </span>

        <span className="nr-footer-bottom-note">
          {isArabic
            ? "صُمم لتجربة عمرة أوضح وأسهل."
            : "Designed for a clearer, easier Umrah journey."}
        </span>
      </div>
    </footer>
  );
}
