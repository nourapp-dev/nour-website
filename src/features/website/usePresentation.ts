"use client";
import { usePublicSettings } from "../settings/providers/PublicSettingsProvider";
import {
  normalizePresentation,
  PRESENTATION_KEY,
  type Presentation,
} from "./presentation";
export function usePresentation(override?: Presentation) {
  const { settings } = usePublicSettings();
  return override ?? normalizePresentation(settings[PRESENTATION_KEY]);
}
