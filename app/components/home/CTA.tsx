import Image from "next/image";
import { motion } from "framer-motion";
import type { HomeCopy, Language } from "../../data/home";
import AppStoreBadge from "../shared/AppStoreBadge";

type Props = {
  t: HomeCopy;
  language: Language;
};

export default function CTA({ t, language }: Props) {
  const isArabic = language === "ar";

  return (
    <section
      className="nr-cta-premium"
      id="download-app"
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="nr-cta-title"
    >
      <div className="nr-cta-pattern" aria-hidden="true" />
      <div className="nr-cta-glow nr-cta-glow-blue" aria-hidden="true" />
      <div className="nr-cta-glow nr-cta-glow-gold" aria-hidden="true" />

      <div className="nr-container">
        <motion.div
          className="nr-cta-premium-card"
          initial={{ opacity: 0, y: 34, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{
            duration: 0.72,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="nr-cta-copy">
            <span className="nr-cta-kicker">
              {isArabic ? "رحلتك تبدأ من هنا" : "Your journey starts here"}
            </span>

            <h2 id="nr-cta-title">
              {isArabic
                ? "ابدأ رحلتك إلى مكة بكل طمأنينة"
                : "Begin your journey to Makkah with confidence"}
            </h2>
            <p>
              {isArabic
                ? "كل تفاصيل رحلتك في تجربة واحدة، من اختيار البرنامج حتى متابعة رحلتك بكل وضوح وطمأنينة."
                : "Everything about your journey in one experience, from choosing your program to following every step with clarity and confidence."}
            </p>

            <div className="nr-cta-points" aria-label={isArabic ? "مزايا التطبيق" : "App benefits"}>
              <span>
                <CheckIcon />
                {isArabic ? "برامج واضحة" : "Clear programs"}
              </span>

              <span>
                <CheckIcon />
                {isArabic ? "دفع آمن" : "Secure payment"}
              </span>

              <span>
                <CheckIcon />
                {isArabic ? "متابعة أسهل" : "Easier journey tracking"}
              </span>
            </div>

            <div className="nr-store-buttons nr-cta-store-buttons">
              <AppStoreBadge language={language} />

              <span
                className="nr-store-badge is-disabled nr-store-coming-soon"
                aria-label="Google Play"
              >
                <Image
                  src="/stores/google-play-badge.jpg"
                  alt="Google Play"
                  width={176}
                  height={52}
                />
 
              </span>

              <span
                className="nr-store-badge is-disabled nr-store-coming-soon"
                aria-label="AppGallery"
              >
                <Image
                  src="/stores/appgallery-badge.jpg"
                  alt="AppGallery"
                  width={180}
                  height={52}
                />
 
              </span>
            </div>

            <div className="nr-cta-note">
              <ShieldIcon />
              <span>
                {isArabic
                  ? "تجربة رقمية مصممة لتجعل تفاصيل رحلة العمرة أوضح وأسهل."
                  : "A digital experience designed to make every part of your Umrah journey clearer and easier."}
              </span>
            </div>
          </div>

          <div className="nr-cta-visual">
            <div className="nr-cta-phone-glow" aria-hidden="true" />
            <div className="nr-cta-visual-ring" aria-hidden="true" />

            <motion.div
              className="nr-cta-phone-wrap"
              initial={{
                opacity: 0,
                y: 30,
                rotate: isArabic ? -2 : 2,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
                rotate: 0,
              }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.78,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Image
                src="/images/site/front-view.png"
                alt="NourApp app"
                width={300}
                height={540}
                className="nr-cta-phone-image"
              />
            </motion.div>

            <div className="nr-cta-mini-card nr-cta-mini-card-top">
              <span>{isArabic ? "كل رحلتك" : "Your journey"}</span>
              <strong>{isArabic ? "في مكان واحد" : "In one place"}</strong>
            </div>

            <div className="nr-cta-mini-card nr-cta-mini-card-bottom">
              <span>{isArabic ? "دعم ومتابعة" : "Support & tracking"}</span>
              <strong>{isArabic ? "بخطوات أوضح" : "Made clearer"}</strong>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .nr-cta-premium {
          position: relative;
          overflow: hidden;
          padding: 96px 0 110px;
          background:
            radial-gradient(
              circle at 12% 18%,
              rgba(23, 111, 232, 0.14),
              transparent 24%
            ),
            radial-gradient(
              circle at 90% 78%,
              rgba(255, 195, 19, 0.12),
              transparent 22%
            ),
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--nr-bg) 96%, #eef6ff),
              color-mix(in srgb, var(--nr-soft) 84%, #ffffff)
            );
          scroll-margin-top: 105px;
        }

        .nr-cta-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            radial-gradient(
              circle at center,
              rgba(23, 111, 232, 0.12) 1px,
              transparent 1.2px
            );
          background-size: 30px 30px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            #000 14%,
            #000 86%,
            transparent
          );
        }

        .nr-cta-glow {
          position: absolute;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(30px);
        }

        .nr-cta-glow-blue {
          inset-inline-start: -200px;
          top: -180px;
          background: rgba(23, 111, 232, 0.16);
        }

        .nr-cta-glow-gold {
          inset-inline-end: -190px;
          bottom: -190px;
          background: rgba(255, 195, 19, 0.14);
        }

        .nr-cta-premium-card {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          align-items: center;
          gap: clamp(38px, 5vw, 74px);
          min-height: 560px;
          overflow: hidden;
          padding: clamp(34px, 5vw, 66px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 36px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 82% 18%,
              rgba(42, 169, 233, 0.16),
              transparent 25%
            ),
            radial-gradient(
              circle at 14% 82%,
              rgba(255, 195, 19, 0.08),
              transparent 22%
            ),
            linear-gradient(135deg, #071a31 0%, #0a2c53 52%, #0c3b6b 100%);
          box-shadow:
            0 32px 90px rgba(7, 28, 54, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .nr-cta-premium-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.04) 1px,
              transparent 1px
            );
          background-size: 54px 54px;
        }

        .nr-cta-copy {
          position: relative;
          z-index: 3;
          max-width: 680px;
        }

        .nr-cta-kicker {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          padding-inline: 14px;
          border: 1px solid rgba(255, 195, 19, 0.24);
          border-radius: 999px;
          color: #ffd761;
          background: rgba(255, 195, 19, 0.08);
          font-size: 10px;
          font-weight: 900;
          backdrop-filter: blur(12px);
        }

        .nr-cta-copy h2 {
          max-width: 720px;
          margin: 18px 0 15px;
          color: #ffffff;
          font-size: clamp(40px, 4.8vw, 62px);
          line-height: 1.08;
          letter-spacing: -0.025em;
          text-wrap: balance;
        }

        .nr-cta-copy > p {
          max-width: 640px;
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
          line-height: 1.82;
        }

        .nr-cta-points {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 22px;
        }

        .nr-cta-points span {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          gap: 6px;
          padding-inline: 11px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.045);
          font-size: 9px;
          font-weight: 800;
        }

        .nr-cta-points svg {
          width: 14px;
          height: 14px;
          color: #8bf0c7;
        }

        .nr-cta-store-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }

        .nr-cta-store-buttons .nr-store-badge,
        .nr-cta-store-buttons a {
          position: relative;
          min-height: 52px;
          display: inline-flex;
          align-items: center;
          border-radius: 13px;
          overflow: hidden;
        }

        .nr-cta-store-buttons img {
          display: block;
          width: auto;
          height: 52px;
          object-fit: contain;
        }

        .nr-store-coming-soon {
          opacity: 0.68;
          filter: grayscale(0.08);
        }


        .nr-cta-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 590px;
          margin-top: 18px;
          color: rgba(255, 255, 255, 0.58);
          font-size: 9px;
          line-height: 1.55;
        }

        .nr-cta-note svg {
          width: 15px;
          height: 15px;
          flex: 0 0 auto;
          margin-top: 1px;
          color: #79b8ff;
        }

        .nr-cta-visual {
          position: relative;
          z-index: 3;
          min-height: 470px;
          display: grid;
          place-items: center;
        }

        .nr-cta-phone-glow {
          position: absolute;
          width: 340px;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(23, 111, 232, 0.25),
              rgba(42, 169, 233, 0.1) 45%,
              transparent 72%
            );
          filter: blur(2px);
        }

        .nr-cta-visual-ring {
          position: absolute;
          width: 360px;
          aspect-ratio: 1;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          box-shadow:
            inset 0 0 0 16px rgba(255, 255, 255, 0.015),
            0 0 90px rgba(23, 111, 232, 0.1);
        }

        .nr-cta-phone-wrap {
          position: relative;
          z-index: 3;
        }

        .nr-cta-phone-image {
          width: auto;
          height: min(510px, 48vw);
          max-height: 510px;
          object-fit: contain;
          filter:
            drop-shadow(0 28px 42px rgba(0, 0, 0, 0.26))
            drop-shadow(0 8px 18px rgba(0, 0, 0, 0.18));
        }

        .nr-cta-mini-card {
          position: absolute;
          z-index: 5;
          min-width: 142px;
          display: grid;
          gap: 3px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 15px;
          background: rgba(8, 33, 61, 0.74);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(15px);
        }

        .nr-cta-mini-card span {
          color: rgba(255, 255, 255, 0.48);
          font-size: 8px;
        }

        .nr-cta-mini-card strong {
          color: #ffffff;
          font-size: 11px;
        }

        .nr-cta-mini-card-top {
          top: 86px;
          inset-inline-start: 4px;
        }

        .nr-cta-mini-card-bottom {
          inset-inline-end: 2px;
          bottom: 82px;
        }

        html[data-theme="dark"] .nr-cta-premium {
          background:
            radial-gradient(
              circle at 12% 18%,
              rgba(23, 111, 232, 0.16),
              transparent 24%
            ),
            radial-gradient(
              circle at 90% 78%,
              rgba(255, 195, 19, 0.08),
              transparent 22%
            ),
            linear-gradient(180deg, #07182c, #0a213d);
        }

        @media (max-width: 980px) {
          .nr-cta-premium-card {
            grid-template-columns: 1fr;
            gap: 34px;
            padding: 42px;
          }

          .nr-cta-copy {
            max-width: 760px;
            margin-inline: auto;
            text-align: center;
          }

          .nr-cta-copy h2,
          .nr-cta-copy > p,
          .nr-cta-note {
            margin-inline: auto;
          }

          .nr-cta-points,
          .nr-cta-store-buttons {
            justify-content: center;
          }

          .nr-cta-visual {
            min-height: 430px;
          }

          .nr-cta-phone-image {
            height: 430px;
          }
        }

        @media (max-width: 620px) {
          .nr-cta-premium {
            padding: 68px 0 76px;
          }

          .nr-cta-premium-card {
            min-height: 0;
            padding: 27px 20px 24px;
            border-radius: 26px;
          }

          .nr-cta-copy h2 {
            font-size: clamp(32px, 9.6vw, 42px);
          }

          .nr-cta-copy > p {
            font-size: 14px;
          }

          .nr-cta-points {
            gap: 6px;
          }

          .nr-cta-points span {
            min-height: 31px;
            padding-inline: 9px;
            font-size: 8px;
          }

          .nr-cta-store-buttons {
            gap: 8px;
          }

          .nr-cta-store-buttons .nr-store-badge,
          .nr-cta-store-buttons a,
          .nr-cta-store-buttons img {
            height: 46px;
            min-height: 46px;
          }

          .nr-cta-visual {
            min-height: 350px;
          }

          .nr-cta-phone-image {
            height: 350px;
          }

          .nr-cta-phone-glow,
          .nr-cta-visual-ring {
            width: min(300px, 88vw);
          }

          .nr-cta-mini-card {
            min-width: 118px;
            padding: 10px 11px;
          }

          .nr-cta-mini-card-top {
            top: 65px;
          }

          .nr-cta-mini-card-bottom {
            bottom: 58px;
          }
        }

        @media (max-width: 420px) {
          .nr-cta-copy h2 {
            font-size: clamp(30px, 9vw, 37px);
          }

          .nr-cta-store-buttons {
            display: grid;
            grid-template-columns: 1fr;
          }

          .nr-cta-store-buttons .nr-store-badge,
          .nr-cta-store-buttons a {
            width: 100%;
            justify-content: center;
          }

          .nr-cta-visual {
            min-height: 320px;
          }

          .nr-cta-phone-image {
            height: 320px;
          }

          .nr-cta-mini-card {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-cta-premium-card,
          .nr-cta-phone-wrap {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden="true"
    >
      <path
        d="m12 3 7 3v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}