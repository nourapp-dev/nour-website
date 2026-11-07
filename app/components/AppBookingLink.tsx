import {launchCopy} from '../../src/core/config/launch-state';
import type { PublicLanguage } from "../../src/core/i18n/public-language";

// Informational status: the app is not released. Never link or launch here.
export default function AppBookingLink({ language, className = "program-action" }: { language: PublicLanguage; className?: string }) {
  return <span className={className} role="status" style={{ cursor: "default" }}>
    {launchCopy[language].appTitle}
  </span>;
}
