"use client";

import {
  Suspense,
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { languageHref, parsePublicLanguage } from "./public-language";

import { usePersistentState } from "../hooks";

export type AdminLanguage = "ar" | "en";

type LanguageContextValue = {
  language: AdminLanguage;
  direction: "rtl" | "ltr";
  setLanguage: (language: AdminLanguage) => void;
  toggleLanguage: () => void;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

function LanguageFromUrl({ onLanguage }: { onLanguage: (language: AdminLanguage) => void }) {
  const params = useSearchParams();
  const language = parsePublicLanguage(params.get("lang"));
  useEffect(() => { if (language) onLanguage(language); }, [language, onLanguage]);
  return null;
}

export default function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const router = useRouter();
  const [language, setStoredLanguage] =
    usePersistentState<AdminLanguage>(
      "nour-language",
      "ar",
    );

  const setLanguage = useCallback((next: AdminLanguage) => {
    setStoredLanguage(next);
    const path = window.location.pathname;
    if (path === "/" || path === "/get-app" || path === "/open-app" || path === "/programs" || path.startsWith("/programs/")) {
      router.replace(languageHref(window.location.href, next), { scroll: false });
    }
  }, [router, setStoredLanguage]);

  const direction: "rtl" | "ltr" =
    language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const contextValue =
    useMemo<LanguageContextValue>(
      () => ({
        language,
        direction,
        setLanguage,
        toggleLanguage: () => {
          setLanguage(language === "ar" ? "en" : "ar");
        },
      }),
      [
        direction,
        language,
        setLanguage,
      ],
    );

  return (
    <LanguageContext.Provider
      value={contextValue}
    >
      <div
        dir={direction}
        lang={language}
        className={`nr-language-root nr-admin-language nr-admin-language--${language}`}
      >
        <Suspense fallback={null}><LanguageFromUrl onLanguage={setStoredLanguage} /></Suspense>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider.",
    );
  }

  return context;
}
