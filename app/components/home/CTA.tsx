"use client";
import {launchCopy} from '../../../src/core/config/launch-state';
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
            <h2>{launchCopy[language].appTitle}</h2>
            <p>{launchCopy[language].appDescription}</p>
          </div>

        </div>
      </section>
    </div>
  );
}
