"use client";
import type { HomeCopy, Language } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./Presentation.module.css";
import DownloadOrnament from "./DownloadOrnament";
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
  if (!download.visible) return null;
  return (
    <div className={styles.root}>
      <section
        id="download-app"
        className={styles.download}
        dir={ar ? "rtl" : "ltr"}
      >
        <DownloadOrnament />
        <div className={styles.downloadInner}>
          <div>
            <h2>{ar ? "التطبيق قريبًا" : "App coming soon"}</h2>
            <p>{ar ? "تطبيق نور آب غير منشور حاليًا. سنعلن عن روابط التحميل بعد إطلاقه." : "The Nour app is not released yet. Download links will be announced after launch."}</p>
          </div>

        </div>
      </section>
    </div>
  );
}
