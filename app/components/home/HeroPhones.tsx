"use client";

import ProgramSearch from "./ProgramSearch";
import HeroBackground from "./HeroBackground";
import HeroOrbit from "./HeroOrbit";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { HomeCopy } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";

type Props = { t: HomeCopy; hero: Presentation["hero"] };

const fadeItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};


export default function HeroPhones({ t, hero }: Props) {
  const reduceMotion = useReducedMotion();
  const isArabic = t.lang === "English";
  const language = isArabic ? "ar" : "en";

  return (
    <section className="nr-premium-hero" id="home" dir={isArabic ? "rtl" : "ltr"}>
      <HeroBackground />
      <div className="nr-container nr-premium-hero-grid">
        <motion.div
          className="nr-premium-copy"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
          }}
        >
          <motion.span className="nr-premium-kicker" variants={fadeItem}>
            {hero.eyebrow[language]}
          </motion.span>

          <motion.h1
            initial={reduceMotion ? false : {
              opacity: 0,
              x: isArabic ? 120 : -120,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.78,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {hero.title[language]}
          </motion.h1>

          <motion.p variants={fadeItem}>
            {hero.description[language]}
          </motion.p>

          <motion.div className="nr-premium-service-line" variants={fadeItem}>
            <span>{isArabic ? "برامج عمرة" : "Umrah programs"}</span>
            <i />
            <span>{isArabic ? "سكن" : "Hotels"}</span>
            <i />
            <span>{isArabic ? "نقل" : "Transport"}</span>
            <i />
            <span>{isArabic ? "إرشاد" : "Guidance"}</span>
            <i />
            <span>{isArabic ? "متابعة الرحلة" : "Journey tracking"}</span>
          </motion.div>

          <ProgramSearch language={isArabic ? "ar" : "en"} />
          {hero.href && hero.button[language] && <a className="nr-hero-how-link" href={hero.href}>{hero.button[language]}</a>}

          <motion.div className="nr-premium-trust" variants={fadeItem}>
            <div>
              <strong>{isArabic ? "خدمات متكاملة" : "Integrated services"}</strong>
              <small>{isArabic ? "من البرنامج إلى المتابعة" : "From program to follow-up"}</small>
            </div>
            <span className="nr-premium-trust-divider" />
            <div>
              <strong>{isArabic ? "تواصل معنا" : "Contact us"}</strong>
              <small>{isArabic ? "دعم ومتابعة" : "Support & follow-up"}</small>
            </div>
            <span className="nr-premium-trust-divider" />
            <div>
              <strong>{isArabic ? "تفاصيل واضحة" : "Clear information"}</strong>
              <small>{isArabic ? "لتخطيط رحلتك" : "Plan your journey"}</small>
            </div>
            <span className="nr-premium-trust-divider" />
            <div>
              <strong>{isArabic ? "تكلفة مرنة" : "Flexible pricing"}</strong>
              <small>{isArabic ? "خيارات تناسب ميزانيتك" : "Options for your budget"}</small>
            </div>
          </motion.div>
        </motion.div>

        <HeroOrbit hero={hero} language={language} />
      </div>
      <style jsx global>{`
        .nr-hero-how-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 8px; color: #fff; font-size: 14px; font-weight: 700; text-decoration: underline; text-underline-offset: 5px; }
        .nr-hero-how-link:focus-visible { outline: 3px solid #ffc313; outline-offset: 4px; border-radius: 4px; }

        .nr-premium-hero {
          position: relative;
          min-height: 770px;
          display: flex;
          align-items: center;
          overflow: hidden;
          isolation: isolate;
          color: #fff;
          background: #0a294b;
        }

        .nr-premium-hero-grid {
          position: relative;
          z-index: 2;
          width: min(1380px, calc(100% - 32px));
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(390px, .7fr);
          align-items: center;
          gap: 34px;
          padding-block: 48px 68px;
        }

        .nr-premium-copy {
          max-width: 1040px;
          align-self: start;
          padding-top: 18px;
        }

        .nr-premium-kicker {
          width: fit-content;
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding-inline: 15px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          background: rgba(255,255,255,.1);
          font-size: 13px;
          font-weight: 900;
          backdrop-filter: blur(14px);
        }

        .nr-premium-kicker svg {
          width: 17px;
          height: 17px;
          color: #ffc313;
        }

        .nr-premium-copy h1 {
          max-width: 1040px;
          margin: 18px 0 16px;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 900;
          line-height: 1.22;
          letter-spacing: 0;
          overflow: visible;
        }

        .nr-premium-hero[dir="rtl"] .nr-premium-copy h1 {
          letter-spacing: 0;
          word-spacing: 0.025em;
          text-align: right;
        }

        .nr-premium-hero[dir="rtl"] .nr-premium-title-line {
          text-wrap: pretty;
        }

        .nr-premium-title-line {
          display: block;
          width: 100%;
          padding-block: 0.12em;
          line-height: 1.27;
          text-wrap: balance;
          overflow: visible;
        }

        .nr-premium-title-line + .nr-premium-title-line {
          margin-top: 0.25em;
        }

        .nr-premium-title-line-main {
          color: #fff;
        }

        .nr-premium-title-line-accent {
          color: #ffc313;
          text-shadow: 0 12px 30px rgba(255,195,19,.18);
        }

        .nr-premium-copy > p {
          max-width: 860px;
          margin: 0;
          color: rgba(255,255,255,.82);
          font-size: 18px;
          line-height: 1.9;
        }

        .nr-premium-service-line {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
          color: rgba(255,255,255,.88);
          font-size: 12px;
          font-weight: 800;
        }

        .nr-premium-service-line i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ffc313;
          box-shadow: 0 0 12px rgba(255,195,19,.55);
        }

        .nr-premium-trust {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 17px;
          margin-top: 34px;
          color: rgba(255,255,255,.9);
        }

        .nr-premium-trust > div {
          min-width: 92px;
        }

        .nr-premium-trust strong,
        .nr-premium-trust small {
          display: block;
        }

        .nr-premium-trust strong {
          font-size: 14px;
        }

        .nr-premium-trust small {
          margin-top: 3px;
          color: rgba(255,255,255,.65);
          font-size: 10px;
        }

        .nr-premium-trust-divider {
          width: 1px;
          height: 34px;
          background: rgba(255,255,255,.22);
        }

        @container (max-width: 1020px) {
          .nr-premium-hero {
            min-height: auto;
          }

          .nr-premium-hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
            padding-block: 54px 56px;
          }
        }

        @container (max-width: 768px) {


  .nr-premium-hero {
    min-height: auto !important;
    overflow: hidden !important;
  }

  .nr-premium-hero-grid {
    width: calc(100% - 24px) !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 8px !important;
    padding: 24px 0 18px !important;
  }

  .nr-premium-copy {
    width: 100% !important;
    max-width: none !important;
    text-align: center !important;
  }

  .nr-premium-kicker {
    margin-inline: auto !important;
  }

  .nr-premium-copy h1 {
    max-width: 100% !important;
    margin: 17px auto 13px !important;
    font-size: clamp(29px, 8.4vw, 38px) !important;
    line-height: 1.18 !important;
    letter-spacing: 0 !important;
    text-wrap: balance;
  }

  .nr-premium-title-line {
    line-height: 1.24 !important;
    padding-block: .09em !important;
  }

  .nr-premium-title-line + .nr-premium-title-line {
    margin-top: 0.25em !important;
  }

  .nr-premium-copy > p {
    max-width: 520px !important;
    margin-inline: auto !important;
    font-size: 13px !important;
    line-height: 1.7 !important;
  }

  .nr-premium-service-line {
    justify-content: center !important;
    gap: 8px !important;
    margin-top: 16px !important;
    font-size: 10px !important;
  }

  .nr-premium-trust {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px 6px !important;
    margin-top: 19px !important;
    text-align: center !important;
  }

  .nr-premium-trust-divider {
    display: none !important;
  }

  .nr-premium-trust > div {
    min-width: 0 !important;
    padding: 9px 5px !important;
    border: 1px solid rgba(255,255,255,.14) !important;
    border-radius: 12px !important;
    background: rgba(255,255,255,.07) !important;
  }

  .nr-premium-trust strong {
    font-size: 13px !important;
    line-height: 1.5 !important;
  }

  .nr-premium-trust small {
    font-size: 11px !important;
    line-height: 1.5 !important;
  }

}
       @container (max-width: 390px) {
  .nr-premium-copy h1 {
    font-size: 27px !important;
  }

  .nr-premium-title-line {
    line-height: 1.26 !important;
  }
}

        @media (prefers-reduced-motion: reduce) {
        }

      `}</style>
    </section>
  );
}

