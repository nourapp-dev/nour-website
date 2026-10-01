"use client";

import { usePublicSettings } from "../providers/PublicSettingsProvider";
import { resolvePublicContact } from "../utils/public-contact";

export default function usePublicContact() {
  const { settings } = usePublicSettings();
  return resolvePublicContact(settings);
}
