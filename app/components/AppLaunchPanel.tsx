"use client";
import { launchCopy } from "../../src/core/config/launch-state";
import Image from "next/image";
import type { PublicLanguage } from "../../src/core/i18n/public-language";
import "./app-launch.css";

export default function AppLaunchPanel({
  language,
}: {
  language: PublicLanguage;
}) {
  const ar = language === "ar";
  return (
    <section
      className="nour-app-launch"
      dir={ar ? "rtl" : "ltr"}
      aria-labelledby="app-launch-title"
    >
      <div>
        <span className="nour-app-eyebrow">NOUR · نور آب</span>
        <h1 id="app-launch-title">{launchCopy[language].appTitle}</h1>
        <p>{launchCopy[language].appDescription}</p>
        <p role="status">
          {ar
            ? "يمكنك استعراض البرامج وتفاصيلها. الحجز والدفع عبر الموقع متوقفان."
            : "You can browse programs and their details. Website booking and payment are paused."}
        </p>
      </div>
      <aside className="nour-app-qr">
        <Image
          src="/images/brand/nour-stacked.svg"
          alt="Nour · نور آب"
          width={150}
          height={155}
        />
      </aside>
    </section>
  );
}
