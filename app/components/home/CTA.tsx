"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { HomeCopy, Language } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./Presentation.module.css";
export default function CTA({
  language,
  presentation,
}: {
  t?: HomeCopy;
  language: Language;
  presentation?: Presentation;
}) {
  const { download } = usePresentation(presentation);
  const ar = language === "ar";
  const links = [
    { name: "App Store", url: download.appStore },
    { name: "Google Play", url: download.googlePlay },
    { name: "AppGallery", url: download.appGallery },
  ];
  const first = links.find((l) => l.url);
  const url = first?.url;
  const [qr, setQr] = useState<{ url: string; data: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (url)
      import("qrcode")
        .then((q) =>
          q.toDataURL(url, {
            width: 160,
            margin: 3,
            errorCorrectionLevel: "M",
          }),
        )
        .then((data) => {
          if (!cancelled) setQr({ url, data });
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (!download.visible) return null;
  return (
    <div className={styles.root}>
      <section
        id="download-app"
        className={styles.download}
        dir={ar ? "rtl" : "ltr"}
      >
        <div className={styles.downloadInner}>
          <div>
            <h2>{download.title[language]}</h2>
            <p>{download.description[language]}</p>
            <div className={styles.stores}>
              {links.map((link) =>
                link.url ? (
                  <a
                    className={styles.store}
                    href={link.url}
                    key={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <small>{ar ? "حمّل من" : "Download on"}</small>
                    <strong>{link.name}</strong>
                  </a>
                ) : (
                  <span
                    className={`${styles.store} ${styles.storeDisabled}`}
                    key={link.name}
                  >
                    <small>{ar ? "قريبًا على" : "Coming soon on"}</small>
                    <strong>{link.name}</strong>
                  </span>
                ),
              )}
            </div>
          </div>
          {first && qr && qr.url === url && (
            <a
              className={styles.qr}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={qr.data}
                alt={
                  ar
                    ? `رمز تحميل التطبيق من ${first.name}`
                    : `Download on ${first.name}`
                }
                width={160}
                height={160}
                unoptimized
              />
              <span>
                {ar ? "امسح للتحميل من" : "Scan to open"} {first.name}
              </span>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
