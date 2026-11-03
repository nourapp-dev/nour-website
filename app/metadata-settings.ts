import { cache } from "react";
import { getPublicServerSettings as readPublicSettings } from "../src/server/settings/public-settings.server";

// Deduplicate layout/page metadata reads within one server render only.
// No shared user session or persistent cross-request cache is introduced.
export const getPublicServerSettings = cache(readPublicSettings);
export { getServerTextSetting } from "../src/server/settings/public-settings.server";
