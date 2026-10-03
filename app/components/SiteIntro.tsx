"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type SiteIntroProps = {
  language: "ar" | "en";
};

type LogoTarget = {
  x: number;
  y: number;
  scale: number;
};

export default function SiteIntro({ language }: SiteIntroProps) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [handoff, setHandoff] = useState(false);
  const [logoTarget, setLogoTarget] = useState<LogoTarget>({ x: 0, y: -66, scale: 0.72 });
  const logoShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const measureLogoTarget = () => {
      const source = logoShellRef.current;
      const target = document.querySelector<HTMLElement>(".nr-v2-logo img");

      if (!source || !target) return;

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      setLogoTarget({
        x: targetCenterX - sourceCenterX,
        y: targetCenterY - sourceCenterY,
        scale: Math.max(0.24, Math.min(0.72, targetRect.width / sourceRect.width)),
      });
    };

    const handoffTimer = window.setTimeout(() => {
      measureLogoTarget();
      window.requestAnimationFrame(() => setHandoff(true));
    }, reduceMotion ? 120 : 1180);

    const closeTimer = window.setTimeout(
      () => setVisible(false),
      reduceMotion ? 280 : 1910,
    );

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(handoffTimer);
      window.clearTimeout(closeTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!visible) document.body.style.overflow = "";
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="nr-site-intro"
          role="status"
          aria-label={language === "ar" ? "جاري فتح نور آب" : "Opening NourApp"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
        >
          <motion.div
            className="nr-site-intro-backdrop"
            aria-hidden="true"
            initial={{ opacity: 1 }}
            animate={handoff ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.66, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.div
            className="nr-site-intro-aura nr-site-intro-aura-one"
            aria-hidden="true"
            initial={{ scale: 0.72, opacity: 0 }}
            animate={handoff ? { scale: 1.16, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="nr-site-intro-aura nr-site-intro-aura-two"
            aria-hidden="true"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={handoff ? { scale: 1.18, opacity: 0 } : { scale: 1.05, opacity: 1 }}
            transition={{ duration: 1.05, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          />

          <motion.div
            className="nr-site-intro-content"
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              ref={logoShellRef}
              className="nr-site-intro-logo-shell"
              initial={reduceMotion ? false : { rotate: -5, scale: 0.88 }}
              animate={
                handoff
                  ? {
                      x: logoTarget.x,
                      y: logoTarget.y,
                      scale: logoTarget.scale,
                      rotate: 0,
                      borderRadius: 12,
                      boxShadow: "0 10px 28px rgba(0, 32, 95, .18)",
                    }
                  : { x: 0, y: 0, scale: 1, rotate: 0, borderRadius: 28 }
              }
              transition={
                handoff
                  ? { duration: 0.68, ease: [0.16, 1, 0.3, 1] }
                  : { type: "spring", stiffness: 100, damping: 14 }
              }
            >
              <Image
                src="/images/site/v-logo.png"
                alt="NourApp"
                width={176}
                height={92}
                priority
                className="nr-site-intro-logo"
              />
            </motion.div>

            <motion.div
              className="nr-site-intro-line"
              aria-hidden="true"
              initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={handoff ? { scaleX: 0.2, opacity: 0, y: -8 } : { scaleX: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: handoff ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <span />
            </motion.div>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={handoff ? { opacity: 0, y: -14, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.36, delay: handoff ? 0 : 0.42 }}
            >
              {language === "ar" ? "رفيقك لرحلة السعادة" : "Your companion for a joyful journey"}
            </motion.p>
          </motion.div>

          <style jsx global>{`
            .nr-site-intro {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: grid;
              place-items: center;
              overflow: hidden;
              color: #ffffff;
              pointer-events: none;
            }

            .nr-site-intro-backdrop {
              position: absolute;
              inset: 0;
              z-index: 0;
              background:
                radial-gradient(circle at 50% 45%, rgba(49, 158, 255, 0.34), transparent 34%),
                linear-gradient(145deg, #063f97 0%, #0a66d9 48%, #1e9ae9 100%);
            }

            .nr-site-intro-backdrop::before {
              content: "";
              position: absolute;
              inset: 0;
              opacity: 0.14;
              background-image:
                linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
              background-size: 58px 58px;
              mask-image: radial-gradient(circle at center, #000 20%, transparent 78%);
            }

            .nr-site-intro-aura {
              position: absolute;
              z-index: 1;
              border-radius: 50%;
              filter: blur(8px);
              pointer-events: none;
            }

            .nr-site-intro-aura-one {
              width: min(62vw, 760px);
              aspect-ratio: 1;
              inset-inline-start: -18vw;
              top: -28vw;
              background: rgba(65, 228, 255, 0.2);
            }

            .nr-site-intro-aura-two {
              width: min(54vw, 660px);
              aspect-ratio: 1;
              inset-inline-end: -20vw;
              bottom: -32vw;
              background: rgba(255, 195, 19, 0.16);
            }

            .nr-site-intro-content {
              position: relative;
              z-index: 2;
              width: min(92vw, 520px);
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }

            .nr-site-intro-logo-shell {
              position: relative;
              display: grid;
              place-items: center;
              padding: 22px 28px;
              border: 1px solid rgba(255,255,255,.22);
              background: rgba(255,255,255,.98);
              box-shadow: 0 28px 80px rgba(0,32,95,.26), 0 0 46px rgba(255,255,255,.12);
              backdrop-filter: blur(18px);
              transform-origin: center;
              will-change: transform;
            }

            .nr-site-intro-logo-shell::after {
              content: "";
              position: absolute;
              inset: -18px;
              z-index: -1;
              border: 1px solid rgba(255,255,255,.12);
              border-radius: 38px;
              opacity: 0.72;
            }

            .nr-site-intro-logo {
              display: block;
              width: 176px;
              height: auto;
              object-fit: contain;
            }

            .nr-site-intro-line {
              position: relative;
              width: min(280px, 64vw);
              height: 1px;
              margin: 30px 0 18px;
              transform-origin: center;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
            }

            .nr-site-intro-line span {
              position: absolute;
              left: 50%;
              top: 50%;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #ffc313;
              box-shadow: 0 0 18px rgba(255,195,19,.85);
              transform: translate(-50%, -50%);
            }

            .nr-site-intro p {
              margin: 0;
              color: rgba(255,255,255,.92);
              font-size: clamp(16px, 2vw, 21px);
              font-weight: 700;
            }

            @media (max-width: 580px) {
              .nr-site-intro-logo-shell {
                padding: 18px 22px;
              }
              .nr-site-intro-logo { width: 138px; }
              .nr-site-intro-line { margin-top: 24px; }
            }

            @media (prefers-reduced-motion: reduce) {
              .nr-site-intro *,
              .nr-site-intro *::before,
              .nr-site-intro *::after {
                animation: none !important;
                transition: none !important;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
