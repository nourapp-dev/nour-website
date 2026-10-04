"use client";

import { useEffect, useRef, useState } from "react";

const verificationOrigin = "https://eauthenticate.saudibusiness.gov.sa";
const verificationToken = "MndqZ0VDeWVNZ1FTUFdyZnZBVlJhQT09";

type Props = {
  language: "ar" | "en";
  className?: string;
};

export default function BusinessVerificationSeal({ language, className }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ width: 180, height: 56 });
  // This is the same official frame loaded by the SBC seal.js embed.
  // Rendering it with React also handles return visits and language changes.
  const src = `${verificationOrigin}/EAuthSealApi/seal?token=${verificationToken}&lang=${language}&pos=top`;

  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (
        event.origin !== verificationOrigin ||
        event.source !== frameRef.current?.contentWindow ||
        !event.data ||
        event.data.sbcSeal !== true
      ) return;

      const { width, height } = event.data;
      if (
        typeof width !== "number" || !Number.isFinite(width) || width <= 0 ||
        typeof height !== "number" || !Number.isFinite(height) || height <= 0
      ) return;

      setSize({
        width: Math.max(120, Math.min(400, Math.ceil(width))),
        height: Math.max(44, Math.min(720, Math.ceil(height))),
      });
    };

    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, []);

  return (
    <div className={className}>
      <iframe
        ref={frameRef}
        src={src}
        title={language === "ar" ? "ختم التوثيق الرسمي للمركز السعودي للأعمال" : "Official Saudi Business Center verification seal"}
        width={size.width}
        height={size.height}
        loading="eager"
        scrolling="no"
        style={{ border: 0, flexShrink: 0, maxWidth: "calc(100vw - 32px)" }}
      />
      <a href={src} target="_blank" rel="noopener noreferrer">
        {language === "ar" ? "فتح التحقق الرسمي" : "Open official verification"}
      </a>
    </div>
  );
}
