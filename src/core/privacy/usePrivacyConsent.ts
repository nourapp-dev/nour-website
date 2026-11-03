"use client";
import { useSyncExternalStore } from "react";
import { consentSnapshot, subscribeConsent } from "./consent";
const serverSnapshot = () => null;
export default function usePrivacyConsent() {
  return useSyncExternalStore(subscribeConsent, consentSnapshot, serverSnapshot);
}
