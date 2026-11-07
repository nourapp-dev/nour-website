"use client";
import { createContext, useContext } from "react";
import { usePublicSettings } from "../settings/providers/PublicSettingsProvider";
import {
  normalizePresentation,
  PRESENTATION_KEY,
  type Presentation,
} from "./presentation";
export const PresentationContext = createContext<Presentation | undefined>(
  undefined,
);
export function usePresentation(override?: Presentation) {
  const { settings } = usePublicSettings();
  const preview = useContext(PresentationContext);
  return (
    override ?? preview ?? normalizePresentation(settings[PRESENTATION_KEY])
  );
}
