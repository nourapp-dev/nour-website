"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
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
import styles from "./Footer.module.css";
import BusinessVerificationSeal from "./BusinessVerificationSeal";

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

      <div className={styles.shell}>
        <div className={styles.main}>
          <div className={styles.brand}>
            <div className={styles.brandHead}>
              <Image
                className={styles.logo}
                src="/images/site/v-logo.png"
                alt={platformName}
                width={78}
                height={78}
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
                className={styles.social}
                aria-label={isArabic ? "روابط التواصل الاجتماعي" : "Social media links"}
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
                    >
                      <Icon size={17} aria-hidden={true} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          <section className={styles.column} id="contact" aria-labelledby="footer-contact-title">
            <h2 className={styles.heading} id="footer-contact-title">
              {isArabic ? "تواصل معنا" : "Contact us"}
            </h2>
            <div className={styles.contact}>
              {contact.phone ? (
                <a href={contact.phoneHref}>
                  <Phone aria-hidden="true" />
                  <bdi dir="ltr">{contact.phoneLabel}</bdi>
                </a>
              ) : null}
              {contact.email ? (
                <a href={`mailto:${contact.email}`}>
                  <Mail aria-hidden="true" />
                  <bdi dir="ltr">{contact.email}</bdi>
                </a>
              ) : null}
              {contact.whatsappHref ? (
                <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  <span>{isArabic ? "تواصل عبر واتساب" : "WhatsApp"}</span>
                </a>
              ) : null}
              {contact.websiteHref ? (
                <a href={contact.websiteHref} target="_blank" rel="noopener noreferrer">
                  <Globe2 aria-hidden="true" />
                  <bdi dir="ltr">{displayedWebsite}</bdi>
                </a>
              ) : null}
              {address ? (
                <div className={styles.contactItem}>
                  <MapPin aria-hidden="true" />
                  <span>{address}</span>
                </div>
              ) : null}
            </div>
          </section>

          <nav className={styles.column} aria-labelledby="footer-links-title">
            <h2 className={styles.heading} id="footer-links-title">
              {isArabic ? "روابط مهمة" : "Useful links"}
            </h2>
            <div className={styles.links}>
              <Link href="/become-a-partner">{isArabic ? "كن شريك نور" : "Partner with Nour"}</Link>
              <Link href="/join-us">{isArabic ? "انضم إلى فريقنا" : "Join our team"}</Link>
              <Link href="/privacy">{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
              <Link href="/terms">{isArabic ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
              <a href="#official-documents">{isArabic ? "التراخيص والتوثيق" : "Registration & verification"}</a>
            </div>
          </nav>
        </div>

        <section className={styles.documents} id="official-documents" aria-labelledby="footer-documents-title">
          <div className={styles.documentsHead}>
            <div>
              <h2 className={styles.heading} id="footer-documents-title">
                {isArabic ? "التراخيص والتوثيق" : "Registration & verification"}
              </h2>
              <p>
                {isArabic
                  ? "شركة كود لاند لتقنية المعلومات"
                  : "Code Land Company for Information Technology"}
              </p>
            </div>
          </div>

          <div className={styles.documentGrid}>
            <div className={styles.documentCard}>
              <div className={styles.documentHeading}>
                <span className={styles.documentIcon}><Building2 aria-hidden="true" /></span>
                <span className={styles.documentCopy}>
                  <strong>{isArabic ? "السجل التجاري" : "Commercial registration"}</strong>
                  <span>{isArabic ? "الرقم الوطني الموحد" : "Unified national number"}</span>
                  <bdi dir="ltr">7039728899</bdi>
                </span>
              </div>
              <a
                className={styles.registrationSeal}
                href="https://mc.gov.sa/ar/eservices/Pages/Commercial-data.aspx?CRNumber=7039728899"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.issuerBadge}>
                  <Image
                    src="/images/verification/ministry-of-commerce.png"
                    width={145}
                    height={64}
                    alt={isArabic ? "وزارة التجارة" : "Ministry of Commerce"}
                    unoptimized
                  />
                </span>
                <span>{isArabic ? "التحقق من السجل التجاري" : "Check commercial registration"}</span>
              </a>
            </div>
            <div className={styles.documentCard}>
              <div className={styles.documentHeading}>
                <span className={styles.documentIcon}><ReceiptText aria-hidden="true" /></span>
                <span className={styles.documentCopy}>
                  <strong>{isArabic ? "شهادة ضريبة القيمة المضافة" : "VAT registration certificate"}</strong>
                  <span>{isArabic ? "رقم التسجيل الضريبي" : "VAT registration number"}</span>
                  <bdi dir="ltr">315049714300003</bdi>
                </span>
              </div>
              <a
                className={styles.registrationSeal}
                href="https://zatca.gov.sa/ar/eServices/Pages/TaxpayerLookup.aspx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.issuerBadge}>
                  <Image
                    src="/images/verification/zatca.svg"
                    width={190}
                    height={43}
                    alt={isArabic ? "هيئة الزكاة والضريبة والجمارك" : "Zakat, Tax and Customs Authority"}
                    unoptimized
                  />
                </span>
                <span>{isArabic ? "التحقق من التسجيل الضريبي" : "Check VAT registration"}</span>
              </a>
            </div>
            <div className={`${styles.documentCard} ${styles.verificationCard}`}>
              <div className={styles.documentHeading}>
                <span className={styles.documentIcon}><ShieldCheck aria-hidden="true" /></span>
                <span className={styles.documentCopy}>
                  <strong>{isArabic ? "توثيق التجارة الإلكترونية" : "E-commerce verification"}</strong>
                  <span>{isArabic ? "المركز السعودي للأعمال" : "Saudi Business Center"}</span>
                </span>
              </div>
              <BusinessVerificationSeal key={language} language={language} className={styles.verificationSeal} />
            </div>
          </div>
        </section>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} {platformName}.{" "}
            {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </span>
          <span>
            {isArabic
              ? "صُمم لتجربة عمرة أوضح وأسهل."
              : "Designed for a clearer, easier Umrah journey."}
          </span>
        </div>
      </div>
    </footer>
  );
}
